import { Database } from 'better-sqlite3-multiple-ciphers';
import crypto from 'node:crypto';

export function runMigrations(db: Database) {
  console.log('[Database] Checking migrations...');
  // 1. users table: display_name
  const userColumns = db.prepare("PRAGMA table_info('users')").all() as any[];
  if (!userColumns.some(col => col.name === 'display_name')) {
    try {
      db.exec('ALTER TABLE users ADD COLUMN display_name TEXT');
      console.log('[Database] Added display_name column to users');
    } catch (e) {
      console.warn('[Database] Migration failed (display_name):', e);
    }
  }

  // 2. lobster_keys table: api_key_hash
  const lobsterColumns = db.prepare("PRAGMA table_info('lobster_keys')").all() as any[];
  if (!lobsterColumns.some(col => col.name === 'api_key_hash')) {
    try {
      db.exec('ALTER TABLE lobster_keys ADD COLUMN api_key_hash TEXT UNIQUE');
      console.log('[Database] Added api_key_hash column to lobster_keys');
      
      // Hash existing plaintext keys
      const keys = db.prepare('SELECT id, api_key FROM lobster_keys WHERE api_key_hash IS NULL').all() as any[];
      for (const key of keys) {
        if (key.api_key && key.api_key.startsWith('lb-')) {
          const hash = crypto.createHash('sha256').update(key.api_key).digest('hex');
          db.prepare('UPDATE lobster_keys SET api_key_hash = ? WHERE id = ?').run(hash, key.id);
        }
      }
    } catch (e) {
      console.warn('[Database] Migration failed (api_key_hash):', e);
    }
  }

  // 3. users table: unique index on key_hash
  const userIndexes = db.prepare("PRAGMA index_list('users')").all() as any[];
  const hasUniqueKeyHash = userIndexes.some(idx =>
    idx.unique === 1 &&
    (db.prepare(`PRAGMA index_info('${idx.name}')`).all() as any[]).some(col => col.name === 'key_hash')
  );
  if (!hasUniqueKeyHash) {
    try {
      db.exec('CREATE UNIQUE INDEX idx_users_key_hash ON users(key_hash)');
      console.log('[Database] Created unique index on key_hash');
    } catch (e) {
      console.warn('[Database] Could not create unique index on key_hash');
    }
  }

  // 4. notes table: starred, pinned
  const noteColumns = db.prepare("PRAGMA table_info('notes')").all() as any[];
  if (!noteColumns.some(col => col.name === 'starred')) {
    db.exec('ALTER TABLE notes ADD COLUMN starred INTEGER DEFAULT 0');
  }
  if (!noteColumns.some(col => col.name === 'pinned')) {
    db.exec('ALTER TABLE notes ADD COLUMN pinned INTEGER DEFAULT 0');
  }

  // 5. audit_logs table: resource, action, outcome (ClawStack Standard)
  const auditColumns = db.prepare("PRAGMA table_info('audit_logs')").all() as any[];
  if (!auditColumns.some(col => col.name === 'resource')) {
    db.exec('ALTER TABLE audit_logs ADD COLUMN resource TEXT');
    console.log('[Database] Added resource column to audit_logs');
  }
  if (!auditColumns.some(col => col.name === 'action')) {
    db.exec('ALTER TABLE audit_logs ADD COLUMN action TEXT NOT NULL DEFAULT "unknown"');
    console.log('[Database] Added action column to audit_logs');
  }
  if (!auditColumns.some(col => col.name === 'outcome')) {
    db.exec('ALTER TABLE audit_logs ADD COLUMN outcome TEXT NOT NULL DEFAULT "unknown"');
    console.log('[Database] Added outcome column to audit_logs');
  }

  // 6. api_tokens table: rename owner_uuid to owner_key
  const tokenColumns = db.prepare("PRAGMA table_info('api_tokens')").all() as any[];
  if (tokenColumns.some(col => col.name === 'owner_uuid') && !tokenColumns.some(col => col.name === 'owner_key')) {
    try {
      db.exec('ALTER TABLE api_tokens RENAME COLUMN owner_uuid TO owner_key');
      console.log('[Database] Renamed owner_uuid to owner_key in api_tokens');
    } catch (e) {
      console.warn('[Database] Migration failed (rename owner_uuid):', e);
    }
  }
  console.log('[Database] Migrations complete.');
}
