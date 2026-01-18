/**
 * Timer Component
 * Displays recording duration with progress indicator
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING } from '../../constants/theme';

/**
 * Props for Timer
 */
interface TimerProps {
    /** Formatted duration string (MM:SS) */
    duration: string;
    /** Progress percentage (0-100) */
    progress?: number;
    /** Whether timer is active */
    isRecording?: boolean;
    /** Optional style overrides */
    style?: ViewStyle;
}

/**
 * Timer Component
 * Displays the recording duration with optional progress bar
 */
export function Timer({ duration, progress = 0, isRecording = false, style }: TimerProps) {
    return (
        <View style={[styles.container, style]}>
            <Text
                style={[
                    styles.duration,
                    isRecording && styles.durationRecording,
                ]}
                accessibilityLabel={`Recording duration: ${duration}`}
            >
                {duration}
            </Text>

            {isRecording && (
                <View style={styles.progressContainer}>
                    <View style={styles.progressBackground}>
                        <View
                            style={[
                                styles.progressFill,
                                { width: `${progress}%` },
                            ]}
                        />
                    </View>
                    <Text style={styles.progressText}>{Math.round(progress)}%</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    duration: {
        fontSize: 28,
        fontWeight: '700',
        lineHeight: 34,
        color: COLORS.text.primary,
    },
    durationRecording: {
        color: COLORS.recording.active,
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: SPACING.sm,
        gap: SPACING.sm,
    },
    progressBackground: {
        width: 100,
        height: 4,
        backgroundColor: COLORS.border.default,
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: COLORS.recording.active,
        borderRadius: 2,
    },
    progressText: {
        ...TYPOGRAPHY.caption,
        color: COLORS.text.secondary,
        width: 35,
    },
});
