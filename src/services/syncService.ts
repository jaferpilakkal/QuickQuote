/**
 * Sync Service
 * Orchestrates offline/online synchronization
 * Automatically processes queue when network is restored
 * Part of Phase 5: Offline & Sync
 */

import * as Network from 'expo-network';
import { queueService, QueueProcessResult } from './queueService';

/**
 * Sync status enum
 */
export type SyncState = 'idle' | 'syncing' | 'completed' | 'error';

/**
 * Sync result
 */
export interface SyncResult {
    success: boolean;
    processResult?: QueueProcessResult;
    error?: string;
}

/**
 * Sync status
 */
export interface SyncStatus {
    state: SyncState;
    lastSyncAt: number | null;
    lastError: string | null;
    isAutoSyncEnabled: boolean;
}

/**
 * Sync event listener callback
 */
export type SyncEventListener = (status: SyncStatus) => void;

/**
 * Debounce delay for sync after network restore (ms)
 */
const SYNC_DEBOUNCE_MS = 2000;

/**
 * Minimum interval between syncs (ms)
 */
const MIN_SYNC_INTERVAL_MS = 30000;

/**
 * Sync Service singleton state
 */
let syncState: SyncState = 'idle';
let lastSyncAt: number | null = null;
let lastError: string | null = null;
let isAutoSyncEnabled = false;
let networkSubscription: { remove: () => void } | null = null;
let syncDebounceTimeout: ReturnType<typeof setTimeout> | null = null;
let listeners: Set<SyncEventListener> = new Set();

/**
 * Notify all listeners of status change
 */
function notifyListeners(): void {
    const status = syncService.getSyncStatus();
    listeners.forEach(listener => {
        try {
            listener(status);
        } catch (error) {
            console.warn('[Sync] Listener error:', error);
        }
    });
}

/**
 * Update sync state and notify listeners
 */
function updateState(newState: SyncState, error?: string): void {
    syncState = newState;
    if (error !== undefined) {
        lastError = error;
    }
    if (newState === 'completed' || newState === 'error') {
        lastSyncAt = Date.now();
    }
    notifyListeners();
}

/**
 * Sync Service
 */
export const syncService = {
    /**
     * Initialize the sync service
     * Call this once when the app starts
     */
    async initialize(): Promise<void> {
        console.log('[Sync] Initializing sync service');

        // Get initial network state
        const networkState = await Network.getNetworkStateAsync();
        const isOnline = networkState.isConnected && networkState.isInternetReachable !== false;

        if (isOnline) {
            // Process any pending items on startup
            this.syncNow().catch(err => {
                console.warn('[Sync] Initial sync failed:', err);
            });
        }

        notifyListeners();
    },

    /**
     * Start auto-sync (listen for network changes)
     */
    startAutoSync(): void {
        if (isAutoSyncEnabled) {
            console.log('[Sync] Auto-sync already enabled');
            return;
        }

        console.log('[Sync] Starting auto-sync');
        isAutoSyncEnabled = true;

        // Subscribe to network state changes
        networkSubscription = Network.addNetworkStateListener((state) => {
            this.onNetworkChange(
                state.isConnected ?? false,
                state.isInternetReachable ?? null
            );
        });

        notifyListeners();
    },

    /**
     * Stop auto-sync
     */
    stopAutoSync(): void {
        if (!isAutoSyncEnabled) {
            return;
        }

        console.log('[Sync] Stopping auto-sync');
        isAutoSyncEnabled = false;

        // Remove network listener
        if (networkSubscription) {
            networkSubscription.remove();
            networkSubscription = null;
        }

        // Clear any pending debounce
        if (syncDebounceTimeout) {
            clearTimeout(syncDebounceTimeout);
            syncDebounceTimeout = null;
        }

        notifyListeners();
    },

    /**
     * Handle network state change
     */
    onNetworkChange(isConnected: boolean, isInternetReachable: boolean | null): void {
        const isOnline = isConnected && isInternetReachable !== false;

        console.log(`[Sync] Network changed: connected=${isConnected}, reachable=${isInternetReachable}`);

        if (isOnline && isAutoSyncEnabled) {
            // Debounce sync to avoid rapid triggers
            if (syncDebounceTimeout) {
                clearTimeout(syncDebounceTimeout);
            }

            syncDebounceTimeout = setTimeout(() => {
                syncDebounceTimeout = null;
                this.syncNow().catch(err => {
                    console.warn('[Sync] Auto-sync failed:', err);
                });
            }, SYNC_DEBOUNCE_MS);
        }
    },

    /**
     * Trigger immediate sync
     * @returns Sync result
     */
    async syncNow(): Promise<SyncResult> {
        // Check if already syncing
        if (syncState === 'syncing') {
            console.log('[Sync] Sync already in progress');
            return { success: false, error: 'Sync already in progress' };
        }

        // Check minimum interval
        if (lastSyncAt && Date.now() - lastSyncAt < MIN_SYNC_INTERVAL_MS) {
            console.log('[Sync] Skipping - too soon since last sync');
            return { success: true };
        }

        // Check network
        const networkState = await Network.getNetworkStateAsync();
        if (!networkState.isConnected || networkState.isInternetReachable === false) {
            console.log('[Sync] Skipping - offline');
            return { success: false, error: 'Device is offline' };
        }

        try {
            updateState('syncing');
            console.log('[Sync] Starting sync...');

            // Process the queue
            const result = await queueService.processQueue();

            if (result.failed > 0) {
                updateState('error', `${result.failed} items failed to sync`);
            } else {
                updateState('completed');
            }

            console.log(`[Sync] Completed: ${result.processed}/${result.total} processed`);

            return {
                success: result.failed === 0,
                processResult: result,
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            updateState('error', errorMessage);
            console.error('[Sync] Failed:', error);

            return {
                success: false,
                error: errorMessage,
            };
        }
    },

    /**
     * Get current sync status
     */
    getSyncStatus(): SyncStatus {
        return {
            state: syncState,
            lastSyncAt,
            lastError,
            isAutoSyncEnabled,
        };
    },

    /**
     * Add a status change listener
     * @returns Unsubscribe function
     */
    addListener(listener: SyncEventListener): () => void {
        listeners.add(listener);
        return () => {
            listeners.delete(listener);
        };
    },

    /**
     * Reset sync state (for testing)
     */
    reset(): void {
        this.stopAutoSync();
        syncState = 'idle';
        lastSyncAt = null;
        lastError = null;
        listeners.clear();
    },
};

export default syncService;
