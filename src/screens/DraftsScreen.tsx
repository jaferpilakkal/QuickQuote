/**
 * DraftsScreen Component
 * Displays list of saved drafts with search and delete
 * Part of Phase 6: Drafts & History
 */

import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    Alert,
    RefreshControl,
    ActivityIndicator,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useDrafts } from '../hooks/useDrafts';
import { DraftCard } from '../components/drafts';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { AppHaptics } from '../utils/haptics';
import type { DraftRecord } from '../types/database';

/**
 * DraftsScreen props
 */
export interface DraftsScreenProps {
    /** Navigate to editor with draft */
    onNavigateToEditor?: (draft: DraftRecord) => void;
    /** Navigate to processing with draft */
    onNavigateToProcessing?: (draft: DraftRecord) => void;
    /** Navigate back to home */
    onNavigateBack?: () => void;
}

/**
 * Empty state component
 */
function EmptyState({ isSearching }: { isSearching: boolean }) {
    return (
        <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>{isSearching ? '🔍' : '📋'}</Text>
            <Text style={styles.emptyTitle}>
                {isSearching ? 'No Results' : 'No Drafts Yet'}
            </Text>
            <Text style={styles.emptySubtitle}>
                {isSearching
                    ? 'Try a different search term'
                    : 'Record an invoice to get started'}
            </Text>
        </View>
    );
}

/**
 * DraftsScreen Component
 */
export function DraftsScreen({
    onNavigateToEditor,
    onNavigateToProcessing,
    onNavigateBack,
}: DraftsScreenProps): React.ReactElement {
    const {
        drafts,
        isLoading,
        error,
        refresh,
        deleteDraftById,
        search,
        clearSearch,
        searchQuery,
        isSearching,
        sortBy,
        toggleSortOrder,
        sortOrder,
    } = useDrafts();

    const [searchText, setSearchText] = useState('');

    /**
     * Handle search input
     */
    const handleSearch = useCallback((text: string) => {
        setSearchText(text);
        if (text.length >= 2) {
            search(text);
        } else if (text.length === 0) {
            clearSearch();
        }
    }, [search, clearSearch]);

    /**
     * Handle draft press - show options
     */
    const handleDraftPress = useCallback((draft: DraftRecord) => {
        AppHaptics.buttonPress();

        const options: any[] = [
            { text: 'Cancel', style: 'cancel' },
        ];

        // Add delete option
        options.push({
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
                try {
                    await deleteDraftById(draft.id);
                    AppHaptics.deleteConfirm();
                } catch {
                    Alert.alert('Error', 'Failed to delete draft');
                }
            },
        });

        // Add replay option if audio exists
        if (draft.audioPath && onNavigateToProcessing) {
            options.unshift({
                text: '🎵 Replay Recording',
                onPress: () => onNavigateToProcessing(draft),
            });
        }
        // If already has invoice data, go to editor
        else if (draft.invoiceData && onNavigateToEditor) {
            options.unshift({
                text: '✏️ Edit Invoice',
                onPress: () => onNavigateToEditor(draft),
            });
        }

        Alert.alert(
            'Draft Options',
            `Created: ${new Date(draft.createdAt).toLocaleDateString()}`,
            options
        );
    }, [onNavigateToEditor, onNavigateToProcessing, deleteDraftById]);

    /**
     * Handle delete
     */
    const handleDelete = useCallback((draft: DraftRecord) => {
        Alert.alert(
            'Delete Draft?',
            'This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteDraftById(draft.id);
                            AppHaptics.deleteConfirm();
                        } catch {
                            Alert.alert('Error', 'Failed to delete draft');
                        }
                    },
                },
            ]
        );
    }, [deleteDraftById]);

    /**
     * Render draft item
     */
    const renderItem = useCallback(({ item }: { item: DraftRecord }) => (
        <DraftCard
            draft={item}
            onPress={handleDraftPress}
            onDelete={handleDelete}
        />
    ), [handleDraftPress, handleDelete]);

    /**
     * Key extractor
     */
    const keyExtractor = useCallback((item: DraftRecord) => item.id, []);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar style="dark" />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    {onNavigateBack && (
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={onNavigateBack}
                        >
                            <Text style={styles.backIcon}>←</Text>
                        </TouchableOpacity>
                    )}
                    <Text style={styles.title}>Drafts</Text>
                    <TouchableOpacity
                        style={styles.sortButton}
                        onPress={toggleSortOrder}
                    >
                        <Text style={styles.sortIcon}>
                            {sortOrder === 'desc' ? '↓' : '↑'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Search bar */}
                <View style={styles.searchContainer}>
                    <Text style={styles.searchIcon}>🔍</Text>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search drafts..."
                        placeholderTextColor={COLORS.text.tertiary}
                        value={searchText}
                        onChangeText={handleSearch}
                        returnKeyType="search"
                        autoCorrect={false}
                    />
                    {searchText.length > 0 && (
                        <TouchableOpacity
                            onPress={() => handleSearch('')}
                            style={styles.clearButton}
                        >
                            <Text style={styles.clearIcon}>✕</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Content */}
            {isLoading && drafts.length === 0 ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : error ? (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={refresh}>
                        <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={drafts}
                    renderItem={renderItem}
                    keyExtractor={keyExtractor}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={isLoading}
                            onRefresh={refresh}
                            colors={[COLORS.primary]}
                            tintColor={COLORS.primary}
                        />
                    }
                    ListEmptyComponent={<EmptyState isSearching={isSearching} />}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        paddingHorizontal: SPACING.lg,
        paddingTop: Platform.OS === 'android' ? SPACING.lg : SPACING.sm,
        paddingBottom: SPACING.md,
        backgroundColor: COLORS.background,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: SPACING.md,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    backIcon: {
        fontSize: 24,
        color: COLORS.text.primary,
    },
    title: {
        ...TYPOGRAPHY.h1,
        color: COLORS.text.primary,
        flex: 1,
        textAlign: 'center',
    },
    sortButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.surfaceSecondary,
        borderRadius: RADIUS.md,
    },
    sortIcon: {
        fontSize: 18,
        color: COLORS.text.secondary,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surfaceSecondary,
        borderRadius: RADIUS.lg,
        paddingHorizontal: SPACING.md,
        height: 44,
    },
    searchIcon: {
        fontSize: 16,
        marginRight: SPACING.sm,
    },
    searchInput: {
        flex: 1,
        ...TYPOGRAPHY.body,
        color: COLORS.text.primary,
        paddingVertical: 0,
    },
    clearButton: {
        padding: SPACING.xs,
    },
    clearIcon: {
        fontSize: 14,
        color: COLORS.text.tertiary,
    },
    listContent: {
        paddingTop: SPACING.md,
        paddingBottom: SPACING.xxl,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    errorContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACING.xl,
    },
    errorText: {
        ...TYPOGRAPHY.body,
        color: COLORS.error,
        textAlign: 'center',
        marginBottom: SPACING.lg,
    },
    retryButton: {
        paddingHorizontal: SPACING.xl,
        paddingVertical: SPACING.md,
        backgroundColor: COLORS.primary,
        borderRadius: RADIUS.lg,
    },
    retryText: {
        ...TYPOGRAPHY.button,
        color: COLORS.text.inverse,
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
        paddingHorizontal: SPACING.xl,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: SPACING.lg,
    },
    emptyTitle: {
        ...TYPOGRAPHY.h2,
        color: COLORS.text.primary,
        marginBottom: SPACING.sm,
    },
    emptySubtitle: {
        ...TYPOGRAPHY.body,
        color: COLORS.text.secondary,
        textAlign: 'center',
    },
});

export default DraftsScreen;
