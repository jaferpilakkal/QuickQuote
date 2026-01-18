/**
 * SettingsScreen Component
 * App settings and preferences
 * Part of Phase 7: Polish & Settings
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Switch,
    Platform,
    TextInput,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { AppHaptics } from '../utils/haptics';
import { getSetting, setSetting, deleteAllDrafts } from '../database';
import { SUPPORTED_CURRENCIES, CurrencyCode } from '../types/invoice';

/**
 * SettingsScreen props
 */
export interface SettingsScreenProps {
    /** Navigate back */
    onNavigateBack?: () => void;
    /** Navigate to feedback */
    onNavigateToFeedback?: () => void;
}

/**
 * Setting row component
 */
interface SettingRowProps {
    icon: string;
    title: string;
    subtitle?: string;
    value?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
    destructive?: boolean;
}

function SettingRow({ icon, title, subtitle, value, onPress, rightElement, destructive }: SettingRowProps) {
    return (
        <TouchableOpacity
            style={styles.settingRow}
            onPress={onPress}
            disabled={!onPress}
            activeOpacity={onPress ? 0.7 : 1}
        >
            <Text style={styles.settingIcon}>{icon}</Text>
            <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, destructive && styles.destructiveText]}>
                    {title}
                </Text>
                {subtitle && (
                    <Text style={styles.settingSubtitle}>{subtitle}</Text>
                )}
            </View>
            {value && (
                <Text style={styles.settingValue}>{value}</Text>
            )}
            {rightElement}
            {onPress && !rightElement && (
                <Text style={styles.chevron}>›</Text>
            )}
        </TouchableOpacity>
    );
}

/**
 * Section header component
 */
function SectionHeader({ title }: { title: string }) {
    return (
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{title}</Text>
        </View>
    );
}

/**
 * Currency picker modal
 */
