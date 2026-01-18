/**
 * useInvoiceEditor Hook
 * Manages invoice editing state, items, and calculations
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { ParsedInvoice, InvoiceItem } from '../types/invoice';
import { calculateItemAmount, calculateTotals, roundCurrency } from '../utils/calculations';

interface UseInvoiceEditorReturn {
    /** Current invoice state */
    invoice: ParsedInvoice;
    /** Whether there are unsaved changes */
    hasUnsavedChanges: boolean;
    /** Update a specific item */
    updateItem: (itemId: string, updates: Partial<InvoiceItem>) => void;
    /** Add a new empty item */
    addItem: () => void;
    /** Delete an item */
    deleteItem: (itemId: string) => void;
    /** Update invoice metadata (tax, discount, notes) */
    updateInvoice: (updates: Partial<ParsedInvoice>) => void;
    /** Save invoice (placeholder for DB integration) */
    saveInvoice: () => Promise<void>;
}

export function useInvoiceEditor(initialInvoice: ParsedInvoice): UseInvoiceEditorReturn {
    const [invoice, setInvoice] = useState<ParsedInvoice>(initialInvoice);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    /**
     * Recalculate totals whenever items, tax, or discount change
     */
    const recalculate = useCallback((currentInvoice: ParsedInvoice): ParsedInvoice => {
        const subtotal = currentInvoice.items.reduce((sum, item) => sum + item.amount, 0);

        const { taxAmount, discountAmount, total } = calculateTotals(
            subtotal,
            currentInvoice.taxPercent,
            currentInvoice.discountPercent
        );

        return {
            ...currentInvoice,
            subtotal,
            taxAmount,
            discountAmount,
            total,
        };
    }, []);

    /**
     * Update a specific item
     */
    const updateItem = useCallback((itemId: string, updates: Partial<InvoiceItem>) => {
        setInvoice((prev) => {
            const updatedItems = prev.items.map((item) => {
                if (item.id !== itemId) return item;

                const newItem = { ...item, ...updates };

                // Recalculate amount if quantity or price changed
                if (updates.quantity !== undefined || updates.unitPrice !== undefined) {
                    newItem.amount = calculateItemAmount(newItem.quantity, newItem.unitPrice);
                }

                return newItem;
            });

            return recalculate({ ...prev, items: updatedItems });
        });
        setHasUnsavedChanges(true);
    }, [recalculate]);

    /**
     * Add a new empty item
     */
    const addItem = useCallback(() => {
        const newItem: InvoiceItem = {
            id: `item_${Date.now()}`,
            description: '',
            quantity: 1,
            unitPrice: 0,
            amount: 0,
            confidence: 1, // Manual items have high confidence
        };

        setInvoice((prev) => recalculate({
            ...prev,
            items: [...prev.items, newItem],
        }));
        setHasUnsavedChanges(true);
    }, [recalculate]);

    /**
     * Delete an item
     */
    const deleteItem = useCallback((itemId: string) => {
        setInvoice((prev) => recalculate({
            ...prev,
            items: prev.items.filter((item) => item.id !== itemId),
        }));
        setHasUnsavedChanges(true);
    }, [recalculate]);

    /**
     * Update invoice metadata (tax, discount, notes)
     */
    const updateInvoice = useCallback((updates: Partial<ParsedInvoice>) => {
        setInvoice((prev) => {
            // Apply updates
            const updated = { ...prev, ...updates };
            // Recalculate totals if tax/discount changed
            return recalculate(updated);
        });
        setHasUnsavedChanges(true);
    }, [recalculate]);

    /**
     * Save invoice
     */
    const saveInvoice = useCallback(async () => {
        // TODO: Persist to database
        console.log('Saving invoice:', invoice);
        setHasUnsavedChanges(false);
    }, [invoice]);

    return {
        invoice,
        hasUnsavedChanges,
        updateItem,
        addItem,
        deleteItem,
        updateInvoice,
        saveInvoice,
    };
}
