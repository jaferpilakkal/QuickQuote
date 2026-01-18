/**
 * Audio Recording Types
 * Based on PRD Section 6.A and Development Package Section 5.1
 */

/**
 * Recording state machine states
 */
export type RecordingState = 'idle' | 'recording' | 'paused' | 'stopped' | 'error';

/**
 * Current recording status
 */
export interface RecordingStatus {
    /** Current state of the recorder */
    state: RecordingState;
    /** Duration in milliseconds */
    duration: number;
    /** Path to the audio file (if saved) */
    uri: string | null;
    /** Error message if state is 'error' */
    error: string | null;
    /** Whether we have microphone permission */
    hasPermission: boolean;
}

/**
 * Audio recording configuration
 * PRD: AAC, 16kHz, mono
 */
export interface AudioConfig {
    /** Sample rate in Hz */
    sampleRate: number;
    /** Number of audio channels */
    numberOfChannels: number;
    /** Bit rate for encoding */
    bitRate: number;
    /** File extension */
    extension: string;
}

/**
 * Default audio configuration per PRD requirements
 */
export const DEFAULT_AUDIO_CONFIG: AudioConfig = {
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 32000,
    extension: '.m4a',
};

/**
 * Maximum recording duration in milliseconds
 * PRD: 3 minutes (user preference)
 */
export const MAX_RECORDING_DURATION_MS = 3 * 60 * 1000; // 3 minutes

/**
 * Recording metering data for waveform visualization
 */
export interface AudioMeteringData {
    /** Audio level (dB) */
    metering: number;
    /** Timestamp */
    timestamp: number;
}

/**
 * Audio playback status
 */
export interface PlaybackStatus {
    /** Whether audio is currently playing */
    isPlaying: boolean;
    /** Whether audio is loaded */
    isLoaded: boolean;
    /** Current position in milliseconds */
    positionMs: number;
    /** Total duration in milliseconds */
    durationMs: number;
    /** Whether playback just finished */
    didJustFinish?: boolean;
}

/**
 * Permission request result
 */
export interface PermissionResult {
    /** Whether permission was granted */
    granted: boolean;
    /** Whether we can ask again */
    canAskAgain: boolean;
}
