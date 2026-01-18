/**
 * OnboardingScreen Component
 * First-run experience with permission request
 * Part of Phase 7: Polish & Settings
 */

import React, { useState, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    Animated,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Audio } from 'expo-av';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, ANIMATION } from '../constants/theme';
import { AppHaptics } from '../utils/haptics';
import { setSetting } from '../database';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * OnboardingScreen props
 */
export interface OnboardingScreenProps {
    /** Callback when onboarding is complete */
    onComplete: () => void;
}

/**
 * Slide data
 */
interface SlideData {
    icon: string;
    title: string;
    description: string;
    highlight?: string;
}

const SLIDES: SlideData[] = [
    {
        icon: '🎙️',
        title: 'Speak Your Invoice',
        description: 'Just tap and talk. Describe your items, prices, and quantities naturally.',
        highlight: 'No typing needed!',
    },
    {
        icon: '🤖',
        title: 'AI Does the Work',
        description: 'Our AI converts your voice into a structured invoice instantly.',
        highlight: 'Smart & accurate',
    },
    {
        icon: '📤',
        title: 'Share Anywhere',
        description: 'Send invoices via WhatsApp, email, or as a professional PDF.',
        highlight: 'One tap to share',
    },
];

/**
 * Single slide component
 */
function OnboardingSlide({ slide, index }: { slide: SlideData; index: number }) {
    return (
        <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
            <View style={styles.iconContainer}>
                <Text style={styles.icon}>{slide.icon}</Text>
            </View>
            <Text style={styles.slideTitle}>{slide.title}</Text>
            <Text style={styles.slideDescription}>{slide.description}</Text>
            {slide.highlight && (
                <View style={styles.highlightBadge}>
                    <Text style={styles.highlightText}>{slide.highlight}</Text>
                </View>
            )}
        </View>
    );
}

/**
 * OnboardingScreen Component
 */
