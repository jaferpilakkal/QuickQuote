/**
 * Waveform Component
 * Animated audio visualization during recording
 * Based on PRD Section 4.3 UI Flow
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { COLORS, RADIUS } from '../../constants/theme';

/**
 * Props for Waveform
 */
interface WaveformProps {
    /** Whether waveform is active/animating */
    isActive: boolean;
    /** Number of bars to display */
    barCount?: number;
    /** Color of the bars */
    color?: string;
    /** Optional style overrides */
    style?: ViewStyle;
}

/**
 * Single animated bar component
 */
function WaveformBar({
    index,
    isActive,
    color,
}: {
    index: number;
    isActive: boolean;
    color: string;
}) {
    const animatedHeight = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        if (isActive) {
            // Random animation for each bar
            const minHeight = 0.2;
            const maxHeight = 0.9;
            const baseDuration = 150 + (index % 3) * 50;

            const animate = () => {
                const randomHeight = minHeight + Math.random() * (maxHeight - minHeight);
                const randomDuration = baseDuration + Math.random() * 100;

                Animated.sequence([
                    Animated.timing(animatedHeight, {
                        toValue: randomHeight,
                        duration: randomDuration,
                        useNativeDriver: false,
                    }),
                    Animated.timing(animatedHeight, {
                        toValue: minHeight + Math.random() * 0.3,
                        duration: randomDuration,
                        useNativeDriver: false,
                    }),
                ]).start(({ finished }) => {
                    if (finished && isActive) {
                        animate();
                    }
                });
            };

            // Start animation with slight delay based on index
            const timeout = setTimeout(animate, index * 30);
            return () => clearTimeout(timeout);
        } else {
            // Reset to low position when not active
            Animated.timing(animatedHeight, {
                toValue: 0.3,
                duration: 200,
                useNativeDriver: false,
            }).start();
        }
    }, [isActive, index, animatedHeight]);

    return (
        <Animated.View
            style={[
                styles.bar,
                {
                    backgroundColor: color,
                    height: animatedHeight.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                    }),
                },
            ]}
        />
    );
}

/**
 * Waveform Component
 * Displays animated bars to visualize audio recording
 */
export function Waveform({
    isActive,
    barCount = 20,
    color = COLORS.primary,
    style,
}: WaveformProps) {
    return (
        <View style={[styles.container, style]}>
            {Array.from({ length: barCount }, (_, index) => (
                <WaveformBar key={index} index={index} isActive={isActive} color={color} />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 60,
        gap: 3,
    },
    bar: {
        width: 4,
        minHeight: 8,
        borderRadius: RADIUS.xs,
    },
});
