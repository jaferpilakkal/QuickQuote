/**
 * Database Service
 * SQLite database initialization and operations
 */

import * as SQLite from 'expo-sqlite';
import {
    CREATE_TABLES_SQL,
    INSERT_DEFAULT_SETTINGS_SQL,
    DRAFTS_QUERIES,
    SETTINGS_QUERIES,
    QUEUE_QUERIES,
} from './schema';
import type { DraftRecord, AppSettings, QueueItem } from '../types/database';

/**
 * Database file name
 */
const DATABASE_NAME = 'quickquote.db';

/**
 * Database row types (snake_case from SQLite)
 */
interface DraftRow {
    id: string;
    created_at: number;
    updated_at: number;
    audio_path: string | null;
    audio_duration: number | null;
    transcript: string | null;
    transcript_confidence: number | null;
    invoice_data: string | null;
    parse_confidence: number | null;
    sync_status: string;
    shared_at: number | null;
    share_method: string | null;
}

interface QueueRow {
    id: string;
    draft_id: string;
    type: string;
    retry_count: number;
    last_error: string | null;
    created_at: number;
    status: string;
}

interface SettingRow {
    key: string;
    value: string;
}

interface CountRow {
    count: number;
}

/**
 * Database instance (singleton)
 */
let db: SQLite.SQLiteDatabase | null = null;

/**
 * Initialize the database
 * Creates tables if they don't exist
 */
export async function initDatabase(): Promise<void> {
    if (db) {
        return; // Already initialized
    }

    db = await SQLite.openDatabaseAsync(DATABASE_NAME);

    // Create tables
    await db.execAsync(CREATE_TABLES_SQL);

    // Insert default settings
    await db.execAsync(INSERT_DEFAULT_SETTINGS_SQL);

    console.warn('Database initialized successfully');
}

/**
 * Get database instance
 * Throws if not initialized
 */
function getDb(): SQLite.SQLiteDatabase {
    if (!db) {
        throw new Error('Database not initialized. Call initDatabase() first.');
    }
    return db;
}

/**
 * Close database connection
 */
export async function closeDatabase(): Promise<void> {
    if (db) {
        await db.closeAsync();
        db = null;
    }
}

// ============================================================
// DRAFTS OPERATIONS
// ============================================================

/**
 * Create a new draft
 */
export async function createDraft(
    id: string,
    audioPath: string | null,
    audioDuration: number | null
): Promise<void> {
    const now = Date.now();
    await getDb().runAsync(DRAFTS_QUERIES.INSERT, [id, now, now, audioPath, audioDuration]);
}

/**
 * Get all drafts
 */
export async function getAllDrafts(): Promise<DraftRecord[]> {
    const rows = await getDb().getAllAsync<DraftRow>(DRAFTS_QUERIES.GET_ALL);
    return rows.map(mapDraftRow);
}

/**
 * Get draft by ID
 */
export async function getDraftById(id: string): Promise<DraftRecord | null> {
    const row = await getDb().getFirstAsync<DraftRow>(DRAFTS_QUERIES.GET_BY_ID, [id]);
    return row ? mapDraftRow(row) : null;
}

/**
 * Update draft with transcript
 */
export async function updateDraftTranscript(
    id: string,
    transcript: string,
    confidence: number
): Promise<void> {
    const now = Date.now();
    await getDb().runAsync(DRAFTS_QUERIES.UPDATE_TRANSCRIPT, [transcript, confidence, now, id]);
}

/**
 * Update draft with invoice data
 */
export async function updateDraftInvoice(
    id: string,
    invoiceData: string,
    parseConfidence: number
): Promise<void> {
    const now = Date.now();
    await getDb().runAsync(DRAFTS_QUERIES.UPDATE_INVOICE, [invoiceData, parseConfidence, now, id]);
}

/**
 * Mark draft as shared
 */
export async function markDraftShared(id: string, shareMethod: string): Promise<void> {
    const now = Date.now();
    await getDb().runAsync(DRAFTS_QUERIES.UPDATE_SHARED, [now, shareMethod, now, id]);
}

/**
 * Delete draft
 */
export async function deleteDraft(id: string): Promise<void> {
    await getDb().runAsync(DRAFTS_QUERIES.DELETE, [id]);
}

/**
 * Delete all drafts
 */
export async function deleteAllDrafts(): Promise<void> {
    await getDb().runAsync(DRAFTS_QUERIES.DELETE_ALL);
}

/**
 * Get drafts count
 */
