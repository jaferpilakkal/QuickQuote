/**
 * OfflineIndicator Component
 * Displays an animated banner when the device is offline
 * Part of Phase 5: Offline & Sync
 */

import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, ANIMATION, SHADOWS } from '../../constants/theme';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

/**
 * Props for OfflineIndicator
 */
export interface OfflineIndicatorProps {
    /** Custom message to display (optional) */
    message?: string;
    /** Whether to show even when online (for testing) */
    forceShow?: boolean;
}

/**
 * Offline indicator banner component
 * Slides down from top when offline, with smooth animation
 */
export function OfflineIndicator({
    message = "You're offline. Recordings will be queued.",
    forceShow = false,
}: OfflineIndicatorProps): React.ReactElement | null {
    const { isOffline, isReady } = useNetworkStatus();
    const insets = useSafeAreaInsets();

    // Animation value for slide in/out
    const slideAnim = useRef(new Animated.Value(-100)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    const shouldShow = forceShow || (isReady && isOffline);

    useEffect(() => {
        if (shouldShow) {
            // Slide in
            Animated.parallel([
                Animated.spring(slideAnim, {
                    toValue: 0,
                    useNativeDriver: true,
                    tension: 50,
                    friction: 8,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: ANIMATION.normal,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            // Slide out
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: -100,
                    duration: ANIMATION.fast,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 0,
                    duration: ANIMATION.fast,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [shouldShow, slideAnim, opacityAnim]);

    // Don't render if not ready yet
    if (!isReady && !forceShow) {
        return null;
    }

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    paddingTop: insets.top + SPACING.sm,
                    transform: [{ translateY: slideAnim }],
                    opacity: opacityAnim,
                },
            ]}
            pointerEvents={shouldShow ? 'auto' : 'none'}
        >
            <View style={styles.content}>
                {/* Offline Icon */}
                <View style={styles.iconContainer}>
                    <Text style={styles.icon}>📡</Text>
                </View>

                {/* Message */}
                <Text style={styles.message}>{message}</Text>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        backgroundColor: COLORS.warning,
        paddingBottom: SPACING.sm,
        paddingHorizontal: SPACING.lg,
        ...SHADOWS.md,
        ...Platform.select({
            ios: {
                shadowColor: COLORS.warning,
            },
            android: {},
        }),
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainer: {
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: SPACING.sm,
    },
    icon: {
        fontSize: 16,
    },
    message: {
        ...TYPOGRAPHY.bodySmall,
        fontWeight: '600',
        color: COLORS.text.primary,
        textAlign: 'center',
    },
});

export default OfflineIndicator;
