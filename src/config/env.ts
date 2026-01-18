/**
 * Environment Configuration
 * Manages API keys and environment-specific settings
 */

import Constants from 'expo-constants';

/**
 * Environment variables interface
 */
interface Environment {
    /** Google Speech-to-Text API key */
    GOOGLE_STT_API_KEY: string;
    /** Google Gemini API key */
    GEMINI_API_KEY: string;
    /** Sentry DSN for error tracking */
    SENTRY_DSN: string;
    /** Whether we're in development mode */
    IS_DEV: boolean;
    /** Whether analytics is enabled */
    ANALYTICS_ENABLED: boolean;
}

/**
 * Get environment variables from Expo config
 */
function getEnvVars(): Environment {
    const extra = Constants.expoConfig?.extra ?? {};

    return {
        GOOGLE_STT_API_KEY: extra.googleSTTKey ?? '',
        GEMINI_API_KEY: extra.geminiKey ?? '',
        SENTRY_DSN: extra.sentryDSN ?? '',
        IS_DEV: __DEV__,
        ANALYTICS_ENABLED: extra.analyticsEnabled ?? !__DEV__,
    };
}

/**
 * Current environment configuration
 */
export const ENV = getEnvVars();

/**
 * Validate that required environment variables are set
 * Call this on app startup
 */
export function validateEnv(): { valid: boolean; missing: string[] } {
    const missing: string[] = [];

    if (!ENV.GOOGLE_STT_API_KEY) {
        missing.push('GOOGLE_STT_API_KEY');
    }

    if (!ENV.GEMINI_API_KEY) {
        missing.push('GEMINI_API_KEY');
    }

    if (missing.length > 0 && !ENV.IS_DEV) {
        console.error('Missing required environment variables:', missing);
    } else if (missing.length > 0) {
        console.warn('Missing environment variables (dev mode):', missing);
    }

    return {
        valid: missing.length === 0,
        missing,
    };
}

/**
 * API endpoints
 */
export const API = {
    /** Google Speech-to-Text endpoint */
    STT: 'https://speech.googleapis.com/v1/speech:recognize',
    /** Google Gemini endpoint */
    GEMINI: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite-preview-02-05:generateContent',
} as const;

/**
 * App configuration constants
 */
export const CONFIG = {
    /** Maximum recording duration in milliseconds (3 minutes) */
    MAX_RECORDING_DURATION_MS: 3 * 60 * 1000,
    /** Debounce time for autosave in milliseconds */
    AUTOSAVE_DEBOUNCE_MS: 500,
    /** Number of API retries */
    MAX_RETRIES: 3,
    /** Initial retry delay in milliseconds */
    RETRY_INITIAL_DELAY_MS: 1000,
    /** Maximum retry delay in milliseconds */
    RETRY_MAX_DELAY_MS: 10000,
    /** Default audio retention in days */
    DEFAULT_AUDIO_RETENTION_DAYS: 7,
    /** Maximum PDF file size in bytes */
    MAX_PDF_SIZE_BYTES: 200 * 1024,
    /** Processing timeout in milliseconds */
    PROCESSING_TIMEOUT_MS: 30000,
} as const;
