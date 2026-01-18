/**
 * useNetworkStatus Hook
 * Monitors network connectivity status using expo-network
 * Part of Phase 5: Offline & Sync
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import * as Network from 'expo-network';

/**
 * Network type enum
 */
export type NetworkType = 'NONE' | 'UNKNOWN' | 'CELLULAR' | 'WIFI' | 'BLUETOOTH' | 'ETHERNET' | 'WIMAX' | 'VPN' | 'OTHER';

/**
 * Network status interface
 */
export interface NetworkStatus {
    /** Whether the device has active network connection */
    isConnected: boolean;
    /** Whether internet is actually reachable (can be null while checking) */
    isInternetReachable: boolean | null;
    /** Type of network connection */
    type: NetworkType | null;
}

/**
 * Hook return type
 */
export interface UseNetworkStatusReturn {
    /** Current network status */
    status: NetworkStatus;
    /** Convenience boolean - true when online and internet reachable */
    isOnline: boolean;
    /** Convenience boolean - true when offline or internet not reachable */
    isOffline: boolean;
    /** Manually refresh network status */
    refresh: () => Promise<void>;
    /** Whether the initial check has completed */
    isReady: boolean;
}

/**
 * Default network status (assume online until we know otherwise)
 */
const DEFAULT_STATUS: NetworkStatus = {
    isConnected: true,
    isInternetReachable: null,
    type: null,
};

/**
 * Hook to monitor network connectivity
 * 
 * @example
 * ```tsx
 * const { isOnline, isOffline, status } = useNetworkStatus();
 * 
 * if (isOffline) {
 *   return <OfflineIndicator />;
 * }
 * ```
 */
export function useNetworkStatus(): UseNetworkStatusReturn {
    const [status, setStatus] = useState<NetworkStatus>(DEFAULT_STATUS);
    const [isReady, setIsReady] = useState(false);
    const mountedRef = useRef(true);

    /**
     * Fetch current network state
     */
    const fetchNetworkState = useCallback(async (): Promise<void> => {
        try {
            const networkState = await Network.getNetworkStateAsync();

            if (!mountedRef.current) return;

            setStatus({
                isConnected: networkState.isConnected ?? false,
                isInternetReachable: networkState.isInternetReachable ?? null,
                type: (networkState.type as NetworkType) ?? null,
            });
        } catch (error) {
            console.warn('[Network] Failed to get network state:', error);
            // On error, assume we're online to not block the user
            if (mountedRef.current) {
                setStatus({
                    isConnected: true,
                    isInternetReachable: null,
                    type: null,
                });
            }
        }
    }, []);

    /**
     * Public refresh function
     */
    const refresh = useCallback(async (): Promise<void> => {
        await fetchNetworkState();
    }, [fetchNetworkState]);

    /**
     * Setup network state listener
     */
    useEffect(() => {
        mountedRef.current = true;

        // Initial fetch
        fetchNetworkState().then(() => {
            if (mountedRef.current) {
                setIsReady(true);
            }
        });

        // Subscribe to network state changes
        const subscription = Network.addNetworkStateListener((state) => {
            if (!mountedRef.current) return;

            console.log('[Network] State changed:', state);

            setStatus({
                isConnected: state.isConnected ?? false,
                isInternetReachable: state.isInternetReachable ?? null,
                type: (state.type as NetworkType) ?? null,
            });
        });

        // Cleanup
        return () => {
            mountedRef.current = false;
            subscription.remove();
        };
    }, [fetchNetworkState]);

    /**
     * Compute convenience booleans
     * We consider "online" only if both connected AND internet is reachable
     * If isInternetReachable is null (unknown), we use isConnected
     */
    const isOnline = status.isConnected && (status.isInternetReachable !== false);
    const isOffline = !isOnline;

    return {
        status,
        isOnline,
        isOffline,
        refresh,
        isReady,
    };
}

export default useNetworkStatus;
