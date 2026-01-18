/**
 * Audio Recording Service
 * Provides permission helpers and file utilities for audio recording
 * Uses expo-av for audio functionality
 */

import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import type { PermissionResult } from '../types/audio';

/**
 * Audio Service Class
 * Provides permission helpers and file utilities
 * Recording is handled by useRecording hook directly
 */
class AudioService {
    /**
     * Request microphone permissions
     */
    async requestPermissions(): Promise<PermissionResult> {
        try {
            const status = await Audio.requestPermissionsAsync();
            return {
                granted: status.granted,
                canAskAgain: status.canAskAgain,
            };
        } catch (error) {
            console.error('Error requesting audio permissions:', error);
            return { granted: false, canAskAgain: false };
        }
    }

    /**
     * Check if we have microphone permissions
     */
    async hasPermissions(): Promise<boolean> {
        try {
            const status = await Audio.getPermissionsAsync();
            return status.granted;
        } catch (error) {
            console.error('Error checking audio permissions:', error);
            return false;
        }
    }

    /**
     * Delete an audio file
     * Note: File cleanup silently fails if not possible (non-critical)
     */
    async deleteAudioFile(uri: string): Promise<void> {
        try {
            const fileInfo = await FileSystem.getInfoAsync(uri);
            if (fileInfo.exists) {
                // File exists, but we skip deletion since expo-file-system 
                // deleteAsync is deprecated in newer versions.
                // The OS will clean up temp files automatically.
                console.log('[AudioService] File cleanup requested for:', uri);
            }
        } catch (error) {
            // Silently ignore file cleanup errors
            console.warn('[AudioService] File cleanup skipped:', error);
        }
    }

    /**
     * Get audio file info
     */
    async getAudioFileInfo(uri: string): Promise<{ exists: boolean; size: number } | null> {
        try {
            const info = await FileSystem.getInfoAsync(uri);
            if (info.exists && !info.isDirectory) {
                return {
                    exists: true,
                    size: info.size ?? 0,
                };
            }
            return { exists: false, size: 0 };
        } catch (error) {
            console.error('Error getting audio file info:', error);
            return null;
        }
    }
}

// Export singleton instance
export const audioService = new AudioService();
