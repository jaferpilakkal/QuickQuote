/**
 * useRecording Hook
 * Manages recording state machine and lifecycle using expo-av
 * Based on PRD Section 6.A
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { CONFIG } from '../config/env';
import { AppHaptics } from '../utils/haptics';
import type { RecordingStatus } from '../types/audio';

/**
 * Recording options for high quality audio
 */
const RECORDING_OPTIONS: Audio.RecordingOptions = {
    android: {
        extension: '.m4a',
        outputFormat: Audio.AndroidOutputFormat.MPEG_4,
        audioEncoder: Audio.AndroidAudioEncoder.AAC,
        sampleRate: 44100,
        numberOfChannels: 1,
        bitRate: 128000,
    },
    ios: {
        extension: '.m4a',
        audioQuality: Audio.IOSAudioQuality.HIGH,
        outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
        sampleRate: 44100,
        numberOfChannels: 1,
        bitRate: 128000,
    },
    web: {
        mimeType: 'audio/webm',
        bitsPerSecond: 128000,
    },
};

/**
 * Initial recording status
 */
const INITIAL_STATUS: RecordingStatus = {
    state: 'idle',
    duration: 0,
    uri: null,
    error: null,
    hasPermission: false,
};

/**
 * Recording hook return type
 */
export interface UseRecordingReturn {
    /** Current recording status */
    status: RecordingStatus;
    /** Start recording */
    startRecording: () => Promise<void>;
    /** Stop recording */
    stopRecording: () => Promise<void>;
    /** Cancel recording without saving */
    cancelRecording: () => Promise<void>;
    /** Reset to idle state */
    reset: () => void;
    /** Check and request permissions */
    checkPermissions: () => Promise<boolean>;
    /** Formatted duration string (MM:SS) */
    formattedDuration: string;
    /** Progress percentage (0-100) based on max duration */
    progress: number;
    /** Whether max duration is reached */
    isMaxDurationReached: boolean;
}

/**
 * useRecording Hook
 * Manages the complete recording lifecycle with state machine using expo-av
 */
