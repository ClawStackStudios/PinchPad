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

function encryptExistingDatabase(targetPath: string, key: string) {
  // Open plaintext DB, attach encrypted copy, export, replace
  const tempPath = targetPath + '.tmp';
  const plain = new Database(targetPath);
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

  fs.renameSync(tempPath, targetPath);
  console.log('[DB] Database encrypted successfully.');
}

function ensureDbPermissions(targetPath: string) {
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
        ensureDbPermissions(dbPath);
        return encrypted;
      }
    } else {
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
if (fs.existsSync(staleTempPath)) {
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
