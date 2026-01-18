/**
 * ProcessingScreen Component
 * Shows AI processing progress: Transcribing → Parsing → Success/Error
 * Uses existing design tokens for consistent UI
 */

import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    Animated,
    Platform,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS, RADIUS, ANIMATION, BUTTON_SIZES } from '../constants/theme';
import { sttService } from '../services/sttService';
import { geminiService } from '../services/geminiService';
import { queueService } from '../services/queueService';
import { createDraft, getSetting } from '../database';
import { Waveform } from '../components/audio';
import { AppHaptics } from '../utils/haptics';
import type { ParsedInvoice } from '../types/invoice';
import { SUPPORTED_CURRENCIES } from '../types/invoice';

/**
 * Processing states
 */
type ProcessingState = 'transcribing' | 'parsing' | 'success' | 'error';

/**
 * Props for ProcessingScreen
 */
interface ProcessingScreenProps {
    /** Audio URI to process */
    audioUri: string;
    /** Duration string for display */
    duration: string;
    /** Called when user wants to go back */
    onBack: () => void;
    /** Called when processing succeeds */
    onSuccess: (invoice: ParsedInvoice) => void;
    /** Called when user wants to retry */
    onRetry: () => void;
}

/**
 * Processing screen component
 */
export function ProcessingScreen({
    audioUri,
    duration,
    onBack,
    onSuccess,
    onRetry,
}: ProcessingScreenProps) {
    const [state, setState] = useState<ProcessingState>('transcribing');
    const [error, setError] = useState<string>('');
    const [transcript, setTranscript] = useState<string>('');
    const [invoice, setInvoice] = useState<ParsedInvoice | null>(null);
    const [isNetworkErr, setIsNetworkErr] = useState(false);

    // Animations
    const progressAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(1)).current;

    /**
     * Generate a unique ID
     */
    function generateId(): string {
        return `draft_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    }

    /**
     * Handle saving as draft for offline processing
     */
    async function handleSaveAsDraft() {
        try {
            // Create draft with audio
            const draftId = generateId();
            const durationMs = parseDuration(duration);
            await createDraft(draftId, audioUri, durationMs);

            // Add to queue for processing when online
            await queueService.addToQueue(draftId, 'both');

            AppHaptics.saveSuccess();
            Alert.alert(
                'Saved as Draft',
                'Your recording has been saved and will be processed automatically when you\'re back online.',
                [{ text: 'OK', onPress: onBack }]
            );
        } catch (err) {
            console.error('[Processing] Save as draft failed:', err);
            Alert.alert('Error', 'Failed to save draft. Please try again.');
        }
    }

    /**
     * Parse duration string to ms
     */
    function parseDuration(dur: string): number {
        const parts = dur.split(':');
        if (parts.length === 2) {
            return (parseInt(parts[0]) * 60 + parseInt(parts[1])) * 1000;
        }
        return 0;
    }

    // Process on mount
    useEffect(() => {
        processAudio();
    }, [audioUri]);

    /**
     * Check if error is network-related
     */
    function isNetworkError(err: unknown): boolean {
        const errorMessage = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
        return (
            errorMessage.includes('network') ||
            errorMessage.includes('fetch') ||
            errorMessage.includes('timeout') ||
            errorMessage.includes('connection') ||
            errorMessage.includes('offline') ||
            errorMessage.includes('request failed')
        );
    }

    /**
     * Process the audio through STT and Gemini
     */
    async function processAudio() {
        try {
            // Step 1: Transcribe
            setState('transcribing');
            animateProgress(0, 50);

            const sttResult = await sttService.transcribe(audioUri);
            setTranscript(sttResult.transcript);
            AppHaptics.buttonPress();

            // Step 2: Fetch user settings for invoice generation
            setState('parsing');
            animateProgress(50, 90);

            // Get user's default currency and tax rate from settings
            const defaultCurrency = await getSetting<string>('default_currency') || 'INR';
            const defaultTaxRate = await getSetting<number>('default_tax_rate') ?? 0;

            console.log('[Processing] Using settings - Currency:', defaultCurrency, 'Tax:', defaultTaxRate);

            // Parse with Gemini using user's settings
            const parsedInvoice = await geminiService.parseTranscript(sttResult.transcript, {
                currency: defaultCurrency,
                taxRate: defaultTaxRate,
            });
            parsedInvoice.audioUri = audioUri;
            setInvoice(parsedInvoice);

            // Step 3: Success
            animateProgress(90, 100);
            setTimeout(() => {
                setState('success');
                AppHaptics.saveSuccess();
            }, 300);

        } catch (err) {
            console.error('[Processing] Error:', err);
            const networkError = isNetworkError(err);
            setState('error');
            setIsNetworkErr(networkError);

            if (networkError) {
                setError('Network unavailable. You can save this recording as a draft and process it later when online.');
            } else {
                setError(err instanceof Error ? err.message : 'Processing failed');
            }
            AppHaptics.error();
        }
    }

    /**
 * Animate progress bar
 */
    function animateProgress(from: number, to: number) {
        progressAnim.setValue(from);
        Animated.timing(progressAnim, {
            toValue: to,
            duration: ANIMATION.slow * 2,
            useNativeDriver: false,
        }).start();
    }

    /**
     * Handle continue to editor
     */
    function handleContinue() {
        if (invoice) {
            onSuccess(invoice);
        }
    }

    /**
     * Get status message
     */
    function getStatusMessage(): string {
        switch (state) {
            case 'transcribing':
                return 'Converting speech to text...';
            case 'parsing':
                return 'Extracting invoice items...';
            case 'success':
                return 'Invoice ready!';
            case 'error':
                return 'Processing failed';
        }
    }

    /**
     * Get status icon
     */
    function getStatusIcon(): string {
        switch (state) {
            case 'transcribing':
                return '🎤';
            case 'parsing':
                return '🤖';
            case 'success':
                return '✅';
            case 'error':
                return '❌';
        }
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <StatusBar style="dark" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={onBack}
                    disabled={state === 'transcribing' || state === 'parsing'}
                >
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Processing</Text>
                <View style={styles.placeholder} />
            </View>

            {/* Main content */}
            <View style={styles.content}>
                {/* Status card */}
                <View style={styles.statusCard}>
                    <Text style={styles.statusIcon}>{getStatusIcon()}</Text>
                    <Text style={styles.statusMessage}>{getStatusMessage()}</Text>

                    {/* Progress bar (for processing states) */}
                    {(state === 'transcribing' || state === 'parsing') && (
                        <View style={styles.progressContainer}>
                            <View style={styles.progressBackground}>
                                <Animated.View
                                    style={[
                                        styles.progressFill,
                                        {
                                            width: progressAnim.interpolate({
                                                inputRange: [0, 100],
                                                outputRange: ['0%', '100%'],
                                            }),
                                        },
                                    ]}
                                />
                            </View>
                        </View>
                    )}

                    {/* Waveform animation (for transcribing) */}
                    {state === 'transcribing' && (
                        <View style={styles.waveformContainer}>
                            <Waveform isActive={true} color={COLORS.primary} barCount={16} />
                        </View>
                    )}

                    {/* Spinner (for parsing) */}
                    {state === 'parsing' && (
                        <ActivityIndicator
                            size="large"
                            color={COLORS.primary}
                            style={styles.spinner}
                        />
                    )}
                </View>

                {/* Transcript preview (when available) */}
                {transcript && state !== 'transcribing' && (
                    <View style={styles.transcriptCard}>
                        <Text style={styles.transcriptLabel}>Transcript</Text>
                        <Text style={styles.transcriptText} numberOfLines={3}>
                            {transcript}
                        </Text>
                    </View>
                )}

                {/* Invoice preview (on success) */}
                {state === 'success' && invoice && (
                    <View style={styles.previewCard}>
                        <Text style={styles.previewTitle}>Invoice Preview</Text>

                        <View style={styles.itemsList}>
                            {invoice.items.slice(0, 3).map((item, index) => (
                                <View key={item.id || index} style={styles.itemRow}>
                                    <Text style={styles.itemDesc} numberOfLines={1}>
                                        {item.description}
                                    </Text>
                                    <Text style={styles.itemAmount}>
                                        {SUPPORTED_CURRENCIES[invoice.currency as keyof typeof SUPPORTED_CURRENCIES]?.symbol || '₹'}
                                        {item.amount.toFixed(2)}
                                    </Text>
                                </View>
                            ))}
                            {invoice.items.length > 3 && (
                                <Text style={styles.moreItems}>
                                    +{invoice.items.length - 3} more items
                                </Text>
                            )}
                        </View>

                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Total</Text>
                            <Text style={styles.totalAmount}>
                                {SUPPORTED_CURRENCIES[invoice.currency as keyof typeof SUPPORTED_CURRENCIES]?.symbol || '₹'}
                                {invoice.total.toFixed(2)}
                            </Text>
                        </View>
                    </View>
                )}

                {/* Error message */}
                {state === 'error' && (
                    <View style={styles.errorCard}>
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}
            </View>

            {/* Bottom actions */}
            <View style={styles.actions}>
                {state === 'success' && (
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={handleContinue}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.primaryButtonText}>Continue to Edit</Text>
                    </TouchableOpacity>
                )}

                {state === 'error' && (
                    <>
                        {/* Save as Draft (for network errors) */}
                        {isNetworkErr && (
                            <TouchableOpacity
                                style={[styles.primaryButton, styles.saveButton]}
                                onPress={handleSaveAsDraft}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.primaryButtonText}>💾 Save as Draft</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={isNetworkErr ? styles.secondaryButton : styles.primaryButton}
                            onPress={onRetry}
                            activeOpacity={0.8}
                        >
                            <Text style={isNetworkErr ? styles.secondaryButtonText : styles.primaryButtonText}>
                                🔄 Try Again
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.secondaryButton}
                            onPress={onBack}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.secondaryButtonText}>Go Back</Text>
                        </TouchableOpacity>
                    </>
                )}
            </View>
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
        paddingTop: Platform.OS === 'android' ? SPACING.lg : SPACING.md,
        paddingBottom: SPACING.md,
    },
    backButton: {
        padding: SPACING.sm,
    },
    backText: {
        ...TYPOGRAPHY.body,
        color: COLORS.primary,
    },
    title: {
        ...TYPOGRAPHY.h2,
        color: COLORS.text.primary,
    },
    placeholder: {
        width: 60,
    },
    content: {
        flex: 1,
        paddingHorizontal: SPACING.lg,
        justifyContent: 'center',
    },
    statusCard: {
        backgroundColor: COLORS.backgroundWhite,
        borderRadius: RADIUS.xl,
        padding: SPACING.xl,
        alignItems: 'center',
        ...SHADOWS.card,
    },
    statusIcon: {
        fontSize: 48,
        marginBottom: SPACING.lg,
    },
    statusMessage: {
        ...TYPOGRAPHY.h3,
        color: COLORS.text.primary,
        textAlign: 'center',
        marginBottom: SPACING.lg,
    },
    progressContainer: {
        width: '100%',
        marginTop: SPACING.md,
    },
    progressBackground: {
        height: 6,
        backgroundColor: COLORS.border.default,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: COLORS.primary,
        borderRadius: 3,
    },
    waveformContainer: {
        height: 48,
        marginTop: SPACING.lg,
    },
    spinner: {
        marginTop: SPACING.lg,
    },
    transcriptCard: {
        backgroundColor: COLORS.backgroundWhite,
        borderRadius: RADIUS.xl,
        padding: SPACING.lg,
        marginTop: SPACING.lg,
        ...SHADOWS.sm,
    },
    transcriptLabel: {
        ...TYPOGRAPHY.captionBold,
        color: COLORS.text.secondary,
        marginBottom: SPACING.sm,
    },
    transcriptText: {
        ...TYPOGRAPHY.body,
        color: COLORS.text.primary,
        fontStyle: 'italic',
    },
    previewCard: {
        backgroundColor: COLORS.backgroundWhite,
        borderRadius: RADIUS.xl,
        padding: SPACING.lg,
        marginTop: SPACING.lg,
        ...SHADOWS.card,
    },
    previewTitle: {
        ...TYPOGRAPHY.h3,
        color: COLORS.text.primary,
        marginBottom: SPACING.lg,
    },
    itemsList: {
        gap: SPACING.sm,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    itemDesc: {
        ...TYPOGRAPHY.body,
        color: COLORS.text.primary,
        flex: 1,
        marginRight: SPACING.md,
    },
    itemAmount: {
        ...TYPOGRAPHY.label,
        color: COLORS.text.primary,
    },
    moreItems: {
        ...TYPOGRAPHY.caption,
        color: COLORS.text.secondary,
        marginTop: SPACING.xs,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: SPACING.lg,
        paddingTop: SPACING.lg,
        borderTopWidth: 1,
        borderTopColor: COLORS.border.default,
    },
    totalLabel: {
        ...TYPOGRAPHY.h3,
        color: COLORS.text.primary,
    },
    totalAmount: {
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.primary,
    },
    errorCard: {
        backgroundColor: COLORS.error + '15',
        borderRadius: RADIUS.xl,
        padding: SPACING.lg,
        marginTop: SPACING.lg,
    },
    errorText: {
        ...TYPOGRAPHY.body,
        color: COLORS.error,
        textAlign: 'center',
    },
    actions: {
        paddingHorizontal: SPACING.xl,
        paddingBottom: Platform.OS === 'android' ? SPACING.xxl : SPACING.xl,
        paddingTop: SPACING.lg,
        gap: SPACING.md,
    },
    primaryButton: {
        height: BUTTON_SIZES.primary.height,
        backgroundColor: COLORS.button.primary,
        borderRadius: RADIUS.lg,
        alignItems: 'center',
        justifyContent: 'center',
        ...SHADOWS.elevated,
    },
    saveButton: {
        backgroundColor: COLORS.success,
    },
    primaryButtonText: {
        ...TYPOGRAPHY.buttonLarge,
        color: COLORS.text.inverse,
    },
    secondaryButton: {
        height: BUTTON_SIZES.secondary.height,
        backgroundColor: 'transparent',
        borderRadius: RADIUS.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryButtonText: {
        ...TYPOGRAPHY.button,
        color: COLORS.text.secondary,
    },
});
