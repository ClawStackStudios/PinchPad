import { Database } from 'better-sqlite3-multiple-ciphers';

export function initializeSchema(db: Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      uuid       TEXT PRIMARY KEY,
      username   TEXT NOT NULL UNIQUE,
      key_hash   TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS api_tokens (
      key        TEXT PRIMARY KEY,
      owner_key  TEXT NOT NULL,
      owner_type TEXT NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT
    );

    CREATE TABLE IF NOT EXISTS pots (
      id         TEXT PRIMARY KEY,
      user_uuid  TEXT NOT NULL,
      name       TEXT NOT NULL,
      color      TEXT NOT NULL DEFAULT '#f59e0b',
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_uuid) REFERENCES users(uuid) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notes (
      id          TEXT PRIMARY KEY,
      user_uuid   TEXT NOT NULL,
      title       TEXT NOT NULL,
      content     TEXT NOT NULL,
      starred     INTEGER DEFAULT 0,
      pinned      INTEGER DEFAULT 0,
      pot_id      TEXT,
      created_at  TEXT NOT NULL,
      updated_at  TEXT NOT NULL,
      FOREIGN KEY(user_uuid) REFERENCES users(uuid) ON DELETE CASCADE,
      FOREIGN KEY(pot_id) REFERENCES pots(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS pearl_photos (
      id         TEXT PRIMARY KEY,
      pearl_id   TEXT NOT NULL,
      user_uuid  TEXT NOT NULL,
      filename   TEXT NOT NULL,
      mime_type  TEXT NOT NULL,
      data       BLOB NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(pearl_id) REFERENCES notes(id) ON DELETE CASCADE,
      FOREIGN KEY(user_uuid) REFERENCES users(uuid) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS agent_keys (
      id              TEXT PRIMARY KEY,
      user_uuid       TEXT NOT NULL,
      name            TEXT NOT NULL,
      description     TEXT,
      api_key         TEXT NOT NULL UNIQUE,
      permissions     TEXT NOT NULL,
      expiration_type TEXT NOT NULL,
      expiration_date TEXT,
      rate_limit      INTEGER,
      is_active       INTEGER DEFAULT 1,
      created_at      TEXT NOT NULL,
      last_used       TEXT,
      FOREIGN KEY(user_uuid) REFERENCES users(uuid) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS settings (
      key       TEXT PRIMARY KEY,
      user_uuid TEXT NOT NULL,
      value     TEXT NOT NULL
    );

    CREATE TRIGGER IF NOT EXISTS cascade_user_api_tokens
    AFTER DELETE ON users
    BEGIN
      DELETE FROM api_tokens WHERE owner_key = OLD.uuid AND owner_type = 'human';
    END;

    CREATE TRIGGER IF NOT EXISTS cascade_agent_api_tokens
    AFTER DELETE ON agent_keys
    BEGIN
      DELETE FROM api_tokens WHERE owner_key = OLD.api_key AND owner_type = 'agent';
    END;

    CREATE TABLE IF NOT EXISTS audit_logs (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp   TEXT NOT NULL,
      event_type  TEXT NOT NULL,
      actor       TEXT,
      actor_type  TEXT,
      resource    TEXT,
      action      TEXT NOT NULL,
      outcome     TEXT NOT NULL,
      ip_address  TEXT,
      user_agent  TEXT,
      details     TEXT
    );

    CREATE TABLE IF NOT EXISTS import_sessions (
      id          TEXT PRIMARY KEY,
      user_uuid   TEXT NOT NULL,
      key_id      TEXT NOT NULL,
      started_at  TEXT NOT NULL,
      closed_at   TEXT,
      error_count INTEGER DEFAULT 0,
      errors_json TEXT DEFAULT '[]'
    );
  `);
}
