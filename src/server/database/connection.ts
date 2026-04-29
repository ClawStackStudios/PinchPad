import Database from 'better-sqlite3-multiple-ciphers';
import path from 'path';
import fs from 'fs';

// Validate DB_ENCRYPTION_KEY format at module load time
const encryptionKey = process.env.DB_ENCRYPTION_KEY;
if (encryptionKey && process.env.NODE_ENV !== 'test') {
  // Require at least 32 bytes in base64 format (43+ chars including padding)
  if (!/^[A-Za-z0-9+/=]{43,}$/.test(encryptionKey)) {
    throw new Error(
      '[DB] Invalid DB_ENCRYPTION_KEY format. Must be base64-encoded (min 32 bytes). ' +
      'Generate with: openssl rand -base64 32'
    );
  }
}

const DATA_DIR = process.env.DATA_DIR ?? path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR) && process.env.NODE_ENV !== 'test') {
  fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 });
}

const dbPath = process.env.NODE_ENV === 'test' ? ':memory:' : path.join(DATA_DIR, 'clawstack.db');

// Set restrictive umask for DB file creation (0o077 = owner only)
const originalUmask = process.umask(0o077);

function encryptExistingDatabase(dbPath: string, key: string) {
  // Use ATTACH DATABASE + sqlcipher_export pattern (aligned with ClawChives)
  const resolvedDbPath = path.resolve(dbPath);
  const tempPath = resolvedDbPath + '.tmp';

  try {
    const plain = new Database(resolvedDbPath);
    plain.exec(`
      ATTACH DATABASE '${tempPath}' AS encrypted KEY '${key}';
      SELECT sqlcipher_export('encrypted');
      DETACH DATABASE encrypted;
    `);
    plain.close();
    fs.renameSync(tempPath, resolvedDbPath);
    console.log('[DB] ✅ Database encrypted successfully.');
  } catch (e: any) {
    try { fs.unlinkSync(tempPath); } catch {}
    throw e;
  }
}

function ensureDbPermissions(targetPath: string) {
  if (targetPath === ':memory:') return;
  // Set restrictive permissions on database and WAL files (owner only: 0o600)
  try {
    if (fs.existsSync(targetPath)) {
      fs.chmodSync(targetPath, 0o600);
    }
    // WAL sidecar files
    const shmPath = targetPath + '-shm';
    const walPath = targetPath + '-wal';
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

function openDatabase(): Database.Database {
  try {
    const db = new Database(dbPath);

    if (encryptionKey && process.env.NODE_ENV !== 'test') {
      // Apply SQLCipher key — must be first pragma after open
      db.pragma(`key = '${encryptionKey}'`);

      // Verify key works — if DB exists but was plaintext, this will fail
      try {
        db.pragma('user_version');
      } catch (e: any) {
        // Key failed on existing DB → it's a plaintext DB, migrate it
        console.log('[DB] Detected unencrypted database — migrating to encrypted...');
        db.close();
        encryptExistingDatabase(dbPath, encryptionKey);
        const encrypted = new Database(dbPath);
        encrypted.pragma(`key = '${encryptionKey}'`);
        // Ensure migration temp file is removed and permissions are set
        ensureDbPermissions(dbPath);
        return encrypted;
      }
    } else if (process.env.NODE_ENV !== 'test') {
      console.warn('[DB] WARNING: DB_ENCRYPTION_KEY is not set — database is unencrypted at rest.');
    }

    // Ensure database file and WAL files have restrictive permissions
    ensureDbPermissions(dbPath);
    return db;
  } finally {
    // Restore original umask
    process.umask(originalUmask);
  }
}

// Clean up any stale migration temp file from a previous crash
const staleTempPath = dbPath + '.tmp';
if (dbPath !== ':memory:' && fs.existsSync(staleTempPath)) {
  try {
    fs.unlinkSync(staleTempPath);
    console.log('[DB] Removed stale migration temp file from previous crash.');
  } catch (e) {
    console.warn('[DB] Warning: could not remove stale temp file:', e);
  }
}

const db = openDatabase();

db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('foreign_keys = ON');
db.pragma('busy_timeout = 5000'); // 5 second timeout for locked DB

export default db;
