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

// Default main DB path
const mainDbPath = process.env.NODE_ENV === 'test' ? ':memory:' : path.join(DATA_DIR, 'db.sqlite');

/**
 * Open a database connection with standard PinchPad pragmas and optional encryption.
 */
export function createConnection(filename: string, key?: string): Database.Database {
  const dbPath = filename === ':memory:' ? ':memory:' : path.join(DATA_DIR, filename);
  
  // Set restrictive umask for DB file creation (0o077 = owner only)
  const originalUmask = process.umask(0o077);

  try {
    const db = new Database(dbPath);

    if (key && process.env.NODE_ENV !== 'test') {
      db.pragma(`key = '${key}'`);
      try {
        db.pragma('user_version');
      } catch (e: any) {
        console.log(`[DB] Detected unencrypted database ${filename} — migrating...`);
        db.close();
        encryptExistingDatabase(dbPath, key);
        const encrypted = new Database(dbPath);
        encrypted.pragma(`key = '${key}'`);
        ensureDbPermissions(dbPath);
        return encrypted;
      }
    }

    ensureDbPermissions(dbPath);
    
    // Standard Pragmas
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');
    db.pragma('foreign_keys = ON');
    db.pragma('busy_timeout = 5000');

    return db;
  } finally {
    process.umask(originalUmask);
  }
}

function encryptExistingDatabase(dbPath: string, key: string) {
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
    console.log(`[DB] ✅ Database ${path.basename(dbPath)} encrypted successfully.`);
  } catch (e: any) {
    try { fs.unlinkSync(tempPath); } catch {}
    throw e;
  }
}

function ensureDbPermissions(targetPath: string) {
  if (targetPath === ':memory:') return;
  try {
    if (fs.existsSync(targetPath)) fs.chmodSync(targetPath, 0o600);
    ['shm', 'wal'].forEach(ext => {
      const sidecar = `${targetPath}-${ext}`;
      if (fs.existsSync(sidecar)) fs.chmodSync(sidecar, 0o600);
    });
  } catch (e) {
    console.warn('[DB] Warning: could not set permissions:', e);
  }
}

// Export default main DB connection
const db = createConnection('db.sqlite', encryptionKey);
export default db;

