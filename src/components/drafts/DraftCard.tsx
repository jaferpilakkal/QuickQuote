/**
 * DraftCard Component
 * Displays a single draft with summary and actions
 * Part of Phase 6: Drafts & History
 */

import React, { useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    PanResponder,
    Dimensions,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, ANIMATION } from '../../constants/theme';
import type { DraftRecord, SyncStatus } from '../../types/database';
import { format, formatDistanceToNow } from 'date-fns';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = 80;

/**
 * Props for DraftCard
 */
export interface DraftCardProps {
    /** Draft data */
    draft: DraftRecord;
    /** Callback when card is tapped */
    onPress: (draft: DraftRecord) => void;
    /** Callback when delete is triggered */
    onDelete: (draft: DraftRecord) => void;
}

/**
 * Get status badge color and text
 */
function getStatusInfo(draft: DraftRecord): { color: string; text: string; icon: string } {
    if (draft.sharedAt) {
        return { color: COLORS.success, text: 'Shared', icon: '✓' };
    }

    switch (draft.syncStatus) {
        case 'queued':
            return { color: COLORS.warning, text: 'Queued', icon: '⏳' };
        case 'syncing':
            return { color: COLORS.accent, text: 'Syncing', icon: '⟳' };
        case 'synced':
            return { color: COLORS.success, text: 'Ready', icon: '✓' };
        case 'failed':
            return { color: COLORS.error, text: 'Failed', icon: '✗' };
        default:
            return { color: COLORS.text.tertiary, text: 'Draft', icon: '📝' };
    }
}

/**
 * Get preview text from draft
 */
function getPreviewText(draft: DraftRecord): string {
    if (draft.invoiceData) {
        try {
            const invoice = JSON.parse(draft.invoiceData);
            if (invoice.items && invoice.items.length > 0) {
                const itemCount = invoice.items.length;
                const total = invoice.total || 0;
                return `${itemCount} item${itemCount > 1 ? 's' : ''} • ₹${total.toLocaleString()}`;
            }
        } catch {
            // Fall through
        }
    }

    if (draft.transcript) {
        return draft.transcript.slice(0, 80) + (draft.transcript.length > 80 ? '...' : '');
    }

    if (draft.audioDuration) {
        const seconds = Math.floor(draft.audioDuration / 1000);
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `Audio recording • ${mins}:${secs.toString().padStart(2, '0')}`;
    }

    return 'No content';
}

/**
 * DraftCard Component with swipe-to-delete
 */
export function DraftCard({ draft, onPress, onDelete }: DraftCardProps): React.ReactElement {
    const translateX = useRef(new Animated.Value(0)).current;
    const statusInfo = getStatusInfo(draft);
    const previewText = getPreviewText(draft);
    const timeAgo = formatDistanceToNow(new Date(draft.updatedAt), { addSuffix: true });

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, gestureState) => {
                return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 10;
            },
            onPanResponderMove: (_, gestureState) => {
                if (gestureState.dx < 0) {
                    translateX.setValue(Math.max(gestureState.dx, -SWIPE_THRESHOLD - 40));
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dx < -SWIPE_THRESHOLD) {
                    // Show delete button
                    Animated.spring(translateX, {
                        toValue: -SWIPE_THRESHOLD,
                        useNativeDriver: true,
                        tension: 40,
                        friction: 8,
                    }).start();
                } else {
                    // Snap back
                    Animated.spring(translateX, {
                        toValue: 0,
                        useNativeDriver: true,
                        tension: 40,
                        friction: 8,
                    }).start();
                }
            },
        })
    ).current;

    const handleDelete = () => {
        Animated.timing(translateX, {
            toValue: -SCREEN_WIDTH,
            duration: ANIMATION.normal,
            useNativeDriver: true,
        }).start(() => {
            onDelete(draft);
        });
    };

    const resetSwipe = () => {
        Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
        }).start();
    };

    return (
        <View style={styles.container}>
            {/* Delete action background */}
            <View style={styles.deleteBackground}>
                <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                    <Text style={styles.deleteIcon}>🗑️</Text>
                    <Text style={styles.deleteText}>Delete</Text>
                </TouchableOpacity>
            </View>

            {/* Card content */}
            <Animated.View
                style={[
                    styles.card,
                    { transform: [{ translateX }] },
                ]}
                {...panResponder.panHandlers}
            >
                <TouchableOpacity
                    style={styles.cardContent}
                    onPress={() => {
                        resetSwipe();
                        onPress(draft);
                    }}
                    activeOpacity={0.7}
                >
                    {/* Status badge */}
                    <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
                        <Text style={styles.statusIcon}>{statusInfo.icon}</Text>
                        <Text style={[styles.statusText, { color: statusInfo.color }]}>
                            {statusInfo.text}
                        </Text>
                    </View>

                    {/* Preview text */}
                    <Text style={styles.preview} numberOfLines={2}>
                        {previewText}
                    </Text>

                    {/* Footer with time */}
                    <View style={styles.footer}>
                        <Text style={styles.time}>{timeAgo}</Text>
                        <Text style={styles.chevron}>›</Text>
                    </View>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginHorizontal: SPACING.lg,
        marginBottom: SPACING.md,
        borderRadius: RADIUS.xl,
        overflow: 'hidden',
    },
    deleteBackground: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: SWIPE_THRESHOLD + 20,
        backgroundColor: COLORS.error,
        borderRadius: RADIUS.xl,
        justifyContent: 'center',
        alignItems: 'center',
    },
    deleteButton: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: SPACING.lg,
    },
    deleteIcon: {
        fontSize: 20,
        marginBottom: SPACING.xs,
    },
    deleteText: {
        ...TYPOGRAPHY.caption,
        color: COLORS.text.inverse,
        fontWeight: '600',
    },
    card: {
        backgroundColor: COLORS.backgroundWhite,
        borderRadius: RADIUS.xl,
        ...SHADOWS.card,
    },
    cardContent: {
        padding: SPACING.lg,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: SPACING.sm,
        paddingVertical: SPACING.xs,
        borderRadius: RADIUS.full,
        marginBottom: SPACING.sm,
    },
    statusIcon: {
        fontSize: 12,
        marginRight: SPACING.xs,
    },
    statusText: {
        ...TYPOGRAPHY.captionBold,
    },
    preview: {
        ...TYPOGRAPHY.body,
        color: COLORS.text.primary,
        marginBottom: SPACING.md,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    time: {
        ...TYPOGRAPHY.caption,
        color: COLORS.text.tertiary,
    },
    chevron: {
        ...TYPOGRAPHY.h2,
        color: COLORS.text.tertiary,
    },
});

export default DraftCard;
