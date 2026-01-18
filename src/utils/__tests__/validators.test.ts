/**
 * Validators unit tests
 */

import {
    isValidNumber,
    isPositiveNumber,
    isNonNegativeNumber,
    isValidCurrency,
    sanitizeNumber,
    isValidJSON,
    safeParseJSON,
} from '../validators';

describe('validators', () => {
    describe('isValidNumber', () => {
        it('should return true for valid numbers', () => {
            expect(isValidNumber(42)).toBe(true);
            expect(isValidNumber(0)).toBe(true);
            expect(isValidNumber(-10)).toBe(true);
            expect(isValidNumber(3.14)).toBe(true);
        });

        it('should return true for valid string numbers', () => {
            expect(isValidNumber('42')).toBe(true);
            expect(isValidNumber('3.14')).toBe(true);
        });

        it('should return false for invalid values', () => {
            expect(isValidNumber(NaN)).toBe(false);
            expect(isValidNumber(Infinity)).toBe(false);
            expect(isValidNumber('abc')).toBe(false);
            expect(isValidNumber(null)).toBe(false);
            expect(isValidNumber(undefined)).toBe(false);
        });
    });

    describe('isPositiveNumber', () => {
        it('should return true for positive numbers', () => {
            expect(isPositiveNumber(1)).toBe(true);
            expect(isPositiveNumber(100)).toBe(true);
            expect(isPositiveNumber(0.5)).toBe(true);
        });

        it('should return false for zero and negative', () => {
            expect(isPositiveNumber(0)).toBe(false);
            expect(isPositiveNumber(-1)).toBe(false);
        });
    });

    describe('isNonNegativeNumber', () => {
        it('should return true for zero and positive', () => {
            expect(isNonNegativeNumber(0)).toBe(true);
            expect(isNonNegativeNumber(1)).toBe(true);
        });

        it('should return false for negative', () => {
            expect(isNonNegativeNumber(-1)).toBe(false);
        });
    });

    describe('isValidCurrency', () => {
        it('should return true for supported currencies', () => {
            expect(isValidCurrency('INR')).toBe(true);
            expect(isValidCurrency('USD')).toBe(true);
            expect(isValidCurrency('EUR')).toBe(true);
            expect(isValidCurrency('GBP')).toBe(true);
            expect(isValidCurrency('AED')).toBe(true);
        });

        it('should be case insensitive', () => {
            expect(isValidCurrency('inr')).toBe(true);
            expect(isValidCurrency('Usd')).toBe(true);
        });

        it('should return false for unsupported currencies', () => {
            expect(isValidCurrency('JPY')).toBe(false);
            expect(isValidCurrency('XYZ')).toBe(false);
        });
    });

    describe('sanitizeNumber', () => {
        it('should return number as-is', () => {
            expect(sanitizeNumber(42)).toBe(42);
        });

        it('should parse string numbers', () => {
            expect(sanitizeNumber('100')).toBe(100);
            expect(sanitizeNumber('₹500')).toBe(500);
        });

        it('should return default for invalid', () => {
            expect(sanitizeNumber('abc', 0)).toBe(0);
            expect(sanitizeNumber(null, 10)).toBe(10);
        });
    });

    describe('isValidJSON', () => {
        it('should return true for valid JSON', () => {
            expect(isValidJSON('{"a":1}')).toBe(true);
            expect(isValidJSON('[1,2,3]')).toBe(true);
            expect(isValidJSON('"hello"')).toBe(true);
        });

        it('should return false for invalid JSON', () => {
            expect(isValidJSON('{')).toBe(false);
            expect(isValidJSON('not json')).toBe(false);
        });
    });

    describe('safeParseJSON', () => {
        it('should parse valid JSON', () => {
            expect(safeParseJSON('{"a":1}', {})).toEqual({ a: 1 });
        });

        it('should return default for invalid', () => {
            expect(safeParseJSON('invalid', { fallback: true })).toEqual({ fallback: true });
        });
    });
});