function CurrencyPicker({
    visible,
    selectedCurrency,
    onSelect,
    onClose,
}: {
    visible: boolean;
    selectedCurrency: CurrencyCode;
    onSelect: (currency: CurrencyCode) => void;
    onClose: () => void;
}) {
    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Select Currency</Text>
                    {Object.entries(SUPPORTED_CURRENCIES).map(([code, info]) => (
                        <TouchableOpacity
                            key={code}
                            style={[
                                styles.currencyOption,
                                code === selectedCurrency && styles.currencyOptionSelected,
                            ]}
                            onPress={() => {
                                onSelect(code as CurrencyCode);
                                onClose();
                            }}
                        >
                            <Text style={styles.currencySymbol}>{info.symbol}</Text>
                            <Text style={styles.currencyName}>{info.name}</Text>
                            {code === selectedCurrency && (
                                <Text style={styles.checkmark}>✓</Text>
                            )}
                        </TouchableOpacity>
                    ))}
                    <TouchableOpacity style={styles.modalClose} onPress={onClose}>
                        <Text style={styles.modalCloseText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

/**
 * SettingsScreen Component
 */
export function SettingsScreen({ onNavigateBack, onNavigateToFeedback }: SettingsScreenProps): React.ReactElement {
    // Settings state
    const [currency, setCurrency] = useState<CurrencyCode>('INR');
    const [taxRate, setTaxRate] = useState('0');
    const [audioRetention, setAudioRetention] = useState('7');
    const [businessName, setBusinessName] = useState('');

    // UI state
    const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
    const [showTaxInput, setShowTaxInput] = useState(false);

    // Load settings
    useEffect(() => {
        async function loadSettings() {
            try {
                const savedCurrency = await getSetting<string>('default_currency');
                const savedTaxRate = await getSetting<number>('default_tax_rate');
                const savedRetention = await getSetting<number>('audio_retention_days');
                const savedBusiness = await getSetting<string>('business_name');

                if (savedCurrency) setCurrency(savedCurrency as CurrencyCode);
                if (savedTaxRate !== null) setTaxRate(String(savedTaxRate));
                if (savedRetention !== null) setAudioRetention(String(savedRetention));
                if (savedBusiness) setBusinessName(savedBusiness);
            } catch (error) {
                console.error('Failed to load settings:', error);
            }
        }
        loadSettings();
    }, []);

    // Save currency
    const handleCurrencyChange = useCallback(async (newCurrency: CurrencyCode) => {
        setCurrency(newCurrency);
        await setSetting('default_currency', newCurrency);
        AppHaptics.selection();
    }, []);

    // Save tax rate
    const handleTaxRateChange = useCallback(async (value: string) => {
        const numValue = parseFloat(value) || 0;
        setTaxRate(String(numValue));
        await setSetting('default_tax_rate', numValue);
        setShowTaxInput(false);
        AppHaptics.selection();
    }, []);

    // Save audio retention
    const handleRetentionChange = useCallback(async (days: number) => {
        setAudioRetention(String(days));
        await setSetting('audio_retention_days', days);
        AppHaptics.selection();
    }, []);

    // Delete all data
    const handleDeleteAllData = useCallback(() => {
        Alert.alert(
            'Delete All Data?',
            'This will permanently delete all your drafts and audio recordings. This cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete Everything',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteAllDrafts();
                            AppHaptics.deleteConfirm();
                            Alert.alert('Success', 'All data has been deleted.');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete data.');
                        }
                    },
                },
            ]
        );
    }, []);

    const currencyInfo = SUPPORTED_CURRENCIES[currency];

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar style="dark" />

            {/* Header */}
            <View style={styles.header}>
                {onNavigateBack && (
                    <TouchableOpacity style={styles.backButton} onPress={onNavigateBack}>
                        <Text style={styles.backIcon}>←</Text>
                    </TouchableOpacity>
                )}
                <Text style={styles.title}>Settings</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Invoice Defaults */}
                <SectionHeader title="Invoice Defaults" />
                <View style={styles.section}>
                    <SettingRow
                        icon="💵"
                        title="Currency"
                        value={`${currencyInfo.symbol} ${currency}`}
                        onPress={() => setShowCurrencyPicker(true)}
                    />
                    <SettingRow
                        icon="📊"
                        title="Default Tax Rate"
                        value={`${taxRate}%`}
                        onPress={() => setShowTaxInput(true)}
                    />
                </View>

                {/* Storage */}
                <SectionHeader title="Storage" />
                <View style={styles.section}>
                    <SettingRow
                        icon="🎙️"
                        title="Audio Retention"
                        subtitle="Auto-delete recordings after"
                        value={audioRetention === '0' ? 'Never' : `${audioRetention} days`}
                        onPress={() => {
                            Alert.alert(
                                'Audio Retention',
                                'Auto-delete audio recordings after:',
                                [
                                    { text: '7 days', onPress: () => handleRetentionChange(7) },
                                    { text: '30 days', onPress: () => handleRetentionChange(30) },
                                    { text: 'Never', onPress: () => handleRetentionChange(0) },
                                    { text: 'Cancel', style: 'cancel' },
                                ]
                            );
                        }}
                    />
                </View>

                {/* Danger Zone */}
                <SectionHeader title="Danger Zone" />
                <View style={styles.section}>
                    <SettingRow
                        icon="🗑️"
                        title="Delete All Data"
                        subtitle="Remove all drafts and recordings"
                        onPress={handleDeleteAllData}
                        destructive
                    />
                </View>

                {/* App Info */}
                <SectionHeader title="About" />
                <View style={styles.section}>
                    <SettingRow
                        icon="💬"
                        title="Send Feedback"
                        subtitle="Report bugs or suggest features"
                        onPress={onNavigateToFeedback}
                    />
                    <SettingRow
                        icon="📱"
                        title="QuickQuote"
                        subtitle="Version 1.0.0"
                    />
                </View>

                <View style={styles.bottomPadding} />
            </ScrollView>

            {/* Currency Picker Modal */}
            <CurrencyPicker
                visible={showCurrencyPicker}
                selectedCurrency={currency}
                onSelect={handleCurrencyChange}
                onClose={() => setShowCurrencyPicker(false)}
            />

            {/* Tax Rate Input Modal */}
            <Modal visible={showTaxInput} animationType="fade" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Default Tax Rate</Text>
                        <View style={styles.taxInputContainer}>
                            <TextInput
                                style={styles.taxInput}
                                value={taxRate}
                                onChangeText={setTaxRate}
                                keyboardType="decimal-pad"
                                placeholder="0"
                                autoFocus
                            />
                            <Text style={styles.taxPercent}>%</Text>
                        </View>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.modalButton}
                                onPress={() => setShowTaxInput(false)}
                            >
                                <Text style={styles.modalButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalButtonPrimary]}
                                onPress={() => handleTaxRateChange(taxRate)}
                            >
                                <Text style={styles.modalButtonTextPrimary}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    backIcon: {
        fontSize: 24,
        color: COLORS.text.primary,
    },
    title: {
        ...TYPOGRAPHY.h1,
        color: COLORS.text.primary,
    },
    placeholder: {
        width: 40,
    },
    content: {
        flex: 1,
    },
    sectionHeader: {
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.xl,
        paddingBottom: SPACING.sm,
    },
    sectionTitle: {
        ...TYPOGRAPHY.captionBold,
        color: COLORS.text.tertiary,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    section: {
        backgroundColor: COLORS.backgroundWhite,
        marginHorizontal: SPACING.lg,
        borderRadius: RADIUS.xl,
        ...SHADOWS.card,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.lg,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: COLORS.border.light,
    },
    settingIcon: {
        fontSize: 20,
        marginRight: SPACING.md,
    },
    settingContent: {
        flex: 1,
    },
    settingTitle: {
        ...TYPOGRAPHY.body,
        color: COLORS.text.primary,
    },
    settingSubtitle: {
        ...TYPOGRAPHY.caption,
        color: COLORS.text.tertiary,
        marginTop: SPACING.xxs,
    },
    settingValue: {
        ...TYPOGRAPHY.body,
        color: COLORS.text.secondary,
        marginRight: SPACING.sm,
    },
    chevron: {
        ...TYPOGRAPHY.h2,
        color: COLORS.text.tertiary,
    },
    destructiveText: {
        color: COLORS.error,
    },
    bottomPadding: {
        height: SPACING.xxxl,
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: COLORS.overlay,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: COLORS.backgroundWhite,
        borderRadius: RADIUS.xl,
        padding: SPACING.xl,
        width: '85%',
        maxWidth: 340,
    },
    modalTitle: {
        ...TYPOGRAPHY.h2,
        color: COLORS.text.primary,
        textAlign: 'center',
        marginBottom: SPACING.lg,
    },
    modalClose: {
        padding: SPACING.md,
        alignItems: 'center',
        marginTop: SPACING.md,
    },
    modalCloseText: {
        ...TYPOGRAPHY.button,
        color: COLORS.text.secondary,
    },
    currencyOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        borderRadius: RADIUS.md,
        marginBottom: SPACING.sm,
    },
    currencyOptionSelected: {
        backgroundColor: COLORS.primary + '15',
    },
    currencySymbol: {
        ...TYPOGRAPHY.h2,
        width: 40,
        color: COLORS.text.primary,
    },
    currencyName: {
        ...TYPOGRAPHY.body,
        flex: 1,
        color: COLORS.text.primary,
    },
    checkmark: {
        ...TYPOGRAPHY.h3,
        color: COLORS.primary,
    },
    taxInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.xl,
    },
    taxInput: {
        ...TYPOGRAPHY.numberLarge,
        color: COLORS.text.primary,
        textAlign: 'center',
        minWidth: 80,
        borderBottomWidth: 2,
        borderBottomColor: COLORS.primary,
        paddingVertical: SPACING.sm,
    },
    taxPercent: {
        ...TYPOGRAPHY.h1,
        color: COLORS.text.secondary,
        marginLeft: SPACING.sm,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: SPACING.md,
    },
    modalButton: {
        flex: 1,
        padding: SPACING.md,
        alignItems: 'center',
        borderRadius: RADIUS.lg,
        backgroundColor: COLORS.surfaceSecondary,
    },
    modalButtonPrimary: {
        backgroundColor: COLORS.primary,
    },
    modalButtonText: {
        ...TYPOGRAPHY.button,
        color: COLORS.text.secondary,
    },
    modalButtonTextPrimary: {
        ...TYPOGRAPHY.button,
        color: COLORS.text.inverse,
    },
});

export default SettingsScreen;
