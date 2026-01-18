/**
 * Audio Playback Service
 * Handles audio playback for recorded files using expo-av
 */

import { Audio, AVPlaybackStatus } from 'expo-av';
import type { PlaybackStatus } from '../types/audio';

/**
 * Audio Playback Service Class
 * Manages audio playback lifecycle using expo-av
 */
class AudioPlayerService {
    private sound: Audio.Sound | null = null;
    private onStatusUpdate: ((status: PlaybackStatus) => void) | null = null;
    private currentUri: string = '';

    /**
     * Load an audio file for playback
     */
    async loadAudio(uri: string): Promise<void> {
        try {
            // Unload any existing sound
            await this.unload();

            // Set audio mode for playback
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                playsInSilentModeIOS: true,
            });

            // Create and load the sound
            const { sound } = await Audio.Sound.createAsync(
                { uri },
                { shouldPlay: false },
                this.handlePlaybackStatusUpdate.bind(this)
            );

            this.sound = sound;
            this.currentUri = uri;
        } catch (error) {
            console.error('Error loading audio:', error);
            throw error;
        }
    }

    /**
     * Handle playback status updates from expo-av
     */
    private handlePlaybackStatusUpdate(status: AVPlaybackStatus): void {
        if (!this.onStatusUpdate) return;

        if (status.isLoaded) {
            this.onStatusUpdate({
                isPlaying: status.isPlaying,
                isLoaded: true,
                positionMs: status.positionMillis,
                durationMs: status.durationMillis || 0,
                didJustFinish: status.didJustFinish,
            });
        } else {
            this.onStatusUpdate({
                isPlaying: false,
                isLoaded: false,
                positionMs: 0,
                durationMs: 0,
            });
        }
    }

    /**
     * Set status update callback
     */
    setOnStatusUpdate(callback: (status: PlaybackStatus) => void): void {
        this.onStatusUpdate = callback;
    }

    /**
     * Start or resume playback
     */
    async play(): Promise<void> {
        if (!this.sound) {
            throw new Error('No audio loaded');
        }

        try {
            await this.sound.playAsync();
        } catch (error) {
            console.error('Error playing audio:', error);
            throw error;
        }
    }

    /**
     * Pause playback
     */
    async pause(): Promise<void> {
        if (!this.sound) {
            throw new Error('No audio loaded');
        }

        try {
            await this.sound.pauseAsync();
        } catch (error) {
            console.error('Error pausing audio:', error);
            throw error;
        }
    }

    /**
     * Stop playback and reset position
     */
    async stop(): Promise<void> {
        if (!this.sound) {
            return;
        }

        try {
            await this.sound.stopAsync();
            await this.sound.setPositionAsync(0);
        } catch (error) {
            console.error('Error stopping audio:', error);
            throw error;
        }
    }

    /**
     * Seek to a specific position
     */
    async seekTo(positionMs: number): Promise<void> {
        if (!this.sound) {
            throw new Error('No audio loaded');
        }

        try {
            await this.sound.setPositionAsync(positionMs);
        } catch (error) {
            console.error('Error seeking audio:', error);
            throw error;
        }
    }

    /**
     * Get current playback status
     */
    async getStatus(): Promise<PlaybackStatus> {
        if (!this.sound) {
            return {
                isPlaying: false,
                isLoaded: false,
                positionMs: 0,
                durationMs: 0,
            };
        }

        try {
            const status = await this.sound.getStatusAsync();
            if (status.isLoaded) {
                return {
                    isPlaying: status.isPlaying,
                    isLoaded: true,
                    positionMs: status.positionMillis,
                    durationMs: status.durationMillis || 0,
                    didJustFinish: status.didJustFinish,
                };
            }
            return {
                isPlaying: false,
                isLoaded: false,
                positionMs: 0,
                durationMs: 0,
            };
        } catch (error) {
            console.error('Error getting playback status:', error);
            return {
                isPlaying: false,
                isLoaded: false,
                positionMs: 0,
                durationMs: 0,
            };
        }
    }

    /**
     * Unload the current audio
     */
    async unload(): Promise<void> {
        if (!this.sound) {
            return;
        }

        try {
            await this.sound.unloadAsync();
            this.sound = null;
            this.currentUri = '';
        } catch (error) {
            console.error('Error unloading audio:', error);
            this.sound = null;
        }
    }

    /**
     * Check if audio is loaded
     */
    isLoaded(): boolean {
        return this.sound !== null;
    }
}

// Export singleton instance
export const audioPlayerService = new AudioPlayerService();
