import { Database } from 'better-sqlite3-multiple-ciphers';

export function initializeSchema(db: Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      uuid TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      display_name TEXT,
      key_hash TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS api_tokens (
      key TEXT PRIMARY KEY,
      owner_key TEXT NOT NULL,
      owner_type TEXT NOT NULL,
      lobster_key_id TEXT,
      expires_at TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS lobster_keys (
      id TEXT PRIMARY KEY,
      user_uuid TEXT NOT NULL,
      name TEXT NOT NULL,
      api_key TEXT NOT NULL, -- ShellCrypted key for recovery
      api_key_hash TEXT UNIQUE, -- Hashed key for server-side auth
      permissions TEXT NOT NULL,
      expiration_type TEXT NOT NULL,
      expiration_date TEXT,
      rate_limit INTEGER,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      last_used TEXT,
      FOREIGN KEY(user_uuid) REFERENCES users(uuid) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      user_uuid TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      starred INTEGER DEFAULT 0,
      pinned INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(user_uuid) REFERENCES users(uuid) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS pearl_photos (
      id TEXT PRIMARY KEY,
      pearl_id TEXT NOT NULL,
      user_uuid TEXT NOT NULL,
      filename TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      data BLOB NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(pearl_id) REFERENCES notes(id) ON DELETE CASCADE,
      FOREIGN KEY(user_uuid) REFERENCES users(uuid) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS import_sessions (
      id TEXT PRIMARY KEY,
      user_uuid TEXT NOT NULL,
      key_id TEXT NOT NULL,
      started_at TEXT NOT NULL,
      closed_at TEXT,
      error_count INTEGER DEFAULT 0,
      errors_json TEXT DEFAULT '[]',
      FOREIGN KEY(user_uuid) REFERENCES users(uuid) ON DELETE CASCADE,
      FOREIGN KEY(key_id) REFERENCES lobster_keys(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp  TEXT NOT NULL,
      event_type TEXT NOT NULL,
      actor      TEXT,
      actor_type TEXT,
      resource   TEXT,
      action     TEXT NOT NULL,
      outcome    TEXT NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      details    TEXT
    );
  `);
}
