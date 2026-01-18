/**
 * Calculation Utilities
 * Safe decimal arithmetic for currency calculations
 */

/**
 * Round a number to 2 decimal places
 */
export function roundCurrency(amount: number): number {
    return Math.round(amount * 100) / 100;
}

/**
 * Calculate line item amount
 */
export function calculateItemAmount(quantity: number, unitPrice: number): number {
    return roundCurrency(quantity * unitPrice);
}

/**
 * Calculate invoice totals
 */
export function calculateTotals(
    subtotal: number,
    taxPercent: number,
    discountPercent: number
): { taxAmount: number; discountAmount: number; total: number } {
    const taxAmount = roundCurrency(subtotal * (taxPercent / 100));
    const discountAmount = roundCurrency(subtotal * (discountPercent / 100));
    const total = roundCurrency(subtotal + taxAmount - discountAmount);

    return {
        taxAmount,
        discountAmount,
        total,
    };
}
