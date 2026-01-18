/**
 * QueueStatus Component
 * Displays a badge showing the number of pending queue items
 * Part of Phase 5: Offline & Sync
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    TouchableOpacity,
    Easing,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, ANIMATION, SHADOWS } from '../../constants/theme';
import { getPendingQueueItems } from '../../database';

/**
 * Props for QueueStatus
 */
export interface QueueStatusProps {
    /** Callback when badge is tapped */
    onPress?: () => void;
    /** Whether to show processing animation */
    isProcessing?: boolean;
    /** Refresh interval in ms (0 to disable auto-refresh) */
    refreshInterval?: number;
}

/**
 * Queue status badge component
 * Shows pending items count with optional processing animation
 */
export function QueueStatus({
    onPress,
    isProcessing = false,
    refreshInterval = 5000,
}: QueueStatusProps): React.ReactElement | null {
    const [pendingCount, setPendingCount] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    // Animation values
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const pulseAnimRef = useRef<Animated.CompositeAnimation | null>(null);

    /**
     * Fetch pending queue count
     */
    const fetchPendingCount = useCallback(async () => {
        try {
            const items = await getPendingQueueItems();
            setPendingCount(items.length);
        } catch (error) {
            console.warn('[QueueStatus] Failed to fetch pending count:', error);
        }
    }, []);

    /**
     * Initial load and refresh interval
     */
    useEffect(() => {
        fetchPendingCount();

        if (refreshInterval > 0) {
            const interval = setInterval(fetchPendingCount, refreshInterval);
            return () => clearInterval(interval);
        }
    }, [fetchPendingCount, refreshInterval]);

    /**
     * Show/hide animation based on count
     */
    useEffect(() => {
        if (pendingCount > 0 && !isVisible) {
            setIsVisible(true);
            Animated.spring(scaleAnim, {
                toValue: 1,
                useNativeDriver: true,
                tension: 50,
                friction: 6,
            }).start();
        } else if (pendingCount === 0 && isVisible) {
            Animated.timing(scaleAnim, {
                toValue: 0,
                duration: ANIMATION.fast,
                useNativeDriver: true,
            }).start(() => setIsVisible(false));
        }
    }, [pendingCount, isVisible, scaleAnim]);

    /**
     * Pulse animation when processing
     */
    useEffect(() => {
        if (isProcessing && isVisible) {
            pulseAnimRef.current = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.15,
                        duration: 600,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 600,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ])
            );
            pulseAnimRef.current.start();
        } else {
            pulseAnimRef.current?.stop();
            pulseAnim.setValue(1);
        }

        return () => {
            pulseAnimRef.current?.stop();
        };
    }, [isProcessing, isVisible, pulseAnim]);

    // Don't render if no pending items
    if (!isVisible && pendingCount === 0) {
        return null;
    }

    const BadgeContent = (
        <Animated.View
            style={[
                styles.container,
                {
                    transform: [
                        { scale: Animated.multiply(scaleAnim, pulseAnim) },
                    ],
                },
                isProcessing && styles.processing,
            ]}
        >
            <View style={styles.iconContainer}>
                <Text style={styles.icon}>{isProcessing ? '⏳' : '📋'}</Text>
            </View>
            <Text style={styles.count}>{pendingCount}</Text>
            <Text style={styles.label}>
                {isProcessing ? 'Syncing...' : 'Queued'}
            </Text>
        </Animated.View>
    );

    if (onPress) {
        return (
            <TouchableOpacity
                onPress={onPress}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`${pendingCount} items in queue${isProcessing ? ', processing' : ''}`}
            >
                {BadgeContent}
            </TouchableOpacity>
        );
    }

    return BadgeContent;
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        paddingVertical: SPACING.xs,
        paddingHorizontal: SPACING.md,
        borderRadius: RADIUS.full,
        ...SHADOWS.md,
    },
    processing: {
        backgroundColor: COLORS.accent,
    },
    iconContainer: {
        marginRight: SPACING.xs,
    },
    icon: {
        fontSize: 14,
    },
    count: {
        ...TYPOGRAPHY.labelSmall,
        color: COLORS.text.inverse,
        marginRight: SPACING.xs,
    },
    label: {
        ...TYPOGRAPHY.caption,
        color: COLORS.text.inverse,
        opacity: 0.9,
    },
});

export default QueueStatus;
