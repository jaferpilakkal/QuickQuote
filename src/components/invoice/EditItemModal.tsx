import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, BUTTON_SIZES } from '../../constants/theme';
import type { InvoiceItem } from '../../types/invoice';

interface EditItemModalProps {
    visible: boolean;
    item: InvoiceItem | null;
    onClose: () => void;
    onSave: (itemId: string, updates: Partial<InvoiceItem>) => void;
    currencySymbol: string;
}

export function EditItemModal({ visible, item, onClose, onSave, currencySymbol }: EditItemModalProps) {
    const [description, setDescription] = useState('');
    const [quantity, setQuantity] = useState('');
    const [unitPrice, setUnitPrice] = useState('');

    useEffect(() => {
        if (item) {
            setDescription(item.description);
            setQuantity(item.quantity.toString());
            setUnitPrice(item.unitPrice.toString());
        }
    }, [item]);

    const handleSave = () => {
        if (!item) return;

        const qty = parseFloat(quantity);
        const price = parseFloat(unitPrice);

        if (isNaN(qty) || qty <= 0) {
            return;
        }

        onSave(item.id, {
            description,
            quantity: qty,
            unitPrice: isNaN(price) ? 0 : price,
        });
        onClose();
    };

    if (!item) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <View style={styles.backdrop}>
                    <TouchableOpacity style={styles.backdropTouch} onPress={onClose} />
                </View>

                <View style={styles.content}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Edit Item</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Text style={styles.closeText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Description</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={description}
                                onChangeText={setDescription}
                                placeholder="Item description"
                                multiline
                            />
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.inputGroup, { flex: 1, marginRight: SPACING.md }]}>
                                <Text style={styles.label}>Quantity</Text>
                                <TextInput
                                    style={styles.input}
                                    value={quantity}
                                    onChangeText={setQuantity}
                                    keyboardType="numeric"
                                    placeholder="0"
                                />
                            </View>

                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.label}>Price ({currencySymbol})</Text>
                                <TextInput
                                    style={styles.input}
                                    value={unitPrice}
                                    onChangeText={setUnitPrice}
                                    keyboardType="numeric"
                                    placeholder="0.00"
                                />
                            </View>
                        </View>
                    </ScrollView>

                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                            <Text style={styles.saveText}>Save Changes</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: COLORS.backdrop || 'rgba(0,0,0,0.5)',
    },
    backdropTouch: {
        flex: 1,
    },
    content: {
        backgroundColor: COLORS.backgroundWhite,
        borderTopLeftRadius: RADIUS.xl,
        borderTopRightRadius: RADIUS.xl,
        padding: SPACING.lg,
        ...SHADOWS.xl,
        maxHeight: '80%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.lg,
    },
    title: {
        ...TYPOGRAPHY.h3,
        color: COLORS.text.primary,
    },
    closeButton: {
        padding: SPACING.sm,
    },
    closeText: {
        fontSize: 20,
        color: COLORS.text.secondary,
    },
    form: {
        marginBottom: SPACING.lg,
    },
    inputGroup: {
        marginBottom: SPACING.md,
    },
    label: {
        ...TYPOGRAPHY.labelSmall,
        color: COLORS.text.secondary,
        marginBottom: SPACING.xs,
    },
    input: {
        backgroundColor: COLORS.surfaceSecondary || '#F1F5F9',
        borderRadius: RADIUS.md,
        padding: 12,
        fontSize: 16,
        color: COLORS.text.primary,
        borderWidth: 1,
        borderColor: COLORS.border.light,
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    row: {
        flexDirection: 'row',
    },
    footer: {
        flexDirection: 'row',
        gap: SPACING.md,
        paddingBottom: Platform.OS === 'ios' ? SPACING.xl : SPACING.md,
    },
    cancelButton: {
        flex: 1,
        height: BUTTON_SIZES.secondary.height,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.border.medium,
    },
    cancelText: {
        ...TYPOGRAPHY.button,
        color: COLORS.text.secondary,
    },
    saveButton: {
        flex: 1,
        height: BUTTON_SIZES.primary.height,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: RADIUS.lg,
        backgroundColor: COLORS.button.primary,
        ...SHADOWS.md,
    },
    saveText: {
        ...TYPOGRAPHY.button,
        color: COLORS.text.inverse,
    },
});
