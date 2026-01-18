/**
 * Haptic Feedback Utilities
 * Provides tactile feedback for key actions
 */

import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Haptic feedback types
 */
export const HapticType = {
    /** Light tap - for selections */
    LIGHT: 'light',
    /** Medium tap - for toggles */
    MEDIUM: 'medium',
    /** Heavy tap - for important actions */
    HEAVY: 'heavy',
    /** Success notification */
    SUCCESS: 'success',
    /** Warning notification */
    WARNING: 'warning',
    /** Error notification */
    ERROR: 'error',
} as const;

export type HapticType = (typeof HapticType)[keyof typeof HapticType];

/**
 * Trigger haptic feedback
 */
export async function haptic(type: HapticType): Promise<void> {
    // Haptics only work on physical devices
    if (Platform.OS === 'web') return;

    try {
        switch (type) {
            case 'light':
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                break;
            case 'medium':
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                break;
            case 'heavy':
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                break;
            case 'success':
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                break;
            case 'warning':
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                break;
            case 'error':
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                break;
        }
    } catch (error) {
        // Silently fail - haptics are non-critical
        console.warn('Haptic feedback failed:', error);
    }
}

/**
 * Pre-defined haptic events for the app
 */
export const AppHaptics = {
    /** Recording started */
    recordStart: () => haptic('medium'),
    /** Recording stopped */
    recordStop: () => haptic('heavy'),
    /** Save successful */
    saveSuccess: () => haptic('success'),
    /** Delete confirmation */
    deleteConfirm: () => haptic('warning'),
    /** Share successful */
    shareSuccess: () => haptic('success'),
    /** Error occurred */
    error: () => haptic('error'),
    /** Button press */
    buttonPress: () => haptic('light'),
    /** Selection changed */
    selection: () => haptic('light'),
} as const;
