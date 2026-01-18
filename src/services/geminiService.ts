/**
 * Gemini Parser Service
 * Extracts structured invoice data from transcripts using Google Gemini
 */

import { ENV, API, CONFIG } from '../config/env';
import { buildInvoiceExtractionPrompt, buildFallbackPrompt, InvoiceExtractionOptions } from '../utils/promptTemplates';
import type { InvoiceItem, ParsedInvoice } from '../types/invoice';

/**
 * Gemini API response structure
 */
interface GeminiResponse {
    candidates?: Array<{
        content?: {
            parts?: Array<{
                text?: string;
            }>;
        };
        finishReason?: string;
    }>;
    error?: {
        message: string;
        code: number;
    };
}

/**
 * Raw parsed invoice from Gemini
 */
interface RawParsedInvoice {
    items: Array<{
        description: string;
        quantity: number;
        unitPrice: number;
        amount: number;
        confidence: number;
    }>;
    subtotal: number;
    taxPercent: number;
    taxAmount: number;
    discountPercent: number;
    discountAmount: number;
    total: number;
    currency: string;
    notes?: string;
}

/**
 * Gemini error types
 */
export type GeminiErrorType =
    | 'API_ERROR'
    | 'PARSE_ERROR'
    | 'VALIDATION_ERROR'
    | 'NETWORK_ERROR'
    | 'TIMEOUT'
    | 'EMPTY_RESPONSE';

/**
 * Gemini error class
 */
export class GeminiError extends Error {
    constructor(
        public type: GeminiErrorType,
        message: string,
        public retryable: boolean = true
    ) {
        super(message);
        this.name = 'GeminiError';
    }
}

/**
 * Extract JSON from text (handles markdown code blocks)
 */
function extractJSON(text: string): string {
    // Remove markdown code blocks if present
    let cleaned = text.trim();

    // Handle ```json ... ``` format
    const jsonBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonBlockMatch) {
        cleaned = jsonBlockMatch[1].trim();
    }

    // Find JSON object
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        return jsonMatch[0];
    }

    return cleaned;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay
 */
function getBackoffDelay(attempt: number): number {
    const delay = CONFIG.RETRY_INITIAL_DELAY_MS * Math.pow(2, attempt);
    return Math.min(delay, CONFIG.RETRY_MAX_DELAY_MS);
}

/**
 * Gemini Parser Service
 */
