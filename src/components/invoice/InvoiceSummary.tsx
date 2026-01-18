import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

interface InvoiceSummaryProps {
    subtotal: number;
    taxPercent: number;
    taxAmount: number;
    discountPercent: number;
    discountAmount: number;
    total: number;
    currencySymbol: string;
    formatCurrency: (amount: number) => string;
}

/**
 * InvoiceSummary Component
 * Displays the calculation summary
 */
export function InvoiceSummary({
    subtotal,
    taxPercent,
    taxAmount,
    discountPercent,
    discountAmount,
    total,
    currencySymbol,
    formatCurrency,
}: InvoiceSummaryProps) {
    return (
        <View style={styles.container}>
            <View style={styles.row}>
                <Text style={styles.label}>Subtotal</Text>
                <Text style={styles.value}>{formatCurrency(subtotal)}</Text>
            </View>

            <View style={styles.row}>
                <Text style={styles.label}>Tax ({taxPercent}%)</Text>
                <Text style={styles.value}>+ {formatCurrency(taxAmount)}</Text>
            </View>

            {discountAmount > 0 && (
                <View style={styles.row}>
                    <Text style={styles.label}>Discount ({discountPercent}%)</Text>
                    <Text style={[styles.value, styles.discount]}>- {formatCurrency(discountAmount)}</Text>
                </View>
            )}

            <View style={styles.divider} />

            <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.backgroundWhite,
        borderRadius: RADIUS.lg,
        padding: SPACING.md,
        ...SHADOWS.md,
        marginTop: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.border.light,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: SPACING.sm,
    },
    label: {
        ...TYPOGRAPHY.body,
        color: COLORS.text.secondary,
    },
    value: {
        ...TYPOGRAPHY.body,
        color: COLORS.text.primary,
        fontWeight: '500',
    },
    discount: {
        color: COLORS.success,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.border.light,
        marginVertical: SPACING.sm,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    totalLabel: {
        ...TYPOGRAPHY.h3,
        fontSize: 18,
    },
    totalValue: {
        ...TYPOGRAPHY.h3,
        fontSize: 24,
        color: COLORS.primary,
    },
});