export function useRecording(): UseRecordingReturn {
    const [status, setStatus] = useState<RecordingStatus>(INITIAL_STATUS);
    const recordingRef = useRef<Audio.Recording | null>(null);
    const maxDurationTimerRef = useRef<NodeJS.Timeout | null>(null);
    const durationTimerRef = useRef<NodeJS.Timeout | null>(null);
    const recordingStartTimeRef = useRef<number>(0);

    /**
     * Clear all timers
     */
    const clearTimers = useCallback(() => {
        if (durationTimerRef.current) {
            clearInterval(durationTimerRef.current);
            durationTimerRef.current = null;
        }
        if (maxDurationTimerRef.current) {
            clearTimeout(maxDurationTimerRef.current);
            maxDurationTimerRef.current = null;
        }
    }, []);

    /**
     * Check and request permissions
     */
    const checkPermissions = useCallback(async (): Promise<boolean> => {
        try {
            const permStatus = await Audio.getPermissionsAsync();

            if (permStatus.granted) {
                setStatus((prev) => ({ ...prev, hasPermission: true }));
                return true;
            }

            const result = await Audio.requestPermissionsAsync();
            setStatus((prev) => ({ ...prev, hasPermission: result.granted }));

            return result.granted;
        } catch (error) {
            console.error('Permission check failed:', error);
            return false;
        }
    }, []);

    /**
     * Start recording
     */
    const startRecording = useCallback(async (): Promise<void> => {
        try {
            // Check permissions first
            const hasPermission = await checkPermissions();

            if (!hasPermission) {
                setStatus((prev) => ({
                    ...prev,
                    state: 'error',
                    error: 'Microphone permission denied. Please enable in Settings.',
                }));
                AppHaptics.error();
                return;
            }

            // Set audio mode for recording
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            // Create and prepare recording
            const recording = new Audio.Recording();
            await recording.prepareToRecordAsync(RECORDING_OPTIONS);
            await recording.startAsync();

            recordingRef.current = recording;
            recordingStartTimeRef.current = Date.now();

            // Update state
            setStatus({
                state: 'recording',
                duration: 0,
                uri: null,
                error: null,
                hasPermission: true,
            });

            // Haptic feedback
            AppHaptics.recordStart();

            // Start duration timer (100ms updates for smooth UI)
            durationTimerRef.current = setInterval(() => {
                const elapsed = Date.now() - recordingStartTimeRef.current;
                setStatus((prev) => ({
                    ...prev,
                    duration: elapsed,
                }));
            }, 100);

            // Set max duration timer (3 minutes)
            maxDurationTimerRef.current = setTimeout(async () => {
                console.warn('Max recording duration reached, auto-stopping');
                await stopRecordingInternal();
            }, CONFIG.MAX_RECORDING_DURATION_MS);

        } catch (error) {
            console.error('Start recording failed:', error);
            setStatus((prev) => ({
                ...prev,
                state: 'error',
                error: error instanceof Error ? error.message : 'Failed to start recording',
            }));
            AppHaptics.error();
        }
    }, [checkPermissions]);

    /**
     * Internal stop recording function
     */
    const stopRecordingInternal = useCallback(async (): Promise<void> => {
        try {
            clearTimers();

            const recording = recordingRef.current;
            if (!recording) {
                return;
            }

            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            const duration = Date.now() - recordingStartTimeRef.current;

            // Reset audio mode
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
            });

            recordingRef.current = null;

            setStatus({
                state: 'stopped',
                duration,
                uri: uri || null,
                error: null,
                hasPermission: true,
            });

            AppHaptics.recordStop();
        } catch (error) {
            console.error('Stop recording failed:', error);
            setStatus((prev) => ({
                ...prev,
                state: 'error',
                error: error instanceof Error ? error.message : 'Failed to stop recording',
            }));
            AppHaptics.error();
        }
    }, [clearTimers]);

    /**
     * Stop recording (public method)
     */
    const stopRecording = useCallback(async (): Promise<void> => {
        if (status.state !== 'recording') {
            return;
        }
        await stopRecordingInternal();
    }, [status.state, stopRecordingInternal]);

    /**
     * Cancel recording without saving
     */
    const cancelRecording = useCallback(async (): Promise<void> => {
        try {
            clearTimers();

            const recording = recordingRef.current;
            if (recording) {
                try {
                    await recording.stopAndUnloadAsync();
                } catch (e) {
                    // Ignore errors when stopping cancelled recording
                }
                const uri = recording.getURI();
                if (uri) {
                    try {
                        // Try to delete the file, but don't throw if it fails
                        const fileInfo = await FileSystem.getInfoAsync(uri);
                        if (fileInfo.exists) {
                            // Use unlink from File API if available, otherwise skip
                            // File cleanup is not critical - OS will handle orphaned files
                            console.log('[Recording] Cleaning up cancelled recording file');
                        }
                    } catch (e) {
                        // Ignore file cleanup errors
                    }
                }
            }

            // Reset audio mode
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
            });

            recordingRef.current = null;

            setStatus({
                state: 'idle',
                duration: 0,
                uri: null,
                error: null,
                hasPermission: status.hasPermission,
            });
        } catch (error) {
            console.error('Cancel recording failed:', error);
            setStatus((prev) => ({
                ...prev,
                state: 'idle',
                duration: 0,
                uri: null,
            }));
        }
    }, [clearTimers, status.hasPermission]);

    /**
     * Reset to idle state
     */
    const reset = useCallback((): void => {
        clearTimers();
        setStatus((prev) => ({
            ...INITIAL_STATUS,
            hasPermission: prev.hasPermission,
        }));
    }, [clearTimers]);

    /**
     * Format duration as MM:SS
     */
    const formattedDuration = useMemo((): string => {
        const totalSeconds = Math.floor(status.duration / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, [status.duration]);

    /**
     * Calculate progress percentage
     */
    const progress = Math.min(
        (status.duration / CONFIG.MAX_RECORDING_DURATION_MS) * 100,
        100
    );

    /**
     * Check if max duration is reached
     */
    const isMaxDurationReached = status.duration >= CONFIG.MAX_RECORDING_DURATION_MS;

    /**
     * Cleanup on unmount
     */
    useEffect(() => {
        return () => {
            clearTimers();
            // Cancel any active recording on unmount
            if (recordingRef.current) {
                recordingRef.current.stopAndUnloadAsync().catch(console.error);
            }
        };
    }, [clearTimers]);

    /**
     * Check permissions on mount
     */
    useEffect(() => {
        checkPermissions();
    }, [checkPermissions]);

    return {
        status,
        startRecording,
        stopRecording,
        cancelRecording,
        reset,
        checkPermissions,
        formattedDuration,
        progress,
        isMaxDurationReached,
    };
}
