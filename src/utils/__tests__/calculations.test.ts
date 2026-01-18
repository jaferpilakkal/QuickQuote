/**
 * Calculations unit tests
 */

import {
    roundCurrency,
    calculateItemAmount,
    calculateTotals,
} from '../calculations';

describe('calculations', () => {
    describe('roundCurrency', () => {
        it('should round to 2 decimal places', () => {
            expect(roundCurrency(10.125)).toBe(10.13);
            expect(roundCurrency(10.124)).toBe(10.12);
            expect(roundCurrency(10.1)).toBe(10.1);
        });

        it('should handle whole numbers', () => {
            expect(roundCurrency(100)).toBe(100);
            expect(roundCurrency(0)).toBe(0);
        });

        it('should handle negative numbers', () => {
            expect(roundCurrency(-10.125)).toBe(-10.12);
        });
    });

    describe('calculateItemAmount', () => {
        it('should calculate quantity × unitPrice', () => {
            expect(calculateItemAmount(2, 100)).toBe(200);
            expect(calculateItemAmount(3, 33.33)).toBe(99.99);
            expect(calculateItemAmount(1.5, 10)).toBe(15);
        });

        it('should handle zero values', () => {
            expect(calculateItemAmount(0, 100)).toBe(0);
            expect(calculateItemAmount(5, 0)).toBe(0);
        });
    });

    describe('calculateTotals', () => {
        it('should calculate tax, discount, and total', () => {
            const result = calculateTotals(1000, 10, 5);
            expect(result.taxAmount).toBe(100);
            expect(result.discountAmount).toBe(50);
            expect(result.total).toBe(1050);
        });

        it('should handle zero percentages', () => {
            const result = calculateTotals(1000, 0, 0);
            expect(result.taxAmount).toBe(0);
            expect(result.discountAmount).toBe(0);
            expect(result.total).toBe(1000);
        });

        it('should handle decimal subtotals', () => {
            const result = calculateTotals(99.99, 18, 0);
            expect(result.taxAmount).toBe(18);
            expect(result.total).toBe(117.99);
        });

        it('should handle high discount', () => {
            const result = calculateTotals(100, 0, 100);
            expect(result.discountAmount).toBe(100);
            expect(result.total).toBe(0);
        });
    });
});
