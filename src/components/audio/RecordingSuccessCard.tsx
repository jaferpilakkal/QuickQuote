/**
 * RecordingSuccessCard Component
 * Visual feedback card for successful recording
 * Follows premium design aesthetic with animations
 */

import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    TouchableOpacity,
    ViewStyle,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, ANIMATION } from '../../constants/theme';
import { Waveform } from './Waveform';

interface RecordingSuccessCardProps {
    /** Formatted duration string (e.g., "0:03") */
    duration: string;
    /** Whether audio is currently playing */
    isPlaying: boolean;
    /** Called when play/pause button is pressed */
    onPlayToggle: () => void;
    /** Optional style overrides */
    style?: ViewStyle;
}

/**
 * RecordingSuccessCard Component
 * Displays a premium success card when recording is saved
 */
export function RecordingSuccessCard({
    duration,
    isPlaying,
    onPlayToggle,
    style,
}: RecordingSuccessCardProps) {
    // Animation values
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;
    const checkmarkScale = useRef(new Animated.Value(0)).current;

    // Entrance animation
    useEffect(() => {
        Animated.parallel([
            // Card fade and scale in
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
                toValue: 1,
                duration: ANIMATION.normal,
                useNativeDriver: true,
            }),
        ]).start(() => {
            // Checkmark bounce after card appears
            Animated.spring(checkmarkScale, {
                toValue: 1,
                tension: 100,
                friction: 5,
                useNativeDriver: true,
            }).start();
        });
    }, [scaleAnim, opacityAnim, checkmarkScale]);

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    opacity: opacityAnim,
                    transform: [{ scale: scaleAnim }],
                },
                style,
            ]}
        >
            {/* Success header */}
            <View style={styles.header}>
                <Animated.View
                    style={[
                        styles.checkmarkContainer,
                        { transform: [{ scale: checkmarkScale }] },
                    ]}
                >
                    <Text style={styles.checkmark}>✓</Text>
                </Animated.View>
                <View style={styles.headerText}>
                    <Text style={styles.successTitle}>Recording Saved!</Text>
                    <Text style={styles.duration}>{duration} recording</Text>
                </View>
            </View>

            {/* Waveform preview */}
            <View style={styles.waveformContainer}>
                <Waveform
                    isActive={isPlaying}
                    barCount={24}
                    color={COLORS.primary}
                />
            </View>

            {/* Play button */}
            <TouchableOpacity
                style={styles.playButton}
                onPress={onPlayToggle}
                activeOpacity={0.7}
                accessibilityLabel={isPlaying ? 'Pause recording' : 'Play recording'}
                accessibilityRole="button"
            >
                <Text style={styles.playIcon}>{isPlaying ? '⏸️' : '▶️'}</Text>
                <Text style={styles.playText}>
                    {isPlaying ? 'Pause' : 'Play Preview'}
                </Text>
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.backgroundWhite,
        borderRadius: RADIUS.xl,
        padding: SPACING.xl,
        marginHorizontal: SPACING.lg,
        ...SHADOWS.card,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.lg,
    },
    checkmarkContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.success + '15',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: SPACING.md,
    },
    checkmark: {
        fontSize: 20,
        color: COLORS.success,
        fontWeight: '700',
    },
    headerText: {
        flex: 1,
    },
    successTitle: {
        ...TYPOGRAPHY.h3,
        color: COLORS.text.primary,
        marginBottom: SPACING.xxs,
    },
    duration: {
        ...TYPOGRAPHY.body,
        color: COLORS.text.secondary,
    },
    waveformContainer: {
        height: 48,
        justifyContent: 'center',
        marginBottom: SPACING.lg,
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.md,
        paddingHorizontal: SPACING.md,
    },
    playButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 48,
        borderRadius: RADIUS.md,
        borderWidth: 1.5,
        borderColor: COLORS.border.medium,
        backgroundColor: COLORS.backgroundWhite,
    },
    playIcon: {
        fontSize: 16,
        marginRight: SPACING.sm,
    },
    playText: {
        ...TYPOGRAPHY.buttonSmall,
        color: COLORS.primary,
    },
});
