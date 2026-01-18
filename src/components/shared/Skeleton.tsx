/**
 * Skeleton Component
 * Loading placeholder with shimmer animation
 * Part of Phase 7: Polish & Settings
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { COLORS, RADIUS, ANIMATION } from '../../constants/theme';

/**
 * Skeleton props
 */
export interface SkeletonProps {
    /** Width of skeleton */
    width?: number | string;
    /** Height of skeleton */
    height?: number;
    /** Border radius */
    borderRadius?: number;
    /** Whether it's circular */
    circle?: boolean;
    /** Additional style */
    style?: ViewStyle;
}

/**
 * Skeleton loading component with shimmer
 */
export function Skeleton({
    width = '100%',
    height = 16,
    borderRadius = RADIUS.sm,
    circle = false,
    style,
}: SkeletonProps): React.ReactElement {
    const shimmerAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(shimmerAnim, {
                    toValue: 1,
                    duration: ANIMATION.slow * 2,
                    useNativeDriver: true,
                }),
                Animated.timing(shimmerAnim, {
                    toValue: 0,
                    duration: ANIMATION.slow * 2,
                    useNativeDriver: true,
                }),
            ])
        );
        animation.start();
        return () => animation.stop();
    }, [shimmerAnim]);

    const opacity = shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.7],
    });

    const computedStyle: ViewStyle = {
        width: width as ViewStyle['width'],
        height: circle ? (typeof width === 'number' ? width : height) : height,
        borderRadius: circle ? (typeof width === 'number' ? width / 2 : height / 2) : borderRadius,
    };

    return (
        <Animated.View
            style={[
                styles.skeleton,
                computedStyle,
                { opacity },
                style,
            ]}
        />
    );
}

/**
 * Card skeleton for draft cards
 */
export function DraftCardSkeleton(): React.ReactElement {
    return (
        <View style={styles.cardSkeleton}>
            <Skeleton width={80} height={24} borderRadius={RADIUS.full} />
            <Skeleton width="90%" height={16} style={styles.marginTop} />
            <Skeleton width="60%" height={16} style={styles.marginTop} />
            <View style={styles.cardFooter}>
                <Skeleton width={100} height={12} />
            </View>
        </View>
    );
}

/**
 * List skeleton with multiple cards
 */
export function DraftListSkeleton({ count = 3 }: { count?: number }): React.ReactElement {
    return (
        <View>
            {Array.from({ length: count }).map((_, index) => (
                <DraftCardSkeleton key={index} />
            ))}
        </View>
    );
}

/**
 * Invoice item skeleton
 */
export function InvoiceItemSkeleton(): React.ReactElement {
    return (
        <View style={styles.itemSkeleton}>
            <View style={styles.itemLeft}>
                <Skeleton width="70%" height={18} />
                <Skeleton width="40%" height={14} style={styles.marginTopSmall} />
            </View>
            <Skeleton width={80} height={20} />
        </View>
    );
}

const styles = StyleSheet.create({
    skeleton: {
        backgroundColor: COLORS.surfaceSecondary,
    },
    marginTop: {
        marginTop: 12,
    },
    marginTopSmall: {
        marginTop: 6,
    },
    cardSkeleton: {
        backgroundColor: COLORS.backgroundWhite,
        borderRadius: RADIUS.xl,
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 12,
    },
    cardFooter: {
        marginTop: 16,
    },
    itemSkeleton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: COLORS.border.light,
    },
    itemLeft: {
        flex: 1,
        marginRight: 16,
    },
});

export default Skeleton;
