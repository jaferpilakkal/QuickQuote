/**
 * Prompt Templates for AI Services
 * Optimized prompts for invoice extraction with settings support
 */

/**
 * Invoice extraction options
 */
export interface InvoiceExtractionOptions {
  /** Default currency to use if not mentioned in transcript */
  currency?: string;
  /** Default tax rate percentage to apply */
  taxRate?: number;
}

/**
 * Build the full prompt for invoice extraction with settings support
 */
export function buildInvoiceExtractionPrompt(
  transcript: string,
  options?: InvoiceExtractionOptions
): string {
  const currency = options?.currency || 'INR';
  const taxRate = options?.taxRate ?? 0;

  const prompt = `You are an intelligent invoice extraction assistant. Extract billable items from the following voice transcript.

CONTEXT:
- Default currency: ${currency}
- Default tax rate: ${taxRate}%

DETECTION RULES:
1. Detect ANY billable item: products, services, labor, consulting, repairs, installations, deliveries, etc.
2. Extract items with their quantities and prices
3. If quantity is not specified, assume 1
4. If a rate is given (e.g., "300 per hour"), calculate: quantity × rate
5. Recognize labor/time-based billing: "2 hours at 500" = 2 × 500 = 1000
6. Recognize product pricing: "3 items at 200 each" = 3 × 200 = 600
7. If no currency is mentioned in transcript, use: ${currency}
8. If no tax is mentioned in transcript, apply default tax rate: ${taxRate}%
9. Set confidence (0.0-1.0) based on clarity of information

EXAMPLES:
- "Plumber did 3 hours at 500" → item: "Plumbing service", qty: 3, unitPrice: 500
- "Bought 2 shirts for 800 each" → item: "Shirt", qty: 2, unitPrice: 800
- "Repair work total 2500" → item: "Repair work", qty: 1, unitPrice: 2500
- "Consulting for 2 days at 5000 per day" → item: "Consulting", qty: 2, unitPrice: 5000

OUTPUT FORMAT (JSON only, no markdown):
{
  "items": [
    {
      "description": "item/service description",
      "quantity": 1,
      "unitPrice": 0.00,
      "amount": 0.00,
      "confidence": 0.85
    }
  ],
  "subtotal": 0.00,
  "taxPercent": ${taxRate},
  "taxAmount": 0.00,
  "discountPercent": 0,
  "discountAmount": 0.00,
  "total": 0.00,
  "currency": "${currency}",
  "notes": "any additional notes from transcript"
}

TRANSCRIPT:
${transcript}`;

  return prompt;
}

/**
 * Fallback extraction prompt (simpler, for when main prompt fails)
 */
export function buildFallbackPrompt(
  transcript: string,
  options?: InvoiceExtractionOptions
): string {
  const currency = options?.currency || 'INR';
  const taxRate = options?.taxRate ?? 0;

  return `Extract billable items from this text. Return JSON with items array containing description, quantity, unitPrice, amount. Use currency: ${currency}, tax rate: ${taxRate}%. Be concise.

TEXT:
${transcript}`;
}

/**
 * Build compression prompt to clean up transcript
 */
export function buildCompressionPrompt(transcript: string): string {
  return `Clean this transcript by:
1. Remove filler words (um, uh, like, you know)
2. Keep all numbers and prices intact
3. Keep item names and quantities
4. Return only the cleaned text, no explanation

TRANSCRIPT:
${transcript}`;
}
