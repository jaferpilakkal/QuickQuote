/**
 * RecordButton Component
 * Large animated button for recording control
 * Based on PRD Section 4.3 UI Flow
 */

import React from 'react';
import {
    TouchableOpacity,
    View,
    Text,
    StyleSheet,
    Animated,
    ViewStyle,
} from 'react-native';
import { COLORS, SPACING, RADIUS, SHADOWS, TYPOGRAPHY, TOUCH_TARGET, ANIMATION } from '../../constants/theme';
import type { RecordingState } from '../../types/audio';

/**
 * Props for RecordButton
 */
interface RecordButtonProps {
    /** Current recording state */
    state: RecordingState;
    /** Called when button is pressed */
    onPress: () => void;
    /** Whether button is disabled */
    disabled?: boolean;
    /** Optional style overrides */
    style?: ViewStyle;
}

/**
 * Get button colors based on state
 */
function getButtonColors(state: RecordingState) {
    switch (state) {
        case 'recording':
            return {
                background: COLORS.recording.active,
                shadow: COLORS.recording.active,
                icon: '⏹️',
            };
        case 'paused':
            return {
                background: COLORS.warning,
                shadow: COLORS.warning,
                icon: '▶️',
            };
        case 'stopped':
            return {
                background: COLORS.success,
                shadow: COLORS.success,
                icon: '✓',
            };
        case 'error':
            return {
                background: COLORS.error,
                shadow: COLORS.error,
                icon: '⚠️',
            };
        default:
            return {
                background: COLORS.primary,
                shadow: COLORS.primary,
                icon: '🎤',
            };
    }
}

/**
 * RecordButton Component
 * Large circular button with recording indicator
 */
export function RecordButton({ state, onPress, disabled = false, style }: RecordButtonProps) {
    const colors = getButtonColors(state);
    const isRecording = state === 'recording';

    // Animated value for pulsing effect
    const [pulseAnim] = React.useState(new Animated.Value(1));

    // Pulse animation when recording
    React.useEffect(() => {
        if (isRecording) {
            const pulse = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.05,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                ])
            );
            pulse.start();
            return () => pulse.stop();
        } else {
            pulseAnim.setValue(1);
        }
    }, [isRecording, pulseAnim]);

    return (
        <View style={[styles.container, style]}>
            {/* Outer ring for recording indicator */}
            {isRecording && (
                <View style={[styles.outerRing, { borderColor: colors.background }]} />
            )}

            {/* Main button */}
            <Animated.View
                style={[
                    styles.buttonWrapper,
                    { transform: [{ scale: pulseAnim }] },
                ]}
            >
                <TouchableOpacity
                    style={[
                        styles.button,
                        { backgroundColor: colors.background },
                        {
                            shadowColor: colors.shadow,
                        },
                        disabled && styles.buttonDisabled,
                    ]}
                    onPress={onPress}
                    disabled={disabled}
                    activeOpacity={0.8}
                    accessibilityLabel={
                        isRecording ? 'Stop recording' : 'Start recording'
                    }
                    accessibilityRole="button"
                    accessibilityState={{ disabled }}
                >
                    <Text style={styles.icon}>{colors.icon}</Text>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
}

const BUTTON_SIZE = 120;

const styles = StyleSheet.create({
    container: {
        width: BUTTON_SIZE + 20,
        height: BUTTON_SIZE + 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    outerRing: {
        position: 'absolute',
        width: BUTTON_SIZE + 16,
        height: BUTTON_SIZE + 16,
        borderRadius: (BUTTON_SIZE + 16) / 2,
        borderWidth: 3,
        opacity: 0.3,
    },
    buttonWrapper: {
        width: BUTTON_SIZE,
        height: BUTTON_SIZE,
        borderRadius: BUTTON_SIZE / 2,
    },
    button: {
        width: BUTTON_SIZE,
        height: BUTTON_SIZE,
        borderRadius: BUTTON_SIZE / 2,
        alignItems: 'center',
        justifyContent: 'center',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    icon: {
        fontSize: 48,
    },
});
