/**
 * useDrafts Hook
 * Manages drafts data loading and operations
 * Part of Phase 6: Drafts & History
 */

import { useState, useEffect, useCallback } from 'react';
import {
    getAllDrafts,
    getDraftById,
    deleteDraft,
    searchDrafts,
} from '../database';
import type { DraftRecord } from '../types/database';

/**
 * Sort options for drafts
 */
export type DraftSortBy = 'updatedAt' | 'createdAt';
export type DraftSortOrder = 'asc' | 'desc';

/**
 * Hook return type
 */
export interface UseDraftsReturn {
    /** List of drafts */
    drafts: DraftRecord[];
    /** Loading state */
    isLoading: boolean;
    /** Error message if any */
    error: string | null;
    /** Refresh drafts from database */
    refresh: () => Promise<void>;
    /** Delete a draft by ID */
    deleteDraftById: (id: string) => Promise<void>;
    /** Search drafts */
    search: (query: string) => Promise<void>;
    /** Clear search and show all */
    clearSearch: () => Promise<void>;
    /** Current search query */
    searchQuery: string;
    /** Whether we're showing search results */
    isSearching: boolean;
    /** Sort drafts */
    setSortBy: (sortBy: DraftSortBy) => void;
    /** Current sort field */
    sortBy: DraftSortBy;
    /** Sort order */
    sortOrder: DraftSortOrder;
    /** Toggle sort order */
    toggleSortOrder: () => void;
}

/**
 * Sort drafts by field and order
 */
function sortDrafts(
    drafts: DraftRecord[],
    sortBy: DraftSortBy,
    sortOrder: DraftSortOrder
): DraftRecord[] {
    return [...drafts].sort((a, b) => {
        const aValue = a[sortBy];
        const bValue = b[sortBy];
        const diff = aValue - bValue;
        return sortOrder === 'desc' ? -diff : diff;
    });
}

/**
 * Hook to manage drafts
 */
export function useDrafts(): UseDraftsReturn {
    const [drafts, setDrafts] = useState<DraftRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [sortBy, setSortByState] = useState<DraftSortBy>('updatedAt');
    const [sortOrder, setSortOrder] = useState<DraftSortOrder>('desc');

    /**
     * Load all drafts from database
     */
    const loadDrafts = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const allDrafts = await getAllDrafts();
            const sorted = sortDrafts(allDrafts, sortBy, sortOrder);
            setDrafts(sorted);
        } catch (err) {
            console.error('[useDrafts] Failed to load drafts:', err);
            setError('Failed to load drafts');
        } finally {
            setIsLoading(false);
        }
    }, [sortBy, sortOrder]);

    /**
     * Refresh drafts
     */
    const refresh = useCallback(async () => {
        if (isSearching && searchQuery) {
            await search(searchQuery);
        } else {
            await loadDrafts();
        }
    }, [loadDrafts, isSearching, searchQuery]);

    /**
     * Delete a draft
     */
    const deleteDraftById = useCallback(async (id: string) => {
        try {
            await deleteDraft(id);
            setDrafts(prev => prev.filter(d => d.id !== id));
        } catch (err) {
            console.error('[useDrafts] Failed to delete draft:', err);
            throw new Error('Failed to delete draft');
        }
    }, []);

    /**
     * Search drafts
     */
    const search = useCallback(async (query: string) => {
        try {
            setIsLoading(true);
            setSearchQuery(query);
            setIsSearching(true);

            if (!query.trim()) {
                await loadDrafts();
                setIsSearching(false);
                return;
            }

            const results = await searchDrafts(query);
            const sorted = sortDrafts(results, sortBy, sortOrder);
            setDrafts(sorted);
        } catch (err) {
            console.error('[useDrafts] Search failed:', err);
            setError('Search failed');
        } finally {
            setIsLoading(false);
        }
    }, [sortBy, sortOrder, loadDrafts]);

    /**
     * Clear search
     */
    const clearSearch = useCallback(async () => {
        setSearchQuery('');
        setIsSearching(false);
        await loadDrafts();
    }, [loadDrafts]);

    /**
     * Set sort field
     */
    const setSortBy = useCallback((newSortBy: DraftSortBy) => {
        setSortByState(newSortBy);
    }, []);

    /**
     * Toggle sort order
     */
    const toggleSortOrder = useCallback(() => {
        setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
    }, []);

    // Load drafts on mount and when sort changes
    useEffect(() => {
        loadDrafts();
    }, [loadDrafts]);

    // Re-sort when sort options change
    useEffect(() => {
        setDrafts(prev => sortDrafts(prev, sortBy, sortOrder));
    }, [sortBy, sortOrder]);

    return {
        drafts,
        isLoading,
        error,
        refresh,
        deleteDraftById,
        search,
        clearSearch,
        searchQuery,
        isSearching,
        setSortBy,
        sortBy,
        sortOrder,
        toggleSortOrder,
    };
}

export default useDrafts;
