import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Platform, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useInvoiceEditor } from '../hooks/useInvoiceEditor';
import { InvoiceItemCard } from '../components/invoice/InvoiceItemCard';
import { InvoiceSummary } from '../components/invoice/InvoiceSummary';
import { EditItemModal } from '../components/invoice/EditItemModal';
import { shareService } from '../services/shareService';
import { COLORS, TYPOGRAPHY, SPACING, BUTTON_SIZES, SHADOWS, RADIUS } from '../constants/theme';
import type { ParsedInvoice, InvoiceItem } from '../types/invoice';

interface EditorScreenProps {
    /** Initial invoice data passed from processing screen */
    initialInvoice: ParsedInvoice;
    /** Navigation callback to go back */
    onBack: () => void;
    /** Callback when invoice is saved */
    onSave: (invoice: ParsedInvoice) => void;
}

/**
 * EditorScreen Component
 * Interface to review and edit the parsed invoice
 */
export function EditorScreen({ initialInvoice, onBack, onSave }: EditorScreenProps) {
    const {
        invoice,
        updateItem,
        addItem,
        deleteItem,
        saveInvoice
    } = useInvoiceEditor(initialInvoice);

    const [editingItem, setEditingItem] = useState<InvoiceItem | null>(null);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [isSharing, setIsSharing] = useState(false);

    // Format currency helper
    const formatCurrency = useCallback((amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: invoice.currency,
        }).format(amount);
    }, [invoice.currency]);

    // Handle editing an item
    const handleEditItem = (item: InvoiceItem) => {
        setEditingItem(item);
        setIsEditModalVisible(true);
    };

    const handleSaveItem = (itemId: string, updates: Partial<InvoiceItem>) => {
        updateItem(itemId, updates);
    };

    // Handle delete confirmation
    const handleDeleteItem = (itemId: string) => {
        Alert.alert(
            'Delete Item',
            'Are you sure you want to remove this item?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => deleteItem(itemId) }
            ]
        );
    };

    const handleSave = async () => {
        await saveInvoice();
        onSave(invoice);
    };

    const handleShareInvoice = async () => {
        try {
            setIsSharing(true);
            await shareService.shareInvoice(invoice);
        } catch (error) {
            console.error('Share error:', error);
            Alert.alert('Error', 'Failed to share invoice. Please try again.');
        } finally {
            setIsSharing(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <StatusBar style="dark" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Edit Invoice</Text>
                <TouchableOpacity onPress={handleSave} style={styles.saveHeaderButton}>
                    <Text style={styles.saveText}>Save</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* List of Items */}
                <Text style={styles.sectionTitle}>Items ({invoice.items.length})</Text>

                {invoice.items.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No items added yet</Text>
                    </View>
                ) : (
                    invoice.items.map((item) => (
                        <InvoiceItemCard
                            key={item.id}
                            item={item}
                            formatCurrency={formatCurrency}
                            onEdit={handleEditItem}
                            onDelete={() => handleDeleteItem(item.id)}
                        />
                    ))
                )}

                <TouchableOpacity style={styles.addItemButton} onPress={addItem}>
                    <Text style={styles.addItemText}>+ Add New Item</Text>
                </TouchableOpacity>

                {/* Summary Section */}
                <Text style={styles.sectionTitle}>Summary</Text>
                <InvoiceSummary
                    subtotal={invoice.subtotal}
                    taxPercent={invoice.taxPercent}
                    taxAmount={invoice.taxAmount}
                    discountPercent={invoice.discountPercent}
                    discountAmount={invoice.discountAmount}
                    total={invoice.total}
                    currencySymbol={invoice.currency}
                    formatCurrency={formatCurrency}
                />


            </ScrollView>

            {/* Bottom Actions */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.primaryButton, isSharing && styles.primaryButtonDisabled]}
                    onPress={handleShareInvoice}
                    disabled={isSharing}
                >
                    {isSharing ? (
                        <ActivityIndicator color={COLORS.text.inverse} />
                    ) : (
                        <Text style={styles.primaryButtonText}>Share Invoice</Text>
                    )}
                </TouchableOpacity>
            </View>

            <EditItemModal
                visible={isEditModalVisible}
                item={editingItem}
                onClose={() => setIsEditModalVisible(false)}
                onSave={handleSaveItem}
                currencySymbol={invoice.currency}
            />

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.xl,
        paddingTop: Platform.OS === 'android' ? SPACING.xxl : SPACING.xl,
        paddingBottom: SPACING.lg,
        backgroundColor: COLORS.background,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border.light,
    },
    title: {
        ...TYPOGRAPHY.h2,
        fontSize: 20,
    },
    backButton: {
        padding: SPACING.sm,
        marginLeft: -SPACING.sm, // Negative margin to align visually
    },
    backText: {
        ...TYPOGRAPHY.body,
        color: COLORS.text.secondary,
    },
    saveHeaderButton: {
        padding: SPACING.sm,
        marginRight: -SPACING.sm, // Negative margin to align visually
    },
    saveText: {
        ...TYPOGRAPHY.body,
        color: COLORS.primary,
        fontWeight: '600',
    },
    content: {
        padding: SPACING.lg,
    },
    sectionTitle: {
        ...TYPOGRAPHY.h3,
        fontSize: 18,
        marginTop: SPACING.md,
        marginBottom: SPACING.sm,
    },
    emptyState: {
        padding: SPACING.xl,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.backgroundWhite,
        borderRadius: RADIUS.md,
        marginBottom: SPACING.md,
    },
    emptyText: {
        color: COLORS.text.secondary,
        ...TYPOGRAPHY.body,
    },
    addItemButton: {
        padding: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.primary,
        borderStyle: 'dashed',
        borderRadius: RADIUS.md,
        alignItems: 'center',
        marginVertical: SPACING.sm,
        backgroundColor: 'rgba(37, 99, 235, 0.05)',
    },
    addItemText: {
        color: COLORS.primary,
        fontWeight: '600',
    },
    footerSpacer: {
        height: 100,
    },
    footer: {
        paddingHorizontal: SPACING.xl,
        paddingBottom: Platform.OS === 'android' ? SPACING.xxl : SPACING.xl,
        paddingTop: SPACING.xl, // Increased top padding as requested
        backgroundColor: COLORS.background,
        borderTopWidth: 1,
        borderTopColor: COLORS.border.light,
        ...SHADOWS.md,
    },
    primaryButton: {
        height: BUTTON_SIZES.primary.height,
        backgroundColor: COLORS.button.primary,
        borderRadius: RADIUS.lg, // Matching HomeScreen
        alignItems: 'center',
        justifyContent: 'center',
        ...SHADOWS.elevated,
    },
    primaryButtonText: {
        ...TYPOGRAPHY.buttonLarge,
        color: COLORS.text.inverse,
        fontSize: 18,
    },
    primaryButtonDisabled: {
        opacity: 0.7,
    },
});
