/**
 * Validators
 * Input validation and response validation utilities
 */

import type { InvoiceData, InvoiceItem } from '../types/invoice';

/**
 * Validate Gemini API response
 * Ensures the response matches expected schema
 */
export function validateInvoiceResponse(data: unknown): {
    valid: boolean;
    errors: string[];
    data: InvoiceData | null;
} {
    const errors: string[] = [];

    if (!data || typeof data !== 'object') {
        return { valid: false, errors: ['Invalid response: not an object'], data: null };
    }

    const obj = data as Record<string, unknown>;

    // Check required fields
    if (!obj.currency || typeof obj.currency !== 'string') {
        errors.push('Missing or invalid currency');
    }

    if (!Array.isArray(obj.items)) {
        errors.push('Missing or invalid items array');
    }

    if (typeof obj.total !== 'number') {
        errors.push('Missing or invalid total');
    }

    // If critical errors, return early
    if (errors.length > 0) {
        return { valid: false, errors, data: null };
    }

    // Validate items
    const items = obj.items as unknown[];
    const validatedItems: InvoiceItem[] = [];

    items.forEach((item, index) => {
        if (!item || typeof item !== 'object') {
            errors.push(`Item ${index + 1}: Invalid item object`);
            return;
        }

        const itemObj = item as Record<string, unknown>;

        // Validate item fields
        if (typeof itemObj.description !== 'string' || !itemObj.description.trim()) {
            errors.push(`Item ${index + 1}: Missing description`);
        }

        const quantity = Number(itemObj.quantity ?? itemObj.qty ?? 1);
        const unitPrice = Number(itemObj.unit_price ?? itemObj.unitPrice ?? itemObj.price ?? 0);

        if (isNaN(quantity) || quantity <= 0) {
            errors.push(`Item ${index + 1}: Invalid quantity`);
        }

        if (isNaN(unitPrice) || unitPrice < 0) {
            errors.push(`Item ${index + 1}: Invalid price`);
        }

        const subtotal = quantity * unitPrice;
        const confidence = Number(itemObj.confidence ?? 1);

        validatedItems.push({
            id: `item-${index + 1}-${Date.now()}`,
            description: String(itemObj.description ?? itemObj.desc ?? '').trim(),
            quantity: Math.max(1, quantity),
            unitPrice: Math.max(0, unitPrice),
            subtotal: Math.round(subtotal * 100) / 100,
            confidence: Math.min(1, Math.max(0, confidence)),
        });
    });

    // Calculate totals
    const subtotal = validatedItems.reduce((sum, item) => sum + item.subtotal, 0);
    const tax = Number(obj.tax ?? 0);
    const discount = Number(obj.discount ?? 0);
    const total = subtotal + tax - discount;
    const parseConfidence = Number(obj.parse_confidence ?? obj.parseConfidence ?? 0.8);

    // Verify total matches (with tolerance)
    const providedTotal = Number(obj.total);
    if (Math.abs(total - providedTotal) > 1) {
        errors.push(`Total mismatch: calculated ${total.toFixed(2)}, provided ${providedTotal.toFixed(2)}`);
    }

    const invoiceData: InvoiceData = {
        currency: String(obj.currency).toUpperCase(),
        items: validatedItems,
        subtotal: Math.round(subtotal * 100) / 100,
        tax: Math.max(0, Math.round(tax * 100) / 100),
        discount: Math.max(0, Math.round(discount * 100) / 100),
        total: Math.round(Math.max(0, total) * 100) / 100,
        parseConfidence: Math.min(1, Math.max(0, parseConfidence)),
    };

    return {
        valid: errors.length === 0,
        errors,
        data: invoiceData,
    };
}

/**
 * Validate input is a valid number
 */
export function isValidNumber(value: unknown): boolean {
    if (typeof value === 'number') {
        return !isNaN(value) && isFinite(value);
    }
    if (typeof value === 'string') {
        const num = parseFloat(value);
        return !isNaN(num) && isFinite(num);
    }
    return false;
}

/**
 * Validate input is a positive number
 */
export function isPositiveNumber(value: unknown): boolean {
    if (!isValidNumber(value)) return false;
    const num = typeof value === 'string' ? parseFloat(value) : (value as number);
    return num > 0;
}

/**
 * Validate input is a non-negative number
 */
export function isNonNegativeNumber(value: unknown): boolean {
    if (!isValidNumber(value)) return false;
    const num = typeof value === 'string' ? parseFloat(value) : (value as number);
    return num >= 0;
}

/**
 * Validate currency code
 */
export function isValidCurrency(code: string): boolean {
    const validCodes = ['INR', 'USD', 'EUR', 'GBP', 'AED'];
    return validCodes.includes(code.toUpperCase());
}

/**
 * Sanitize number input
 * Returns sanitized number or default value
 */
export function sanitizeNumber(value: unknown, defaultValue: number = 0): number {
    if (typeof value === 'number' && !isNaN(value) && isFinite(value)) {
        return value;
    }
    if (typeof value === 'string') {
        const num = parseFloat(value.replace(/[^0-9.-]/g, ''));
        if (!isNaN(num) && isFinite(num)) {
            return num;
        }
    }
    return defaultValue;
}

/**
 * Validate JSON string
 */
export function isValidJSON(str: string): boolean {
    try {
        JSON.parse(str);
        return true;
    } catch {
        return false;
    }
}

/**
 * Parse JSON safely
 */
export function safeParseJSON<T>(str: string, defaultValue: T): T {
    try {
        return JSON.parse(str) as T;
    } catch {
        return defaultValue;
    }
}
