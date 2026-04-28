import Database from 'better-sqlite3-multiple-ciphers';
import crypto from 'crypto';

export function createTestDatabase(): Database.Database {
  const db = new Database(':memory:');

  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      uuid TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      key_hash TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS api_tokens (
      key TEXT PRIMARY KEY,
      owner_key TEXT NOT NULL,
      owner_type TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS agent_keys (
      id TEXT PRIMARY KEY,
      user_uuid TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      api_key TEXT NOT NULL UNIQUE,
      permissions TEXT NOT NULL,
      expiration_type TEXT NOT NULL,
      expiration_date TEXT,
      rate_limit INTEGER,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      last_used TEXT
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
      FOREIGN KEY (user_uuid) REFERENCES users(uuid) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp  TEXT NOT NULL,
      event_type TEXT NOT NULL,
      actor      TEXT,
      actor_type TEXT,
      ip_address TEXT,
      user_agent TEXT,
      details    TEXT
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_key_hash ON users(key_hash);
  `);

  return db;
}

export function resetTestDatabase(db: Database.Database): void {
  try {
    db.pragma('foreign_keys = OFF');

    db.prepare('DELETE FROM audit_logs').run();
    db.prepare('DELETE FROM notes').run();
    db.prepare('DELETE FROM api_tokens').run();
    db.prepare('DELETE FROM agent_keys').run();
    db.prepare('DELETE FROM users').run();

    db.pragma('foreign_keys = ON');
  } catch (err) {
    console.error('[TestDb] Error resetting database:', err);
    throw err;
  }
}

export function cleanupTestDatabase(db: Database.Database): void {
  try {
    db.close();
  } catch (err) {
    console.error('[TestDb] Error closing database:', err);
  }
}

export function countRows(db: Database.Database, table: string, whereClause?: string, params?: any[]): number {
  const sql = whereClause ? `SELECT COUNT(*) as count FROM ${table} WHERE ${whereClause}` : `SELECT COUNT(*) as count FROM ${table}`;
  const result = db.prepare(sql).get(...(params || [])) as any;
  return result.count;
}

export function hasConstraintViolation(err: any, constraintType: 'UNIQUE' | 'FOREIGN_KEY' | 'NOT_NULL'): boolean {
  if (!err || !err.message) return false;
  const msg = err.message.toUpperCase();

  switch (constraintType) {
    case 'UNIQUE':
      return msg.includes('UNIQUE');
    case 'FOREIGN_KEY':
      return msg.includes('FOREIGN KEY');
    case 'NOT_NULL':
      return msg.includes('NOT NULL');
    default:
      return false;
  }
}
