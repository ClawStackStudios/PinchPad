import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'clawstack.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    uuid TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    key_hash TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS api_tokens (
    key TEXT PRIMARY KEY,
    owner_uuid TEXT NOT NULL,
    owner_type TEXT NOT NULL,
    lobster_key_id TEXT,
    expires_at TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY(owner_uuid) REFERENCES users(uuid) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS lobster_keys (
    id TEXT PRIMARY KEY,
    user_uuid TEXT NOT NULL,
    name TEXT NOT NULL,
    api_key TEXT UNIQUE NOT NULL,
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
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(user_uuid) REFERENCES users(uuid) ON DELETE CASCADE
  );
`);

// Migration for existing tables
const indexes = db.prepare("PRAGMA index_list('users')").all() as any[];
const hasUniqueKeyHash = indexes.some(idx =>
  idx.unique === 1 &&
  (db.prepare(`PRAGMA index_info('${idx.name}')`).all() as any[]).some(col => col.name === 'key_hash')
);

if (!hasUniqueKeyHash) {
  try {
    db.exec('CREATE UNIQUE INDEX idx_users_key_hash ON users(key_hash)');
    console.log('[Database] Created unique index on key_hash');
  } catch (e) {
    console.warn('[Database] Could not create unique index on key_hash (duplicates might exist)');
  }
}

export default db;
