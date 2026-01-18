/**
 * Database Types
 * Based on PRD Section 7 and Development Package Section 3.3
 */

/**
 * Sync status for drafts
 */
export type SyncStatus = 'local' | 'queued' | 'syncing' | 'synced' | 'failed';

/**
 * Share method tracking
 */
export type ShareMethod = 'whatsapp_text' | 'whatsapp_pdf' | 'email' | 'clipboard';

/**
 * Draft record in SQLite database
 */
export interface DraftRecord {
    /** Unique identifier (UUID) */
    id: string;
    /** Creation timestamp (Unix ms) */
    createdAt: number;
    /** Last update timestamp (Unix ms) */
    updatedAt: number;
    /** Path to audio file */
    audioPath: string | null;
    /** Audio duration in milliseconds */
    audioDuration: number | null;
    /** Transcribed text from STT */
    transcript: string | null;
    /** STT confidence score */
    transcriptConfidence: number | null;
    /** Parsed invoice data as JSON string */
    invoiceData: string | null;
    /** Overall parse confidence */
    parseConfidence: number | null;
    /** Current sync status */
    syncStatus: SyncStatus;
    /** Timestamp when shared */
    sharedAt: number | null;
    /** Method used for sharing */
    shareMethod: ShareMethod | null;
}

/**
 * Settings key-value pair
 */
export interface SettingRecord {
    /** Setting key */
    key: string;
    /** Setting value (JSON string for complex values) */
    value: string;
}

/**
 * App settings structure
 */
export interface AppSettings {
    /** Default currency code */
    defaultCurrency: string;
    /** Default tax rate percentage */
    defaultTaxRate: number;
    /** Audio auto-delete days (0 = never) */
    audioRetentionDays: number;
    /** User's business name */
    businessName: string;
    /** User's name */
    userName: string;
    /** User's phone number */
    phoneNumber: string;
    /** Whether onboarding is complete */
    onboardingComplete: boolean;
    /** Invoice number prefix */
    invoicePrefix: string;
    /** Last invoice sequence number */
    lastInvoiceNumber: number;
}

/**
 * Default app settings
 */
export const DEFAULT_SETTINGS: AppSettings = {
    defaultCurrency: 'INR',
    defaultTaxRate: 0,
    audioRetentionDays: 7,
    businessName: '',
    userName: '',
    phoneNumber: '',
    onboardingComplete: false,
    invoicePrefix: 'QQ',
    lastInvoiceNumber: 0,
};

/**
 * Queue item for offline processing
 */
export interface QueueItem {
    /** Queue item ID */
    id: string;
    /** Draft ID to process */
    draftId: string;
    /** Type of processing needed */
    type: 'stt' | 'parse' | 'both';
    /** Number of retry attempts */
    retryCount: number;
    /** Last error message */
    lastError: string | null;
    /** Created timestamp */
    createdAt: number;
    /** Status */
    status: 'pending' | 'processing' | 'completed' | 'failed';
}

/**
 * Database schema version for migrations
 */
export const SCHEMA_VERSION = 1;
