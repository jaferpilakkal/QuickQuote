/**
 * HomeScreen Component
 * Main recording screen with mic button
 * Redesigned for premium UX with responsive layout
 */

import React, { useCallback, useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    Linking,
    Animated,
    Pressable,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRecording } from '../hooks/useRecording';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { audioPlayerService } from '../services/audioPlayerService';
import { queueService } from '../services/queueService';
import { syncService } from '../services/syncService';
import { RecordButton, RecordingSuccessCard } from '../components/audio';
import { Timer } from '../components/audio';
import { Waveform } from '../components/audio';
import { OfflineIndicator, QueueStatus } from '../components/shared';
import { createDraft } from '../database';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS, RADIUS, ANIMATION, BUTTON_SIZES } from '../constants/theme';
import { AppHaptics } from '../utils/haptics';

/**
 * Generate a unique ID (React Native compatible)
 */
function generateId(): string {
    return `draft_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Tips to show in idle state
 */
const RECORDING_TIPS = [
    '💡 Speak clearly and mention prices',
    '💡 Say "2 items at 500 each"',
    '💡 Include quantity and description',
    '💡 Mention tax or discount if needed',
];

/**
 * HomeScreen props
 */
interface HomeScreenProps {
    /** Callback to navigate to processing screen */
    onNavigateToProcessing?: (audioUri: string, duration: string) => void;
    /** Callback to navigate to settings screen */
    onNavigateToSettings?: () => void;
    /** Callback to navigate to drafts screen */
    onNavigateToDrafts?: () => void;
    /** Preloaded draft for replay (from Drafts screen) */
    preloadedDraft?: {
        audioUri: string;
        duration: string;
        draftId: string;
    };
    /** Clear preloaded draft after use */
    onClearPreloadedDraft?: () => void;
}

/**
 * HomeScreen Component
 * Primary screen for voice recording
 */
export function HomeScreen({
    onNavigateToProcessing,
    onNavigateToSettings,
    onNavigateToDrafts,
    preloadedDraft,
    onClearPreloadedDraft,
}: HomeScreenProps) {
    const {
        status,
        startRecording,
        stopRecording,
        cancelRecording,
        formattedDuration,
        progress,
        isMaxDurationReached,
    } = useRecording();

    // Network status for offline support (with refresh capability)
    const { isOnline, isOffline, refresh: refreshNetwork } = useNetworkStatus();

    const [tipIndex, setTipIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isCreateLoading, setIsCreateLoading] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    // Track if we're viewing a preloaded draft
    const [loadedDraftId, setLoadedDraftId] = useState<string | null>(null);
    const [loadedAudioUri, setLoadedAudioUri] = useState<string | null>(null);
    const [loadedDuration, setLoadedDuration] = useState<string | null>(null);

    // Load preloaded draft when provided
    useEffect(() => {
        if (preloadedDraft && preloadedDraft.draftId !== loadedDraftId) {
            setLoadedDraftId(preloadedDraft.draftId);
            setLoadedAudioUri(preloadedDraft.audioUri);
            setLoadedDuration(preloadedDraft.duration);

            // Load audio for playback
            audioPlayerService.loadAudio(preloadedDraft.audioUri).catch((error: Error) => {
                console.error('Failed to load draft audio:', error);
            });
        }
    }, [preloadedDraft, loadedDraftId]);

    // Button press animations
    const primaryButtonScale = useRef(new Animated.Value(1)).current;

    // Initialize sync service and start auto-sync
    useEffect(() => {
        syncService.initialize();
        syncService.startAutoSync();

        // Listen for sync status changes
        const unsubscribe = syncService.addListener((syncStatus) => {
            setIsSyncing(syncStatus.state === 'syncing');
        });

        return () => {
            unsubscribe();
            syncService.stopAutoSync();
        };
    }, []);

    // Rotate tips periodically
    useEffect(() => {
        if (status.state === 'idle') {
            const interval = setInterval(() => {
                setTipIndex((prev) => (prev + 1) % RECORDING_TIPS.length);
            }, 3000);
            return () => clearInterval(interval);
        }
    }, [status.state]);

    /**
     * Handle main button press
     */
    const handleButtonPress = useCallback(async () => {
        if (status.state === 'idle' || status.state === 'error') {
            await startRecording();
        } else if (status.state === 'recording') {
            await stopRecording();
        }
    }, [status.state, startRecording, stopRecording]);

    /**
     * Handle cancel press
     */
    const handleCancel = useCallback(async () => {
        Alert.alert(
            'Cancel Recording?',
            'This will discard the current recording.',
            [
                { text: 'Keep Recording', style: 'cancel' },
                {
                    text: 'Discard',
                    style: 'destructive',
                    onPress: async () => {
                        await cancelRecording();
                        AppHaptics.deleteConfirm();
                    },
                },
            ]
        );
    }, [cancelRecording]);

    /**
     * Handle re-record (discard and start fresh)
     */
    const handleReRecord = useCallback(() => {
        Alert.alert(
            'Discard Recording?',
            'This will delete your current recording and start fresh.',
            [
                { text: 'Keep Recording', style: 'cancel' },
                {
                    text: 'Discard & Re-record',
                    style: 'destructive',
                    onPress: async () => {
                        await audioPlayerService.unload();
                        setIsPlaying(false);

                        // Clear loaded draft state if any
                        setLoadedDraftId(null);
                        setLoadedAudioUri(null);
                        setLoadedDuration(null);
                        onClearPreloadedDraft?.();

                        await cancelRecording();
                        AppHaptics.deleteConfirm();
                        await startRecording();
                    },
                },
            ]
        );
    }, [cancelRecording, startRecording, onClearPreloadedDraft]);

    /**
     * Handle play/pause toggle
     */
    const handlePlayToggle = useCallback(async () => {
        try {
            // Use loaded draft URI or recorded URI
            const audioUri = loadedAudioUri || status.uri;

            if (isPlaying) {
                await audioPlayerService.pause();
                setIsPlaying(false);
            } else {
                if (!audioPlayerService.isLoaded() && audioUri) {
                    await audioPlayerService.loadAudio(audioUri);
                    audioPlayerService.setOnStatusUpdate((playbackStatus) => {
                        if (playbackStatus.didJustFinish) {
                            setIsPlaying(false);
                            audioPlayerService.stop();
                        }
                    });
                }
                await audioPlayerService.play();
                setIsPlaying(true);
            }
        } catch (error) {
            console.error('Playback error:', error);
            Alert.alert('Error', 'Failed to play recording');
            setIsPlaying(false);
        }
    }, [isPlaying, status.uri, loadedAudioUri]);

    /**
     * Handle Create Invoice press with animation
     * If offline, queue the recording for later processing
     */
    const handleCreateInvoice = useCallback(async () => {
        // Use loaded draft URI or recorded URI
        const audioUri = loadedAudioUri || status.uri;
        const duration = loadedDuration || formattedDuration;

        if (!audioUri) {
            Alert.alert('Error', 'No recording available');
            return;
        }

        // Press animation
        Animated.sequence([
            Animated.timing(primaryButtonScale, {
                toValue: 0.98,
                duration: ANIMATION.fast,
                useNativeDriver: true,
            }),
            Animated.timing(primaryButtonScale, {
                toValue: 1,
                duration: ANIMATION.fast,
                useNativeDriver: true,
            }),
        ]).start();

        AppHaptics.saveSuccess();

        // If offline, queue the recording
        if (isOffline) {
            try {
                setIsCreateLoading(true);

                // Use existing draft ID if from drafts, otherwise create new
                const draftId = loadedDraftId || generateId();
                if (!loadedDraftId) {
                    await createDraft(draftId, audioUri, status.duration || 0);
                }
                await queueService.addToQueue(draftId, 'both');

                // Unload audio player and clear
                audioPlayerService.unload();
                setIsPlaying(false);
                setLoadedDraftId(null);
                setLoadedAudioUri(null);
                setLoadedDuration(null);
                onClearPreloadedDraft?.();

                AppHaptics.saveSuccess();
                Alert.alert(
                    'Queued for Processing',
                    'Your recording has been saved and will be processed automatically when you\'re back online.',
                    [{ text: 'OK', onPress: () => cancelRecording() }]
                );
            } catch (error) {
                console.error('Failed to queue recording:', error);
                Alert.alert('Error', 'Failed to queue recording. Please try again.');
            } finally {
                setIsCreateLoading(false);
            }
            return;
        }

        // Online: Navigate to processing screen
        if (onNavigateToProcessing) {
            // Unload audio player before navigating
            audioPlayerService.unload();
            setIsPlaying(false);
            setLoadedDraftId(null);
            setLoadedAudioUri(null);
            setLoadedDuration(null);
            onClearPreloadedDraft?.();
            onNavigateToProcessing(audioUri, duration);
        } else {
            // Fallback if no navigation provided
            Alert.alert('AI Processing', 'Navigate to processing screen');
        }
    }, [primaryButtonScale, status.uri, status.duration, formattedDuration, onNavigateToProcessing, isOffline, cancelRecording, loadedAudioUri, loadedDuration, loadedDraftId, onClearPreloadedDraft]);

    /**
     * Handle Save as Draft
     */
    const handleSaveAsDraft = useCallback(async () => {
        // If already viewing a saved draft, show message
        if (loadedDraftId) {
            Alert.alert(
                'Already Saved',
                'This recording is already saved as a draft.',
                [{ text: 'OK' }]
            );
            return;
        }

        if (!status.uri) {
            Alert.alert('Error', 'No recording available');
            return;
        }

        try {
            AppHaptics.buttonPress();

            // Create draft with the recording
            const draftId = generateId();
            await createDraft(draftId, status.uri, status.duration || 0);

            // Unload audio player
            audioPlayerService.unload();
            setIsPlaying(false);

            AppHaptics.saveSuccess();

            Alert.alert(
                'Draft Saved!',
                'Your recording has been saved. You can find it in Drafts to process later.',
                [{ text: 'OK', onPress: () => cancelRecording() }]
            );
        } catch (error) {
            console.error('Failed to save draft:', error);
            Alert.alert('Error', 'Failed to save draft. Please try again.');
        }
    }, [status.uri, status.duration, cancelRecording, loadedDraftId]);

    /**
     * Handle permission error
     */
    const handlePermissionRequest = useCallback(() => {
        Alert.alert(
            'Microphone Access Required',
            'QuickQuote needs microphone access to record invoices. Please enable it in Settings.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Open Settings',
                    onPress: () => Linking.openSettings(),
                },
            ]
        );
    }, []);

    /**
     * Get instruction text based on state
     */
    const getInstructionText = () => {
        switch (status.state) {
            case 'recording':
                return 'Tap to Stop';
            case 'stopped':
                return '';
            case 'error':
                return 'Tap to Retry';
            default:
                return 'Tap to Record';
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <StatusBar style="dark" />

            {/* Offline Indicator */}
            <OfflineIndicator />

            {/* Header - Fixed at top with generous padding */}
            <View style={styles.header}>
                <View style={styles.headerRow}>
                    <Text style={styles.title}>QuickQuote</Text>
                    <View style={styles.headerActions}>
                        {/* Network Status - Tap to refresh */}
                        <TouchableOpacity
                            style={[styles.networkBadge, isOffline && styles.networkBadgeOffline]}
                            onPress={() => {
                                AppHaptics.buttonPress();
                                refreshNetwork();
                            }}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.networkIcon}>{isOnline ? '🟢' : '🔴'}</Text>
                            <Text style={[styles.networkText, isOffline && styles.networkTextOffline]}>
                                {isOnline ? 'Online' : 'Offline'}
                            </Text>
                        </TouchableOpacity>

                        {/* Queue Status Badge */}
                        <QueueStatus isProcessing={isSyncing} onPress={() => {
                            AppHaptics.buttonPress();
                            Alert.alert(
                                'Sync Queue',
                                'Queue items will be processed automatically when online.',
                                [
                                    {
                                        text: 'View Drafts',
                                        onPress: () => onNavigateToDrafts?.()
                                    },
                                    {
                                        text: 'Clear All',
                                        style: 'destructive',
                                        onPress: async () => {
                                            try {
                                                await queueService.clearAllItems();
                                                AppHaptics.deleteConfirm();
                                            } catch (e) {
                                                console.error('Failed to clear queue:', e);
                                            }
                                        }
                                    },
                                    { text: 'OK', style: 'cancel' },
                                ]
                            );
                        }} />

                        {/* Drafts Button */}
                        <TouchableOpacity
                            style={styles.settingsButton}
                            onPress={() => {
                                AppHaptics.buttonPress();
                                onNavigateToDrafts?.();
                            }}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.settingsIcon}>📋</Text>
                        </TouchableOpacity>

                        {/* Settings Button */}
                        <TouchableOpacity
                            style={styles.settingsButton}
                            onPress={() => {
                                AppHaptics.buttonPress();
                                if (onNavigateToSettings) {
                                    onNavigateToSettings();
                                } else {
                                    Alert.alert(
                                        'Settings',
                                        'App settings and preferences',
                                        [{ text: 'OK' }]
                                    );
                                }
                            }}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.settingsIcon}>⚙️</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                <Text style={styles.subtitle}>Voice → Invoice</Text>
            </View>

            {/* Main Content - Flex to fill available space */}
            <View style={styles.mainContent}>
                {/* Recording indicator */}
                {status.state === 'recording' && (
                    <View style={styles.recordingBadge}>
                        <View style={styles.recordingDot} />
                        <Text style={styles.recordingText}>Recording...</Text>
                    </View>
                )}

                {/* Main content area - centered vertically */}
                {status.state !== 'stopped' && !loadedAudioUri ? (
                    // Recording / Idle State
                    <View style={styles.audioSection}>
                        <View style={styles.waveformContainer}>
                            <Waveform
                                isActive={status.state === 'recording'}
                                color={status.state === 'recording' ? COLORS.recording.active : COLORS.primary}
                            />
                        </View>

                        <Timer
                            duration={formattedDuration}
                            progress={progress}
                            isRecording={status.state === 'recording'}
                            style={styles.timer}
                        />

                        <RecordButton
                            state={status.state}
                            onPress={handleButtonPress}
                            disabled={false}
                            style={styles.button}
                        />

                        <Text style={styles.instruction}>{getInstructionText()}</Text>

                        {status.error && (
                            <TouchableOpacity
                                style={styles.errorContainer}
                                onPress={status.error.includes('permission') ? handlePermissionRequest : undefined}
                            >
                                <Text style={styles.errorText}>{status.error}</Text>
                                {status.error.includes('permission') && (
                                    <Text style={styles.errorAction}>Tap to open Settings</Text>
                                )}
                            </TouchableOpacity>
                        )}

                        {/* Tip */}
                        {status.state === 'idle' && (
                            <Text style={styles.tip}>{RECORDING_TIPS[tipIndex]}</Text>
                        )}
                    </View>
                ) : (
                    // Success State - Recording Complete (or Draft Replay)
                    <View style={styles.successSection}>
                        <RecordingSuccessCard
                            duration={loadedDuration || formattedDuration}
                            isPlaying={isPlaying}
                            onPlayToggle={handlePlayToggle}
                        />

                        {isMaxDurationReached && (
                            <View style={styles.warningContainer}>
                                <Text style={styles.warningText}>⚠️ Maximum 3 minutes reached</Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Cancel button (when recording) */}
                {status.state === 'recording' && (
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={handleCancel}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Bottom Actions - Pinned to bottom with proper padding */}
            {(status.state === 'stopped' || loadedAudioUri) && (
                <View style={styles.bottomActions}>
                    {/* Primary CTA - Create Invoice */}
                    <Animated.View style={{ transform: [{ scale: primaryButtonScale }] }}>
                        <Pressable
                            style={({ pressed }) => [
                                styles.primaryButton,
                                pressed && styles.primaryButtonPressed,
                            ]}
                            onPress={handleCreateInvoice}
                            disabled={isCreateLoading}
                            accessibilityLabel="Create Invoice with AI"
                            accessibilityRole="button"
                        >
                            <View style={styles.primaryButtonContent}>
                                <Text style={styles.primaryButtonIcon}>
                                    {isCreateLoading ? '⏳' : '🤖'}
                                </Text>
                                <View style={styles.primaryButtonText}>
                                    <Text style={styles.primaryButtonTitle}>
                                        {isCreateLoading ? 'Processing...' : (isOffline ? 'Queue Invoice' : 'Create Invoice')}
                                    </Text>
                                    <Text style={styles.primaryButtonSubtitle}>
                                        {isOffline ? 'Will process when online' : 'Uses AI • Online'}
                                    </Text>
                                </View>
                            </View>
                        </Pressable>
                    </Animated.View>

                    {/* Secondary Actions Row */}
                    <View style={styles.secondaryActionsRow}>
                        {/* Save as Draft */}
                        <TouchableOpacity
                            style={styles.secondaryButton}
                            onPress={handleSaveAsDraft}
                            activeOpacity={0.7}
                            accessibilityLabel="Save as draft"
                            accessibilityRole="button"
                        >
                            <Text style={styles.secondaryButtonIcon}>📝</Text>
                            <Text style={styles.secondaryButtonText}>Save Draft</Text>
                        </TouchableOpacity>

                        {/* Re-record - Destructive */}
                        <TouchableOpacity
                            style={styles.tertiaryButton}
                            onPress={handleReRecord}
                            activeOpacity={0.7}
                            accessibilityLabel="Re-record"
                            accessibilityRole="button"
                        >
                            <Text style={styles.tertiaryButtonIcon}>🔄</Text>
                            <Text style={styles.tertiaryButtonText}>Re-record</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    // Header - generous padding for professional look
    header: {
        alignItems: 'center',
        paddingTop: Platform.OS === 'android' ? SPACING.xxl : SPACING.xl,
        paddingBottom: SPACING.xl,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        paddingHorizontal: SPACING.lg,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    networkBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.success + '15',
        paddingHorizontal: SPACING.sm,
        paddingVertical: SPACING.xs,
        borderRadius: RADIUS.full,
        gap: 4,
    },
    networkBadgeOffline: {
        backgroundColor: COLORS.error + '15',
    },
    networkIcon: {
        fontSize: 10,
    },
    networkText: {
        ...TYPOGRAPHY.captionBold,
        color: COLORS.success,
        fontSize: 11,
    },
    networkTextOffline: {
        color: COLORS.error,
    },
    settingsButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.surfaceSecondary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    settingsIcon: {
        fontSize: 18,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.text.primary,
    },
    subtitle: {
        ...TYPOGRAPHY.body,
        color: COLORS.text.secondary,
        textAlign: 'center',
        marginTop: SPACING.xs,
    },
    // Main content - fills available space
    mainContent: {
        flex: 1,
        justifyContent: 'center',
    },
    // Recording badge
    recordingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.recording.active + '15',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.sm,
        borderRadius: RADIUS.full,
        alignSelf: 'center',
        marginBottom: SPACING.lg,
    },
    recordingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.recording.active,
        marginRight: SPACING.sm,
    },
    recordingText: {
        ...TYPOGRAPHY.captionBold,
        color: COLORS.recording.active,
    },
    // Audio section (idle/recording) - centered
    audioSection: {
        alignItems: 'center',
    },
    waveformContainer: {
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    timer: {
        marginBottom: SPACING.xl,
    },
    button: {
        marginBottom: SPACING.lg,
    },
    instruction: {
        ...TYPOGRAPHY.body,
        color: COLORS.text.secondary,
        textAlign: 'center',
        marginTop: SPACING.sm,
    },
    // Success section - centered
    successSection: {
        paddingHorizontal: SPACING.lg,
    },
    // Error
    errorContainer: {
        marginTop: SPACING.lg,
        backgroundColor: COLORS.error + '15',
        padding: SPACING.lg,
        borderRadius: RADIUS.md,
        marginHorizontal: SPACING.xl,
    },
    errorText: {
        ...TYPOGRAPHY.body,
        color: COLORS.error,
        textAlign: 'center',
    },
    errorAction: {
        ...TYPOGRAPHY.captionBold,
        color: COLORS.error,
        textAlign: 'center',
        marginTop: SPACING.xs,
        textDecorationLine: 'underline',
    },
    // Warning
    warningContainer: {
        marginTop: SPACING.lg,
        padding: SPACING.md,
        backgroundColor: COLORS.warning + '15',
        borderRadius: RADIUS.md,
    },
    warningText: {
        ...TYPOGRAPHY.captionBold,
        color: COLORS.warning,
        textAlign: 'center',
    },
    // Cancel
    cancelButton: {
        alignSelf: 'center',
        padding: SPACING.lg,
        marginTop: SPACING.md,
    },
    cancelText: {
        ...TYPOGRAPHY.body,
        color: COLORS.text.secondary,
    },
    // Bottom actions - generous bottom padding for professional look
    bottomActions: {
        paddingHorizontal: SPACING.xl,
        paddingBottom: Platform.OS === 'android' ? SPACING.xxl : SPACING.xl,
        paddingTop: SPACING.lg,
        backgroundColor: COLORS.background,
    },
    // Primary CTA button
    primaryButton: {
        height: BUTTON_SIZES.primary.height,
        backgroundColor: COLORS.button.primary,
        borderRadius: RADIUS.lg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: SPACING.xl,
        ...SHADOWS.elevated,
    },
    primaryButtonPressed: {
        backgroundColor: COLORS.button.primaryPressed,
        transform: [{ scale: 0.98 }],
    },
    primaryButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    primaryButtonIcon: {
        fontSize: 24,
        marginRight: SPACING.md,
    },
    primaryButtonText: {
        alignItems: 'flex-start',
    },
    primaryButtonTitle: {
        ...TYPOGRAPHY.buttonLarge,
        color: COLORS.text.inverse,
    },
    primaryButtonSubtitle: {
        ...TYPOGRAPHY.caption,
        color: COLORS.text.inverse,
        opacity: 0.85,
        marginTop: SPACING.xxs,
    },
    // Secondary actions row
    secondaryActionsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: SPACING.xxl,
        marginTop: SPACING.xl,
        marginBottom: SPACING.sm,
    },
    // Secondary button (Save Draft)
    secondaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.lg,
        minHeight: BUTTON_SIZES.tertiary.height,
    },
    secondaryButtonIcon: {
        fontSize: 16,
        marginRight: SPACING.sm,
    },
    secondaryButtonText: {
        ...TYPOGRAPHY.buttonSmall,
        color: COLORS.text.secondary,
    },
    // Tertiary button (Re-record - destructive)
    tertiaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.lg,
        minHeight: BUTTON_SIZES.tertiary.height,
    },
    tertiaryButtonIcon: {
        fontSize: 16,
        marginRight: SPACING.sm,
    },
    tertiaryButtonText: {
        ...TYPOGRAPHY.buttonSmall,
        color: COLORS.button.destructive,
    },
    // Tip
    tip: {
        ...TYPOGRAPHY.body,
        color: COLORS.text.secondary,
        marginTop: SPACING.xxl,
        textAlign: 'center',
        paddingHorizontal: SPACING.xl,
    },
});
