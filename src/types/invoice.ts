/**
 * Invoice Data Types
 * Based on PRD Section 6.C and Development Package Section 3.3
 */

/**
 * Individual line item in an invoice
 */
export interface InvoiceItem {
    /** Unique identifier for the item */
    id: string;
    /** Description of the service/product */
    description: string;
    /** Quantity of items */
    quantity: number;
    /** Price per unit */
    unitPrice: number;
    /** Calculated amount (quantity × unitPrice) */
    amount: number;
    /** AI confidence score for this item (0-1) */
    confidence: number;
}

/**
 * Invoice status
 */
export type InvoiceStatus = 'draft' | 'processing' | 'completed' | 'shared' | 'error';

/**
 * Parsed invoice from AI processing
 */
export interface ParsedInvoice {
    /** Unique identifier */
    id: string;
    /** List of invoice items */
    items: InvoiceItem[];
    /** Sum of all item amounts */
    subtotal: number;
    /** Tax percentage */
    taxPercent: number;
    /** Tax amount */
    taxAmount: number;
    /** Discount percentage */
    discountPercent: number;
    /** Discount amount */
    discountAmount: number;
    /** Final total */
    total: number;
    /** ISO 4217 currency code */
    currency: string;
    /** Optional notes */
    notes?: string;
    /** Original voice transcript */
    originalTranscript: string;
    /** Creation timestamp */
    createdAt: string;
    /** Invoice status */
    status: InvoiceStatus;
    /** Audio file URI */
    audioUri?: string;
}

/**
 * Complete invoice data structure (legacy)
 */
export interface InvoiceData {
    /** ISO 4217 currency code */
    currency: string;
    /** List of invoice items */
    items: InvoiceItem[];
    /** Sum of all item subtotals */
    subtotal: number;
    /** Tax amount */
    tax: number;
    /** Discount amount */
    discount: number;
    /** Final total (subtotal + tax - discount) */
    total: number;
    /** Overall AI parsing confidence (0-1) */
    parseConfidence: number;
    /** Optional metadata */
    metadata?: InvoiceMetadata;
}

/**
 * Optional invoice metadata
 */
export interface InvoiceMetadata {
    /** Client/customer name */
    clientName?: string;
    /** Invoice number (if auto-generated) */
    invoiceNumber?: string;
    /** Invoice date */
    date?: string;
    /** Any additional notes */
    notes?: string;
}

/**
 * Confidence level classification
 */
export type ConfidenceLevel = 'high' | 'medium' | 'low';

/**
 * Get confidence level from numeric score
 */
export function getConfidenceLevel(confidence: number): ConfidenceLevel {
    if (confidence >= 0.85) return 'high';
    if (confidence >= 0.6) return 'medium';
    return 'low';
}

/**
 * Supported currencies
 */
export const SUPPORTED_CURRENCIES = {
    INR: { symbol: '₹', name: 'Indian Rupee', locale: 'en-IN' },
    USD: { symbol: '$', name: 'US Dollar', locale: 'en-US' },
    EUR: { symbol: '€', name: 'Euro', locale: 'de-DE' },
    GBP: { symbol: '£', name: 'British Pound', locale: 'en-GB' },
    AED: { symbol: 'د.إ', name: 'UAE Dirham', locale: 'ar-AE' },
} as const;

export type CurrencyCode = keyof typeof SUPPORTED_CURRENCIES;

/**
 * Default currency
 */
export const DEFAULT_CURRENCY: CurrencyCode = 'INR';

/**
 * Empty invoice template
 */
export function createEmptyInvoice(): InvoiceData {
    return {
        currency: DEFAULT_CURRENCY,
        items: [],
        subtotal: 0,
        tax: 0,
        discount: 0,
        total: 0,
        parseConfidence: 1,
    };
}

/**
 * Create a new invoice item
 */
export function createEmptyItem(): InvoiceItem {
    return {
        id: '',
        description: '',
        quantity: 1,
        unitPrice: 0,
        amount: 0,
        confidence: 1,
    };
}

/**
 * Create empty parsed invoice
 */
export function createEmptyParsedInvoice(): ParsedInvoice {
    return {
        id: `inv_${Date.now()}`,
        items: [],
        subtotal: 0,
        taxPercent: 0,
        taxAmount: 0,
        discountPercent: 0,
        discountAmount: 0,
        total: 0,
        currency: DEFAULT_CURRENCY,
        originalTranscript: '',
        createdAt: new Date().toISOString(),
        status: 'draft',
    };
}