export function OnboardingScreen({ onComplete }: OnboardingScreenProps): React.ReactElement {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [permissionGranted, setPermissionGranted] = useState(false);
    const scrollX = useRef(new Animated.Value(0)).current;
    const flatListRef = useRef<any>(null);

    /**
     * Handle next button press
     */
    const handleNext = useCallback(() => {
        if (currentIndex < SLIDES.length - 1) {
            const nextIndex = currentIndex + 1;
            flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
            setCurrentIndex(nextIndex);
            AppHaptics.selection();
        }
    }, [currentIndex]);

    /**
     * Handle skip
     */
    const handleSkip = useCallback(async () => {
        AppHaptics.buttonPress();
        await setSetting('onboarding_complete', true);
        onComplete();
    }, [onComplete]);

    /**
     * Request microphone permission
     */
    const handleRequestPermission = useCallback(async () => {
        try {
            const { status } = await Audio.requestPermissionsAsync();
            if (status === 'granted') {
                setPermissionGranted(true);
                AppHaptics.saveSuccess();
            } else {
                AppHaptics.error();
            }
        } catch (error) {
            console.error('Permission request failed:', error);
        }
    }, []);

    /**
     * Complete onboarding
     */
    const handleGetStarted = useCallback(async () => {
        AppHaptics.saveSuccess();
        await setSetting('onboarding_complete', true);
        onComplete();
    }, [onComplete]);

    /**
     * Handle scroll
     */
    const handleScroll = Animated.event(
        [{ nativeEvent: { contentOffset: { x: scrollX } } }],
        { useNativeDriver: false }
    );

    /**
     * Handle scroll end
     */
    const handleScrollEnd = (e: any) => {
        const newIndex = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
        setCurrentIndex(newIndex);
    };

    const isLastSlide = currentIndex === SLIDES.length - 1;

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <StatusBar style="dark" />

            {/* Skip button */}
            {!isLastSlide && (
                <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                    <Text style={styles.skipText}>Skip</Text>
                </TouchableOpacity>
            )}

            {/* Slides */}
            <Animated.FlatList
                ref={flatListRef}
                data={SLIDES}
                renderItem={({ item, index }) => (
                    <OnboardingSlide slide={item} index={index} />
                )}
                keyExtractor={(_, index) => String(index)}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                onMomentumScrollEnd={handleScrollEnd}
                scrollEventThrottle={16}
                contentContainerStyle={styles.slidesContainer}
            />

            {/* Pagination dots */}
            <View style={styles.pagination}>
                {SLIDES.map((_, index) => {
                    const inputRange = [
                        (index - 1) * SCREEN_WIDTH,
                        index * SCREEN_WIDTH,
                        (index + 1) * SCREEN_WIDTH,
                    ];
                    const dotWidth = scrollX.interpolate({
                        inputRange,
                        outputRange: [8, 24, 8],
                        extrapolate: 'clamp',
                    });
                    const dotOpacity = scrollX.interpolate({
                        inputRange,
                        outputRange: [0.3, 1, 0.3],
                        extrapolate: 'clamp',
                    });
                    return (
                        <Animated.View
                            key={index}
                            style={[
                                styles.dot,
                                { width: dotWidth, opacity: dotOpacity },
                            ]}
                        />
                    );
                })}
            </View>

            {/* Bottom actions */}
            <View style={styles.bottomActions}>
                {isLastSlide ? (
                    // Last slide: Request permission or Get Started
                    <>
                        {!permissionGranted ? (
                            <TouchableOpacity
                                style={styles.primaryButton}
                                onPress={handleRequestPermission}
                            >
                                <Text style={styles.primaryButtonIcon}>🎙️</Text>
                                <Text style={styles.primaryButtonText}>
                                    Enable Microphone
                                </Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                style={[styles.primaryButton, styles.successButton]}
                                onPress={handleGetStarted}
                            >
                                <Text style={styles.primaryButtonIcon}>✓</Text>
                                <Text style={styles.primaryButtonText}>
                                    Get Started
                                </Text>
                            </TouchableOpacity>
                        )}
                        {!permissionGranted && (
                            <TouchableOpacity
                                style={styles.skipLater}
                                onPress={handleGetStarted}
                            >
                                <Text style={styles.skipLaterText}>
                                    I'll do this later
                                </Text>
                            </TouchableOpacity>
                        )}
                    </>
                ) : (
                    // Other slides: Next button
                    <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                        <Text style={styles.nextButtonText}>Next</Text>
                        <Text style={styles.nextArrow}>→</Text>
                    </TouchableOpacity>
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
    skipButton: {
        position: 'absolute',
        top: Platform.OS === 'android' ? SPACING.xl : SPACING.lg,
        right: SPACING.lg,
        zIndex: 10,
        padding: SPACING.sm,
    },
    skipText: {
        ...TYPOGRAPHY.body,
        color: COLORS.text.secondary,
    },
    slidesContainer: {
        alignItems: 'center',
    },
    slide: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: SPACING.xxl,
    },
    iconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: COLORS.primary + '15',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.xxl,
    },
    icon: {
        fontSize: 56,
    },
    slideTitle: {
        ...TYPOGRAPHY.h1,
        color: COLORS.text.primary,
        textAlign: 'center',
        marginBottom: SPACING.lg,
    },
    slideDescription: {
        ...TYPOGRAPHY.bodyLarge,
        color: COLORS.text.secondary,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: SPACING.lg,
    },
    highlightBadge: {
        backgroundColor: COLORS.accent + '20',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.sm,
        borderRadius: RADIUS.full,
    },
    highlightText: {
        ...TYPOGRAPHY.captionBold,
        color: COLORS.accent,
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.xxl,
    },
    dot: {
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.primary,
        marginHorizontal: 4,
    },
    bottomActions: {
        paddingHorizontal: SPACING.xl,
        paddingBottom: Platform.OS === 'android' ? SPACING.xxl : SPACING.lg,
    },
    nextButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        height: 56,
        borderRadius: RADIUS.lg,
        ...SHADOWS.elevated,
    },
    nextButtonText: {
        ...TYPOGRAPHY.buttonLarge,
        color: COLORS.text.inverse,
        marginRight: SPACING.sm,
    },
    nextArrow: {
        fontSize: 20,
        color: COLORS.text.inverse,
    },
    primaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        height: 56,
        borderRadius: RADIUS.lg,
        ...SHADOWS.elevated,
    },
    successButton: {
        backgroundColor: COLORS.success,
    },
    primaryButtonIcon: {
        fontSize: 20,
        marginRight: SPACING.sm,
    },
    primaryButtonText: {
        ...TYPOGRAPHY.buttonLarge,
        color: COLORS.text.inverse,
    },
    skipLater: {
        alignItems: 'center',
        paddingVertical: SPACING.lg,
    },
    skipLaterText: {
        ...TYPOGRAPHY.body,
        color: COLORS.text.tertiary,
    },
});

export default OnboardingScreen;