export const geminiService = {
    /**
     * Parse transcript into structured invoice data
     * @param transcript - The transcript text to parse
     * @param options - Optional settings for currency and tax rate
     * @returns Parsed invoice data
     */
    async parseTranscript(
        transcript: string,
        options?: InvoiceExtractionOptions
    ): Promise<ParsedInvoice> {
        const startTime = Date.now();

        if (!transcript || transcript.trim().length === 0) {
            throw new GeminiError('EMPTY_RESPONSE', 'No transcript to parse', false);
        }

        const prompt = buildInvoiceExtractionPrompt(transcript, options);

        // Prepare request
        const requestBody = {
            contents: [
                {
                    parts: [
                        {
                            text: prompt,
                        },
                    ],
                },
            ],
            generationConfig: {
                temperature: 0.1, // Low temperature for consistent output
                topP: 0.8,
                topK: 40,
                maxOutputTokens: 1024,
            },
        };

        // Retry loop
        let lastError: Error | null = null;
        for (let attempt = 0; attempt < CONFIG.MAX_RETRIES; attempt++) {
            try {
                const response = await fetch(
                    `${API.GEMINI}?key=${ENV.GEMINI_API_KEY}`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(requestBody),
                    }
                );

                const data: GeminiResponse = await response.json();

                if (!response.ok || data.error) {
                    const errorMessage = data.error?.message || `HTTP ${response.status}`;

                    if (response.status === 401 || response.status === 403) {
                        throw new GeminiError('API_ERROR', 'Invalid API key', false);
                    } else if (response.status === 429) {
                        throw new GeminiError('API_ERROR', 'Rate limit exceeded', true);
                    } else if (response.status >= 500) {
                        throw new GeminiError('API_ERROR', errorMessage, true);
                    } else {
                        throw new GeminiError('API_ERROR', errorMessage, attempt < CONFIG.MAX_RETRIES - 1);
                    }
                }

                // Extract text from response
                const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (!text) {
                    throw new GeminiError('EMPTY_RESPONSE', 'No response from Gemini', true);
                }

                // Parse JSON from response
                const jsonString = extractJSON(text);
                let rawInvoice: RawParsedInvoice;

                try {
                    rawInvoice = JSON.parse(jsonString);
                } catch (parseError) {
                    console.error('[Gemini] JSON parse error:', parseError);
                    console.error('[Gemini] Raw text:', text);
                    throw new GeminiError('PARSE_ERROR', 'Failed to parse Gemini response as JSON', true);
                }

                // Validate and transform to our invoice format
                const parsedInvoice = this.transformToInvoice(rawInvoice, transcript);

                const processingTimeMs = Date.now() - startTime;
                console.log(`[Gemini] Parsing completed in ${processingTimeMs}ms`);

                return parsedInvoice;

            } catch (error) {
                lastError = error as Error;

                if (error instanceof GeminiError && !error.retryable) {
                    throw error;
                }

                // Network error
                if (error instanceof TypeError && error.message.includes('fetch')) {
                    lastError = new GeminiError('NETWORK_ERROR', 'Network request failed', true);
                }

                // Wait before retry
                if (attempt < CONFIG.MAX_RETRIES - 1) {
                    const delay = getBackoffDelay(attempt);
                    console.log(`[Gemini] Retry ${attempt + 1}/${CONFIG.MAX_RETRIES} after ${delay}ms`);
                    await sleep(delay);
                }
            }
        }

        // All retries exhausted, try fallback
        console.log('[Gemini] Main parser failed, trying fallback');
        try {
            return await this.fallbackParse(transcript);
        } catch {
            throw lastError || new GeminiError('API_ERROR', 'Max retries exceeded', false);
        }
    },

    /**
     * Transform raw Gemini response to our invoice format
     */
    transformToInvoice(raw: RawParsedInvoice, originalTranscript: string): ParsedInvoice {
        const items: InvoiceItem[] = (raw.items || []).map((item, index) => ({
            id: `item_${Date.now()}_${index}`,
            description: item.description || 'Unknown item',
            quantity: Math.max(0, item.quantity || 1),
            unitPrice: Math.max(0, item.unitPrice || 0),
            amount: Math.max(0, item.amount || (item.quantity * item.unitPrice)),
            confidence: Math.min(1, Math.max(0, item.confidence || 0.5)),
        }));

        // Recalculate totals for accuracy
        const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
        const taxPercent = raw.taxPercent || 0;
        const taxAmount = subtotal * (taxPercent / 100);
        const discountPercent = raw.discountPercent || 0;
        const discountAmount = subtotal * (discountPercent / 100);
        const total = subtotal + taxAmount - discountAmount;

        return {
            id: `inv_${Date.now()}`,
            items,
            subtotal: Math.round(subtotal * 100) / 100,
            taxPercent,
            taxAmount: Math.round(taxAmount * 100) / 100,
            discountPercent,
            discountAmount: Math.round(discountAmount * 100) / 100,
            total: Math.round(total * 100) / 100,
            currency: raw.currency || 'INR',
            notes: raw.notes || '',
            originalTranscript,
            createdAt: new Date().toISOString(),
            status: 'draft',
        };
    },

    /**
     * Fallback parser using simpler prompt
     */
    async fallbackParse(transcript: string, options?: InvoiceExtractionOptions): Promise<ParsedInvoice> {
        const prompt = buildFallbackPrompt(transcript, options);
        const currency = options?.currency || 'INR';
        const taxRate = options?.taxRate ?? 0;

        const requestBody = {
            contents: [
                {
                    parts: [{ text: prompt }],
                },
            ],
            generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 512,
            },
        };

        const response = await fetch(
            `${API.GEMINI}?key=${ENV.GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            }
        );

        if (!response.ok) {
            throw new GeminiError('API_ERROR', 'Fallback parser failed', false);
        }

        const data: GeminiResponse = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            throw new GeminiError('EMPTY_RESPONSE', 'No fallback response', false);
        }

        try {
            const jsonString = extractJSON(text);
            const rawInvoice = JSON.parse(jsonString);
            return this.transformToInvoice(rawInvoice, transcript);
        } catch {
            // Return empty invoice as last resort with user's settings
            return {
                id: `inv_${Date.now()}`,
                items: [],
                subtotal: 0,
                taxPercent: taxRate,
                taxAmount: 0,
                discountPercent: 0,
                discountAmount: 0,
                total: 0,
                currency: currency,
                notes: 'Failed to parse transcript. Please add items manually.',
                originalTranscript: transcript,
                createdAt: new Date().toISOString(),
                status: 'draft',
            };
        }
    },

    /**
     * Get average confidence for an invoice
     */
    getAverageConfidence(invoice: ParsedInvoice): number {
        if (invoice.items.length === 0) return 0;
        const sum = invoice.items.reduce((acc, item) => acc + item.confidence, 0);
        return sum / invoice.items.length;
    },

    /**
     * Get confidence level classification
     */
    getConfidenceLevel(confidence: number): 'high' | 'medium' | 'low' {
        if (confidence >= 0.85) return 'high';
        if (confidence >= 0.60) return 'medium';
        return 'low';
    },
};
