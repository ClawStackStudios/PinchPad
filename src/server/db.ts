import Database from 'better-sqlite3-multiple-ciphers';
import path from 'path';
import fs from 'fs';

// Validate DB_ENCRYPTION_KEY format at module load time
const encryptionKey = process.env.DB_ENCRYPTION_KEY;
if (encryptionKey) {
  // Require at least 32 bytes in base64 format (43+ chars including padding)
  if (!/^[A-Za-z0-9+/=]{43,}$/.test(encryptionKey)) {
    throw new Error(
      '[DB] Invalid DB_ENCRYPTION_KEY format. Must be base64-encoded (min 32 bytes). ' +
      'Generate with: openssl rand -base64 32'
    );
  }
}

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true, mode: 0o700 });
}

const dbPath = path.join(dataDir, 'clawstack.db');

// Set restrictive umask for DB file creation (0o077 = owner only)
const originalUmask = process.umask(0o077);

function openDatabase(): Database.Database {
  try {
    const db = new Database(dbPath);

    if (encryptionKey) {
      // Apply SQLCipher key — must be first pragma after open
      db.pragma(`key = '${encryptionKey}'`);

      // Verify the key works — if DB exists but was plaintext, this will fail
      try {
        db.pragma('user_version');
      } catch (e) {
        // Key failed on existing DB → it's a plaintext DB, migrate it
        console.log('[DB] Detected unencrypted database — migrating to encrypted...');
        db.close();
        encryptExistingDatabase(dbPath, encryptionKey);
        const encrypted = new Database(dbPath);
        encrypted.pragma(`key = '${encryptionKey}'`);
        // Ensure migration temp file is removed and permissions are set
        ensureDbPermissions();
        return encrypted;
      }
    } else {
      console.warn('[DB] WARNING: DB_ENCRYPTION_KEY is not set — database is unencrypted at rest.');
    }

    // Ensure database file and WAL files have restrictive permissions
    ensureDbPermissions();
    return db;
  } finally {
    // Restore original umask
    process.umask(originalUmask);
  }
}

function ensureDbPermissions() {
  // Set restrictive permissions on database and WAL files (owner only: 0o600)
  try {
    if (fs.existsSync(dbPath)) {
      fs.chmodSync(dbPath, 0o600);
    }
    // WAL sidecar files
    const shmPath = dbPath + '-shm';
    const walPath = dbPath + '-wal';
    if (fs.existsSync(shmPath)) {
      fs.chmodSync(shmPath, 0o600);
    }
    if (fs.existsSync(walPath)) {
      fs.chmodSync(walPath, 0o600);
    }
  } catch (e) {
    console.warn('[DB] Warning: could not set restrictive permissions on database files:', e);
  }
}

function encryptExistingDatabase(dbPath: string, key: string) {
  // Open plaintext DB, attach encrypted copy, export, replace
  const tempPath = dbPath + '.tmp';
  const plain = new Database(dbPath);
  plain.exec(`
    ATTACH DATABASE '${tempPath}' AS encrypted KEY '${key}';
    SELECT sqlcipher_export('encrypted');
    DETACH DATABASE encrypted;
  `);
  plain.close();

  // Verify temp file is a regular file (not symlink — TOCTOU check)
  const stats = fs.lstatSync(tempPath);
  if (stats.isSymbolicLink()) {
    throw new Error('[DB] Migration temp file is a symlink — possible attack detected. Aborting.');
  }

  fs.renameSync(tempPath, dbPath);
  console.log('[DB] Database encrypted successfully.');
}

// Clean up any stale migration temp file from a previous crash
const tempPath = dbPath + '.tmp';
if (fs.existsSync(tempPath)) {
  try {
    fs.unlinkSync(tempPath);
    console.log('[DB] Removed stale migration temp file from previous crash.');
  } catch (e) {
    console.warn('[DB] Warning: could not remove stale temp file:', e);
  }
}

const db = openDatabase();

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize schema
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
`);

// Migration for users table (display_name)
const userColumns = db.prepare("PRAGMA table_info('users')").all() as any[];
const hasDisplayName = userColumns.some(col => col.name === 'display_name');

if (!hasDisplayName) {
  try {
    db.exec('ALTER TABLE users ADD COLUMN display_name TEXT');
    console.log('[Database] Added display_name column to users');
  } catch (e) {
    console.warn('[Database] Migration failed (display_name):', e);
  }
}

// Migration for existing tables (api_key_hash)
const columns = db.prepare("PRAGMA table_info('lobster_keys')").all() as any[];
const hasHashColumn = columns.some(col => col.name === 'api_key_hash');

if (!hasHashColumn) {
  try {
    db.exec('ALTER TABLE lobster_keys ADD COLUMN api_key_hash TEXT UNIQUE');
    console.log('[Database] Added api_key_hash column to lobster_keys');
    
    // Hash existing plaintext keys
    import('node:crypto').then(nodeCrypto => {
      const keys = db.prepare('SELECT id, api_key FROM lobster_keys WHERE api_key_hash IS NULL').all() as any[];
      for (const key of keys) {
        if (key.api_key && key.api_key.startsWith('lb-')) {
          const hash = nodeCrypto.createHash('sha256').update(key.api_key).digest('hex');
          db.prepare('UPDATE lobster_keys SET api_key_hash = ? WHERE id = ?').run(hash, key.id);
        }
      }
    });
  } catch (e) {
    console.warn('[Database] Migration failed:', e);
  }
}

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

// Migration for notes table (starred, pinned)
const noteColumns = db.prepare("PRAGMA table_info('notes')").all() as any[];
const hasStarred = noteColumns.some(col => col.name === 'starred');
const hasPinned = noteColumns.some(col => col.name === 'pinned');

if (!hasStarred) {
  try {
    db.exec('ALTER TABLE notes ADD COLUMN starred INTEGER DEFAULT 0');
    console.log('[Database] Added starred column to notes');
  } catch (e) {
    console.warn('[Database] Migration failed (starred):', e);
  }
}

if (!hasPinned) {
  try {
    db.exec('ALTER TABLE notes ADD COLUMN pinned INTEGER DEFAULT 0');
    console.log('[Database] Added pinned column to notes');
  } catch (e) {
    console.warn('[Database] Migration failed (pinned):', e);
  }
}

/**
 * Delete all expired API tokens from the database
 */
export function purgeExpiredTokens() {
  try {
    const result = db
      .prepare(`DELETE FROM api_tokens WHERE datetime(expires_at) <= datetime('now')`)
      .run();
    if (result.changes > 0) {
      console.log(`[Database] Purged ${result.changes} expired token(s)`);
    }
    return result.changes;
  } catch (err) {
    console.error('[Database] Error purging expired tokens:', err);
    return 0;
  }
}

export default db;
