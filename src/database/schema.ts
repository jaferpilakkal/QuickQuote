/**
 * Database Schema
 * SQLite table definitions for QuickQuote
 * Based on PRD Section 7
 */

/**
 * Current schema version for migrations
 */
export const SCHEMA_VERSION = 1;

/**
 * SQL statements to create all tables
 */
export const CREATE_TABLES_SQL = `
  -- Drafts table: stores all invoice drafts
  CREATE TABLE IF NOT EXISTS drafts (
    id TEXT PRIMARY KEY,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    audio_path TEXT,
    audio_duration INTEGER,
    transcript TEXT,
    transcript_confidence REAL,
    invoice_data TEXT,
    parse_confidence REAL,
    sync_status TEXT DEFAULT 'local',
    shared_at INTEGER,
    share_method TEXT
  );

  -- Settings table: key-value store for app settings
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  -- Queue table: offline processing queue
  CREATE TABLE IF NOT EXISTS queue (
    id TEXT PRIMARY KEY,
    draft_id TEXT NOT NULL,
    type TEXT NOT NULL,
    retry_count INTEGER DEFAULT 0,
    last_error TEXT,
    created_at INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    FOREIGN KEY (draft_id) REFERENCES drafts(id) ON DELETE CASCADE
  );

  -- Indexes for performance
  CREATE INDEX IF NOT EXISTS idx_drafts_updated 
    ON drafts(updated_at DESC);
  
  CREATE INDEX IF NOT EXISTS idx_drafts_sync_status 
    ON drafts(sync_status);
  
  CREATE INDEX IF NOT EXISTS idx_queue_status 
    ON queue(status);
`;

/**
 * SQL to insert default settings
 */
export const INSERT_DEFAULT_SETTINGS_SQL = `
  INSERT OR IGNORE INTO settings (key, value) VALUES 
    ('schema_version', '${SCHEMA_VERSION}'),
    ('default_currency', '"INR"'),
    ('default_tax_rate', '0'),
    ('audio_retention_days', '7'),
    ('business_name', '""'),
    ('user_name', '""'),
    ('phone_number', '""'),
    ('onboarding_complete', 'false'),
    ('invoice_prefix', '"QQ"'),
    ('last_invoice_number', '0');
`;

/**
 * SQL queries for drafts
 */
export const DRAFTS_QUERIES = {
  /** Insert a new draft */
  INSERT: `
    INSERT INTO drafts (id, created_at, updated_at, audio_path, audio_duration, sync_status)
    VALUES (?, ?, ?, ?, ?, 'local')
  `,

  /** Update draft with transcript */
  UPDATE_TRANSCRIPT: `
    UPDATE drafts 
    SET transcript = ?, transcript_confidence = ?, updated_at = ?
    WHERE id = ?
  `,

  /** Update draft with invoice data */
  UPDATE_INVOICE: `
    UPDATE drafts 
    SET invoice_data = ?, parse_confidence = ?, sync_status = 'synced', updated_at = ?
    WHERE id = ?
  `,

  /** Update entire draft */
  UPDATE_FULL: `
    UPDATE drafts 
    SET audio_path = ?, audio_duration = ?, transcript = ?, transcript_confidence = ?,
        invoice_data = ?, parse_confidence = ?, sync_status = ?, updated_at = ?
    WHERE id = ?
  `,

  /** Mark draft as shared */
  UPDATE_SHARED: `
    UPDATE drafts 
    SET shared_at = ?, share_method = ?, updated_at = ?
    WHERE id = ?
  `,

  /** Get all drafts ordered by updated */
  GET_ALL: `
    SELECT * FROM drafts ORDER BY updated_at DESC
  `,

  /** Get single draft by ID */
  GET_BY_ID: `
    SELECT * FROM drafts WHERE id = ?
  `,

  /** Get drafts by sync status */
  GET_BY_SYNC_STATUS: `
    SELECT * FROM drafts WHERE sync_status = ? ORDER BY created_at ASC
  `,

  /** Delete draft by ID */
  DELETE: `
    DELETE FROM drafts WHERE id = ?
  `,

  /** Delete old audio files */
  DELETE_OLD_AUDIO: `
    UPDATE drafts 
    SET audio_path = NULL, audio_duration = NULL
    WHERE audio_path IS NOT NULL AND created_at < ?
  `,

  /** Delete all drafts */
  DELETE_ALL: `
    DELETE FROM drafts
  `,

  /** Count drafts */
  COUNT: `
    SELECT COUNT(*) as count FROM drafts
  `,

  /** Search drafts by content */
  SEARCH: `
    SELECT * FROM drafts 
    WHERE transcript LIKE ? OR invoice_data LIKE ?
    ORDER BY updated_at DESC
  `,
};

/**
 * SQL queries for settings
 */
export const SETTINGS_QUERIES = {
  /** Get setting value */
  GET: `
    SELECT value FROM settings WHERE key = ?
  `,

  /** Set setting value */
  SET: `
    INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)
  `,

  /** Get all settings */
  GET_ALL: `
    SELECT * FROM settings
  `,

  /** Delete setting */
  DELETE: `
    DELETE FROM settings WHERE key = ?
  `,
};

/**
 * SQL queries for queue
 */
export const QUEUE_QUERIES = {
  /** Add item to queue */
  INSERT: `
    INSERT INTO queue (id, draft_id, type, created_at, status)
    VALUES (?, ?, ?, ?, 'pending')
  `,

  /** Get pending items */
  GET_PENDING: `
    SELECT * FROM queue 
    WHERE status = 'pending' 
    ORDER BY created_at ASC
  `,

  /** Update queue item status */
  UPDATE_STATUS: `
    UPDATE queue 
    SET status = ?, last_error = ?, retry_count = ?
    WHERE id = ?
  `,

  /** Delete completed items */
  DELETE_COMPLETED: `
    DELETE FROM queue WHERE status = 'completed'
  `,

  /** Delete ALL queue items (for user reset) */
  DELETE_ALL: `
    DELETE FROM queue
  `,

  /** Get item by draft ID */
  GET_BY_DRAFT: `
    SELECT * FROM queue WHERE draft_id = ? AND status != 'completed'
  `,
};
