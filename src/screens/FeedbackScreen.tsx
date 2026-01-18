import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Alert,
    Linking,
    Platform,
    ScrollView,
    KeyboardAvoidingView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { COLORS, TYPOGRAPHY, SPACING, BUTTON_SIZES, RADIUS, SHADOWS } from '../constants/theme';

interface FeedbackScreenProps {
    onBack: () => void;
}

export function FeedbackScreen({ onBack }: FeedbackScreenProps) {
    const [rating, setRating] = useState<number>(0);
    const [type, setType] = useState<'bug' | 'feature' | 'general'>('general');
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (rating === 0) {
            Alert.alert('Rating Required', 'Please select a rating');
            return;
        }

        setIsSubmitting(true);

        try {
            // Construct email body
            const subject = `QuickQuote Feedback: ${type.toUpperCase()}`;
            const body = `
Rating: ${rating}/5
Type: ${type}
Feedback:
${comment}

------------------
Device Info for Developer:
OS: ${Platform.OS} ${Platform.Version}
            `.trim();

            const url = `mailto:jafer@quickquote.app?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

            const canOpen = await Linking.canOpenURL(url);
            if (canOpen) {
                await Linking.openURL(url);
                // Assume success if mail client opens
                Alert.alert(
                    'Thanks for your feedback!',
                    'Your email client has been opened. Please hit send to submit.',
                    [{ text: 'OK', onPress: onBack }]
                );
            } else {
                Alert.alert('Error', 'Could not open email client');
            }
        } catch (error) {
            Alert.alert('Error', 'Something went wrong');
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderStar = (star: number) => (
        <TouchableOpacity
            key={star}
            onPress={() => setRating(star)}
            style={styles.starButton}
        >
            <Text style={[styles.star, rating >= star && styles.starActive]}>★</Text>
        </TouchableOpacity>
    );

    const renderTypeButton = (value: 'bug' | 'feature' | 'general', label: string) => (
        <TouchableOpacity
            style={[styles.typeButton, type === value && styles.typeButtonActive]}
            onPress={() => setType(value)}
        >
            <Text style={[styles.typeText, type === value && styles.typeTextActive]}>{label}</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <StatusBar style="dark" />

            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <Text style={styles.backText}>← Settings</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Send Feedback</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.content}>
                    <Text style={styles.label}>How would you rate your experience?</Text>
                    <View style={styles.ratingContainer}>
                        {[1, 2, 3, 4, 5].map(renderStar)}
                    </View>

                    <Text style={styles.label}>What is this regarding?</Text>
                    <View style={styles.typeContainer}>
                        {renderTypeButton('bug', 'Report Bug')}
                        {renderTypeButton('feature', 'Suggest Feature')}
                        {renderTypeButton('general', 'General')}
                    </View>

                    <Text style={styles.label}>Your Feedback</Text>
                    <TextInput
                        style={styles.input}
                        multiline
                        placeholder="Tell us what you think..."
                        value={comment}
                        onChangeText={setComment}
                        textAlignVertical="top"
                    />

                    <TouchableOpacity
                        style={[styles.submitButton, isSubmitting && styles.disabledButton]}
                        onPress={handleSubmit}
                        disabled={isSubmitting}
                    >
                        <Text style={styles.submitButtonText}>Submit Feedback</Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
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
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.xl,
        paddingTop: Platform.OS === 'android' ? SPACING.xxl : SPACING.xl,
        paddingBottom: SPACING.lg,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border.light,
    },
    title: {
        ...TYPOGRAPHY.h2,
        fontSize: 20,
    },
    backButton: {
        padding: SPACING.sm,
        marginLeft: -SPACING.sm,
    },
    backText: {
        ...TYPOGRAPHY.body,
        color: COLORS.text.secondary,
    },
    content: {
        padding: SPACING.xl,
    },
    label: {
        ...TYPOGRAPHY.h3,
        marginBottom: SPACING.md,
        color: COLORS.text.primary,
        fontSize: 16,
    },
    ratingContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: SPACING.xl,
        gap: SPACING.md,
    },
    starButton: {
        padding: SPACING.xs,
    },
    star: {
        fontSize: 40,
        color: COLORS.border.medium,
    },
    starActive: {
        color: '#F59E0B', // Amber 500
    },
    typeContainer: {
        flexDirection: 'row',
        marginBottom: SPACING.xl,
        gap: SPACING.sm,
    },
    typeButton: {
        flex: 1,
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.xs,
        borderRadius: RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.border.medium,
        alignItems: 'center',
    },
    typeButtonActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    typeText: {
        ...TYPOGRAPHY.caption,
        color: COLORS.text.secondary,
        fontWeight: '600',
    },
    typeTextActive: {
        color: COLORS.text.inverse,
    },
    input: {
        backgroundColor: COLORS.backgroundWhite,
        borderWidth: 1,
        borderColor: COLORS.border.medium,
        borderRadius: RADIUS.md,
        padding: SPACING.md,
        minHeight: 120,
        ...TYPOGRAPHY.body,
        marginBottom: SPACING.xl,
    },
    submitButton: {
        backgroundColor: COLORS.primary,
        padding: SPACING.md,
        borderRadius: RADIUS.lg,
        alignItems: 'center',
        ...SHADOWS.md,
    },
    disabledButton: {
        opacity: 0.7,
    },
    submitButtonText: {
        ...TYPOGRAPHY.buttonLarge,
        color: COLORS.text.inverse,
    },
});
