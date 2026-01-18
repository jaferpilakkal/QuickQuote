/**
 * Speech-to-Text Service
 * Converts audio recordings to text using Google Speech-to-Text API
 */

// @ts-ignore - legacy import needed for SDK 52+
import * as FileSystem from 'expo-file-system/legacy';
import { ENV, API, CONFIG } from '../config/env';

/**
 * Word-level confidence data
 */
export interface WordConfidence {
    word: string;
    confidence: number;
    startTime?: number;
    endTime?: number;
}

/**
 * STT result interface
 */
export interface STTResult {
    /** Full transcript text */
    transcript: string;
    /** Overall confidence score (0-1) */
    confidence: number;
    /** Word-level confidence data */
    wordConfidence: WordConfidence[];
    /** Processing duration in ms */
    processingTimeMs: number;
}

/**
 * STT error types
 */
export type STTErrorType =
    | 'NO_AUDIO'
    | 'INVALID_AUDIO'
    | 'API_ERROR'
    | 'NETWORK_ERROR'
    | 'TIMEOUT'
    | 'NO_SPEECH_DETECTED';

/**
 * STT error class
 */
export class STTError extends Error {
    constructor(
        public type: STTErrorType,
        message: string,
        public retryable: boolean = true
    ) {
        super(message);
        this.name = 'STTError';
    }
}

/**
 * Convert audio file to base64
 */
async function audioToBase64(audioUri: string): Promise<string> {
    try {
        const base64 = await FileSystem.readAsStringAsync(audioUri, {
            encoding: 'base64',
        });
        return base64;
    } catch (error) {
        throw new STTError('INVALID_AUDIO', 'Failed to read audio file', false);
    }
}

/**
 * Calculate exponential backoff delay
 */
function getBackoffDelay(attempt: number): number {
    const delay = CONFIG.RETRY_INITIAL_DELAY_MS * Math.pow(2, attempt);
    return Math.min(delay, CONFIG.RETRY_MAX_DELAY_MS);
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Speech-to-Text Service
 */
export const sttService = {
    /**
     * Transcribe audio file to text
     * @param audioUri - URI of the audio file to transcribe
     * @returns STT result with transcript and confidence
     */
    async transcribe(audioUri: string): Promise<STTResult> {
        const startTime = Date.now();

        // Validate audio URI
        if (!audioUri) {
            throw new STTError('NO_AUDIO', 'No audio URI provided', false);
        }

        // Convert audio to base64 (will throw if file doesn't exist)
        const audioBase64 = await audioToBase64(audioUri);

        // Prepare request
        const requestBody = {
            config: {
                encoding: 'MP3', // AAC in M4A container - use LINEAR16 or FLAC for better accuracy
                sampleRateHertz: 16000,
                languageCode: 'en-US', // US English as default
                alternativeLanguageCodes: ['en-GB', 'en-AU', 'en-IN'],
                enableWordConfidence: true,
                enableAutomaticPunctuation: true,
                model: 'latest_long',
                useEnhanced: true,
            },
            audio: {
                content: audioBase64,
            },
        };

        // Retry loop
        let lastError: Error | null = null;
        for (let attempt = 0; attempt < CONFIG.MAX_RETRIES; attempt++) {
            try {
                const response = await fetch(
                    `${API.STT}?key=${ENV.GOOGLE_STT_API_KEY}`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(requestBody),
                    }
                );

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    const errorMessage = errorData?.error?.message || `HTTP ${response.status}`;

                    if (response.status === 400) {
                        throw new STTError('INVALID_AUDIO', errorMessage, false);
                    } else if (response.status === 401 || response.status === 403) {
                        throw new STTError('API_ERROR', 'Invalid API key', false);
                    } else if (response.status >= 500) {
                        throw new STTError('API_ERROR', errorMessage, true);
                    } else {
                        throw new STTError('API_ERROR', errorMessage, attempt < CONFIG.MAX_RETRIES - 1);
                    }
                }

                const data = await response.json();

                // Check for empty results (no speech detected)
                if (!data.results || data.results.length === 0) {
                    throw new STTError(
                        'NO_SPEECH_DETECTED',
                        'No speech was detected in the audio',
                        false
                    );
                }

                // Parse response
                const result = data.results[0];
                const alternative = result.alternatives?.[0];

                if (!alternative) {
                    throw new STTError(
                        'NO_SPEECH_DETECTED',
                        'No transcript available',
                        false
                    );
                }

                // Extract word-level confidence
                const wordConfidence: WordConfidence[] = (alternative.words || []).map(
                    (w: any) => ({
                        word: w.word,
                        confidence: w.confidence || 0,
                        startTime: parseFloat(w.startTime?.replace('s', '') || '0'),
                        endTime: parseFloat(w.endTime?.replace('s', '') || '0'),
                    })
                );

                const processingTimeMs = Date.now() - startTime;
                console.log(`[STT] Transcription completed in ${processingTimeMs}ms`);

                return {
                    transcript: alternative.transcript || '',
                    confidence: alternative.confidence || 0,
                    wordConfidence,
                    processingTimeMs,
                };

            } catch (error) {
                lastError = error as Error;

                if (error instanceof STTError && !error.retryable) {
                    throw error;
                }

                // Network error or timeout
                if (error instanceof TypeError && error.message.includes('fetch')) {
                    lastError = new STTError('NETWORK_ERROR', 'Network request failed', true);
                }

                // Wait before retry
                if (attempt < CONFIG.MAX_RETRIES - 1) {
                    const delay = getBackoffDelay(attempt);
                    console.log(`[STT] Retry ${attempt + 1}/${CONFIG.MAX_RETRIES} after ${delay}ms`);
                    await sleep(delay);
                }
            }
        }

        // All retries exhausted
        throw lastError || new STTError('API_ERROR', 'Max retries exceeded', false);
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