export async function getDraftsCount(): Promise<number> {
    const result = await getDb().getFirstAsync<CountRow>(DRAFTS_QUERIES.COUNT);
    return result?.count ?? 0;
}

/**
 * Search drafts
 */
export async function searchDrafts(query: string): Promise<DraftRecord[]> {
    const searchTerm = `%${query}%`;
    const rows = await getDb().getAllAsync<DraftRow>(DRAFTS_QUERIES.SEARCH, [
        searchTerm,
        searchTerm,
    ]);
    return rows.map(mapDraftRow);
}

/**
 * Delete old audio files
 */
export async function deleteOldAudio(beforeTimestamp: number): Promise<void> {
    await getDb().runAsync(DRAFTS_QUERIES.DELETE_OLD_AUDIO, [beforeTimestamp]);
}

// ============================================================
// SETTINGS OPERATIONS
// ============================================================

/**
 * Get a setting value
 */
export async function getSetting<T>(key: string): Promise<T | null> {
    const row = await getDb().getFirstAsync<SettingRow>(SETTINGS_QUERIES.GET, [key]);
    if (!row) return null;
    try {
        return JSON.parse(row.value) as T;
    } catch {
        return row.value as unknown as T;
    }
}

/**
 * Set a setting value
 */
export async function setSetting<T>(key: string, value: T): Promise<void> {
    const serialized = JSON.stringify(value);
    await getDb().runAsync(SETTINGS_QUERIES.SET, [key, serialized]);
}

/**
 * Get all settings as AppSettings object
 */
export async function getAllSettings(): Promise<Partial<AppSettings>> {
    const rows = await getDb().getAllAsync<SettingRow>(SETTINGS_QUERIES.GET_ALL);
    const settings: Record<string, unknown> = {};

    for (const row of rows) {
        try {
            settings[camelCase(row.key)] = JSON.parse(row.value);
        } catch {
            settings[camelCase(row.key)] = row.value;
        }
    }

    return settings as Partial<AppSettings>;
}

// ============================================================
// QUEUE OPERATIONS
// ============================================================

/**
 * Add item to processing queue
 */
export async function addToQueue(
    id: string,
    draftId: string,
    type: 'stt' | 'parse' | 'both'
): Promise<void> {
    const now = Date.now();
    await getDb().runAsync(QUEUE_QUERIES.INSERT, [id, draftId, type, now]);
}

/**
 * Get pending queue items
 */
export async function getPendingQueueItems(): Promise<QueueItem[]> {
    const rows = await getDb().getAllAsync<QueueRow>(QUEUE_QUERIES.GET_PENDING);
    return rows.map(mapQueueRow);
}

/**
 * Update queue item status
 */
export async function updateQueueItemStatus(
    id: string,
    status: string,
    error: string | null,
    retryCount: number
): Promise<void> {
    await getDb().runAsync(QUEUE_QUERIES.UPDATE_STATUS, [status, error, retryCount, id]);
}

/**
 * Delete completed queue items
 */
export async function deleteCompletedQueueItems(): Promise<void> {
    await getDb().runAsync(QUEUE_QUERIES.DELETE_COMPLETED);
}

/**
 * Delete ALL queue items (user reset)
 */
export async function deleteAllQueueItems(): Promise<void> {
    await getDb().runAsync(QUEUE_QUERIES.DELETE_ALL);
}

// ============================================================
// HELPERS
// ============================================================

/**
 * Map database row to DraftRecord (handle snake_case to camelCase)
 */
function mapDraftRow(row: DraftRow): DraftRecord {
    return {
        id: row.id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        audioPath: row.audio_path,
        audioDuration: row.audio_duration,
        transcript: row.transcript,
        transcriptConfidence: row.transcript_confidence,
        invoiceData: row.invoice_data,
        parseConfidence: row.parse_confidence,
        syncStatus: row.sync_status as DraftRecord['syncStatus'],
        sharedAt: row.shared_at,
        shareMethod: row.share_method as DraftRecord['shareMethod'] | null,
    };
}

/**
 * Map queue row to QueueItem
 */
function mapQueueRow(row: QueueRow): QueueItem {
    return {
        id: row.id,
        draftId: row.draft_id,
        type: row.type as QueueItem['type'],
        retryCount: row.retry_count,
        lastError: row.last_error,
        createdAt: row.created_at,
        status: row.status as QueueItem['status'],
    };
}

/**
 * Convert snake_case to camelCase
 */
function camelCase(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}
