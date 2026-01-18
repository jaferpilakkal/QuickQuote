import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, ANIMATION } from '../../constants/theme';
import type { InvoiceItem } from '../../types/invoice';

interface InvoiceItemCardProps {
    /** Invoice item data */
    item: InvoiceItem;
    /** Format currency function */
    formatCurrency: (amount: number) => string;
    /** Edit handler */
    onEdit: (item: InvoiceItem) => void;
    /** Delete handler */
    onDelete: (itemId: string) => void;
}

/**
 * InvoiceItemCard Component
 * Displays description, mode checks, and edit/delete actions
 */
export function InvoiceItemCard({ item, formatCurrency, onEdit, onDelete }: InvoiceItemCardProps) {
    const isLowConfidence = item.confidence < 0.6;

    return (
        <View
            style={[styles.container, isLowConfidence && styles.lowConfidence]}
        >
            <View style={styles.header}>
                <Text style={styles.description} numberOfLines={2}>
                    {item.description || 'No description'}
                </Text>
                <Text style={styles.amount}>{formatCurrency(item.amount)}</Text>
            </View>

            <View style={styles.details}>
                <View style={styles.detailRow}>
                    <Text style={styles.detailText}>
                        <Text style={styles.quantity}>{item.quantity}</Text> × {formatCurrency(item.unitPrice)}
                    </Text>
                </View>

                <View style={styles.actions}>
                    {/* Explicit Edit Button */}
                    <TouchableOpacity
                        onPress={() => onEdit(item)}
                        style={styles.editButton}
                        hitSlop={{ top: 10, bottom: 10, left: 5, right: 5 }}
                    >
                        <Text style={styles.editText}>✎ Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => onDelete(item.id)}
                        style={styles.deleteButton}
                        hitSlop={{ top: 10, bottom: 10, left: 5, right: 10 }}
                    >
                        <Text style={styles.deleteText}>Delete</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {isLowConfidence && (
                <View style={styles.warningParams}>
                    <Text style={styles.warningText}>⚠️ Low confidence - please verify</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.backgroundWhite,
        borderRadius: RADIUS.md,
        padding: SPACING.md,
        marginBottom: SPACING.sm,
        ...SHADOWS.sm,
        borderWidth: 1,
        borderColor: COLORS.border.light,
    },
    lowConfidence: {
        borderColor: COLORS.warning,
        backgroundColor: '#FFF9F0',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: SPACING.xs,
    },
    description: {
        ...TYPOGRAPHY.body,
        fontWeight: '600',
        flex: 1,
        marginRight: SPACING.sm,
    },
    amount: {
        ...TYPOGRAPHY.h3,
        fontSize: 18,
        color: COLORS.primary,
    },
    details: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailText: {
        ...TYPOGRAPHY.caption,
        color: COLORS.text.secondary,
        fontSize: 14,
    },
    quantity: {
        fontWeight: 'bold',
        color: COLORS.text.primary,
    },
    actions: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    editButton: {
        paddingHorizontal: SPACING.sm,
        paddingVertical: 4,
        borderRadius: RADIUS.full,
        backgroundColor: COLORS.surfaceSecondary,
        marginRight: 4,
    },
    editText: {
        ...TYPOGRAPHY.caption,
        color: COLORS.primary,
        fontWeight: '600',
    },
    deleteButton: {
        paddingHorizontal: SPACING.sm,
        paddingVertical: 4,
        borderRadius: RADIUS.full,
        backgroundColor: COLORS.surfaceSecondary,
    },
    deleteText: {
        ...TYPOGRAPHY.caption,
        color: COLORS.error,
        fontWeight: '600',
    },
    warningParams: {
        marginTop: SPACING.xs,
        paddingTop: SPACING.xs,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 152, 0, 0.2)',
    },
    warningText: {
        ...TYPOGRAPHY.caption,
        color: COLORS.warning,
        fontSize: 12,
    },
});
