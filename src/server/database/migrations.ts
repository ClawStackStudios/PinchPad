import { Database } from 'better-sqlite3-multiple-ciphers';
import crypto from 'node:crypto';

export function runMigrations(db: Database) {
  console.log('[Database] Checking migrations...');
  
  const runColumnMigration = (sql: string, desc: string) => {
    try { db.exec(sql); console.log(`[DB Migration] ✅  ${desc}`); }
    catch (e: any) { if (!e.message.includes('duplicate column')) throw e; }
  };

  runColumnMigration("ALTER TABLE users ADD COLUMN display_name TEXT", 'users.display_name');
  runColumnMigration("ALTER TABLE settings ADD COLUMN user_uuid TEXT NOT NULL DEFAULT ''", 'settings.user_uuid');
  runColumnMigration('ALTER TABLE api_tokens ADD COLUMN expires_at TEXT', 'api_tokens.expires_at');
  
  // Backfill expiry for existing tokens (90 days)
  db.prepare("UPDATE api_tokens SET expires_at = datetime('now', '+90 days') WHERE expires_at IS NULL").run();

  // Audit logs standard columns
  runColumnMigration('ALTER TABLE audit_logs ADD COLUMN resource TEXT', 'audit_logs.resource');
  runColumnMigration('ALTER TABLE audit_logs ADD COLUMN action TEXT NOT NULL DEFAULT "unknown"', 'audit_logs.action');
  runColumnMigration('ALTER TABLE audit_logs ADD COLUMN outcome TEXT NOT NULL DEFAULT "unknown"', 'audit_logs.outcome');

  // REMOVED: api_tokens owner_uuid -> owner_key migration
  // This caused trigger conflicts in production. Since this is a single-user dev instance
  // with no legacy data, the column rename is not needed. Current schema already uses owner_key.

  // ── Agent keys revocation columns (alignment with ClawChives) ───────────
  runColumnMigration('ALTER TABLE agent_keys ADD COLUMN revoked_at TEXT', 'agent_keys.revoked_at');
  runColumnMigration('ALTER TABLE agent_keys ADD COLUMN revoked_by TEXT', 'agent_keys.revoked_by');
  runColumnMigration('ALTER TABLE agent_keys ADD COLUMN revoke_reason TEXT', 'agent_keys.revoke_reason');

  // ── Pots table (existing installs) ──────────────────────────────────────────
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS pots (
        id         TEXT PRIMARY KEY,
        user_uuid  TEXT NOT NULL,
        name       TEXT NOT NULL,
        color      TEXT NOT NULL DEFAULT '#f59e0b',
        created_at TEXT NOT NULL,
        FOREIGN KEY(user_uuid) REFERENCES users(uuid) ON DELETE CASCADE
      );
    `);
    console.log('[DB Migration] ✅ pots table ensured');
  } catch (e: any) {
    console.warn('[DB Migration] ⚠️  pots table migration warning:', e.message);
  }

  runColumnMigration("ALTER TABLE notes ADD COLUMN pot_id TEXT REFERENCES pots(id) ON DELETE SET NULL", 'notes.pot_id');

  // Indexes
  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_key_hash ON users(key_hash);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_settings_user_key ON settings(user_uuid, key);
    CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);
    CREATE INDEX IF NOT EXISTS idx_audit_event_type ON audit_logs(event_type);
    CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_logs(actor);
    CREATE INDEX IF NOT EXISTS idx_audit_outcome ON audit_logs(outcome);
    CREATE INDEX IF NOT EXISTS idx_api_tokens_key ON api_tokens(key);
    CREATE INDEX IF NOT EXISTS idx_api_tokens_expires_at ON api_tokens(expires_at);
    CREATE INDEX IF NOT EXISTS idx_agent_keys_api_key ON agent_keys(api_key);
    CREATE INDEX IF NOT EXISTS idx_agent_keys_active ON agent_keys(is_active);
    CREATE INDEX IF NOT EXISTS idx_notes_user_created ON notes(user_uuid, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_pots_user ON pots(user_uuid);
    CREATE INDEX IF NOT EXISTS idx_notes_pot_id ON notes(pot_id);
  `);

  // Fix cascade_agent_api_tokens trigger logic (OLD.id -> OLD.api_key)
  try {
    db.exec(`
      DROP TRIGGER IF EXISTS cascade_agent_api_tokens;
      CREATE TRIGGER cascade_agent_api_tokens
      AFTER DELETE ON agent_keys
      BEGIN
        DELETE FROM api_tokens WHERE owner_key = OLD.api_key AND owner_type = 'agent';
      END;
    `);
    console.log('[DB Migration] ✅ cascade_agent_api_tokens trigger updated');
  } catch (e: any) {
    console.warn('[DB Migration] ❌ Failed to update agent cascade trigger:', e.message);
  }
  
  console.log('[Database] Migrations complete.');
}
