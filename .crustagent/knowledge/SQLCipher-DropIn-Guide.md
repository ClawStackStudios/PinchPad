---
title: SQLCipher Drop-In Guide — Universal ClawStack Studios©™ Pattern
description: Step-by-step guide to add AES-256 SQLite database encryption to any ClawStack project
version: 1.0.0
origin: PinchPad©™ (2026-03-16)
author: CrustAgent©™
---

# SQLCipher Drop-In Guide
## Universal AES-256 Database Encryption for ClawStack Studios©™ Projects

> Implemented first in **PinchPad©™**. Drop this into any project that uses `better-sqlite3` + Express + Docker in 10 minutes or less.

---

## Prerequisites: Confirm Project Architecture Match

Before dropping in, verify your target project has:

- [x] `better-sqlite3` as the SQLite driver
- [x] A single `src/server/db.ts` that exports a `db` default instance
- [x] `process.env.DB_ENCRYPTION_KEY` not already in use
- [x] Docker compose with volume bind mount for the DB file
- [x] Tests using `:memory:` in-memory databases (not the real file)

If all checked — you're a direct drop-in. Proceed.

---

## Step 1 — Swap the Package

In `package.json`, find and replace the SQLite dependency:

**Before:**
```json
"better-sqlite3": "^12.x.x"
```

**After:**
```json
"better-sqlite3-multiple-ciphers": "^9.1.1"
```

> `better-sqlite3-multiple-ciphers` is a **100% API-compatible drop-in replacement** for `better-sqlite3`. Same methods, same syntax, same types — just SQLCipher built in.

Then install:
```bash
npm install
```

---

## Step 2 — Update `src/server/db.ts`

This is the **only application file** that changes. Everything else (routes, services, middleware) is untouched.

### 2a. Update the import

**Before:**
```typescript
import Database from 'better-sqlite3';
```

**After:**
```typescript
import Database from 'better-sqlite3-multiple-ciphers';
```

### 2b. Validate & Add the `encryptionKey` variable

Immediately after your `dbPath` declaration, add key validation and set restrictive umask:

```typescript
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

// Set restrictive umask for DB file creation (0o077 = owner only, no group/other)
const originalUmask = process.umask(0o077);
```

Also ensure `dataDir` creation uses restrictive mode:
```typescript
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true, mode: 0o700 });
}
```

### 2c. Wrap your Database open call in `openDatabase()`

Find the line where your DB is opened. It will look like:

```typescript
const db = new Database(dbPath);
```

Replace it with this full block (paste verbatim):

```typescript
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

function openDatabase(): Database.Database {
  try {
    const db = new Database(dbPath);

    if (encryptionKey) {
      // Apply SQLCipher key — must be FIRST pragma after open
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
```

> **Make sure `fs` is imported** at the top of the file:
> ```typescript
> import fs from 'fs';
> ```

### 2d. Result: What `db.ts` Should Look Like (Structure)

```typescript
import Database from 'better-sqlite3-multiple-ciphers';  // ← changed
import path from 'path';
import fs from 'fs';                                       // ← ensure this exists

// Validate DB_ENCRYPTION_KEY format at module load time  // ← new (security)
const encryptionKey = process.env.DB_ENCRYPTION_KEY;
if (encryptionKey) {
  if (!/^[A-Za-z0-9+/=]{43,}$/.test(encryptionKey)) {
    throw new Error('[DB] Invalid DB_ENCRYPTION_KEY format...');
  }
}

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true, mode: 0o700 });  // ← added mode: 0o700 (security)
}

const dbPath = path.join(dataDir, 'yourapp.db');
const originalUmask = process.umask(0o077);               // ← new (security - restrictive umask)

function ensureDbPermissions() { ... }                    // ← new (security - chmod 0o600)
function openDatabase(): Database.Database { ... }        // ← new (with finally block for umask restore)
function encryptExistingDatabase(...) { ... }             // ← new (with symlink check + TOCTOU defense)

// Clean up stale temp file on startup                    // ← new (crash recovery)
const tempPath = dbPath + '.tmp';
if (fs.existsSync(tempPath)) { ... }

const db = openDatabase();                                // ← changed from: new Database(dbPath)

// All your existing pragmas, schema, migrations, utilities BELOW this line — unchanged
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
// ... rest of file identical to before
```

---

## Step 3 — Update Test Files

Any test file that directly imports `better-sqlite3` needs the import swapped. The test DB logic itself is untouched — `:memory:` databases work identically with the new package.

Search for all test files importing the old package:
```bash
grep -r "from 'better-sqlite3'" test/
```

In each found file, replace:
```typescript
import Database from 'better-sqlite3';
```
with:
```typescript
import Database from 'better-sqlite3-multiple-ciphers';
```

> The type signature is identical. `Database.Database` type, all method signatures — no changes needed to test logic.

---

## Step 4 — Document the Environment Variable

### `.env.example`

Add:
```bash
# DB_ENCRYPTION_KEY: SQLite Database Encryption Key (AES-256 via SQLCipher)
# Generate with: openssl rand -base64 32
# Leave unset for unencrypted DB (not recommended for production)
# DB_ENCRYPTION_KEY=
```

### `docker-compose.yml` + `docker-compose.dev.yml`

In the `environment:` block, add (commented):
```yaml
environment:
  - NODE_ENV=production
  - PORT=8282
  # DB_ENCRYPTION_KEY: Generate with: openssl rand -base64 32
  # - DB_ENCRYPTION_KEY=your-key-here
```

---

## Step 5 — Verify It Works

### 5a. Run tests first

```bash
npm test
```

All tests must pass before you proceed. The in-memory test DBs are unaffected by encryption.

### 5b. Generate a key and test encryption

```bash
openssl rand -base64 32
# Copy the output
```

**For npm dev**, add to `.env.local`:
```bash
DB_ENCRYPTION_KEY=<paste-key-here>
```

Start the app. You should see:
```
[DB] (no warning — database is encrypted)
```

If you had an existing plaintext DB, you'll see:
```
[DB] Detected unencrypted database — migrating to encrypted...
[DB] Database encrypted successfully.
```

### 5c. Verify the file is actually encrypted

With the app stopped:
```bash
# Try to open with sqlite3 (no cipher) — should fail
sqlite3 data/yourapp.db
sqlite> .tables
# Error: file is not a database ← GOOD, encryption is working

# Try with sqlcipher and your key — should succeed
sqlcipher data/yourapp.db
sqlite> PRAGMA key = 'your-key-here';
sqlite> .tables
# Shows your tables ← GOOD
```

### 5d. Test without a key

Unset `DB_ENCRYPTION_KEY` and restart. You should see:
```
[DB] WARNING: DB_ENCRYPTION_KEY is not set — database is unencrypted at rest.
```

App should still start and work normally — fallback is plaintext.

---

## Security Hardening Measures (Built-In)

This implementation includes defense-in-depth protections:

| Protection | What It Does |
|---|---|
| **Key Validation** | Rejects non-base64 keys at startup, prevents SQL injection via key string interpolation |
| **Restrictive umask** | Files created with `0o600` (owner only), no read/write for group/other |
| **File chmod** | Explicitly sets DB + WAL files to `0o600` on all lifecycle points |
| **Temp file cleanup** | Detects and removes orphaned migration files from crashes |
| **Symlink detection** | Verifies migration temp file is regular (not symlink) before rename — prevents TOCTOU |
| **Umask restoration** | Restores original umask in finally block, no side effects |

These are production-ready hardening measures. No additional security work needed.

---

## How It Works — Explanation for Deep Understanding

### Why SQLCipher?

`better-sqlite3` is the standard Node.js SQLite driver — it opens plain, unencrypted `.db` files. Anyone with filesystem access can open them directly with any SQLite browser.

SQLCipher is a fork of SQLite that adds AES-256-CBC encryption at the page level. The entire `.db` file on disk is encrypted. SQLCipher is:
- Used by Signal, WhatsApp, and dozens of major apps
- NIST-approved AES-256 cipher
- Hardware-accelerated on modern CPUs (negligible overhead)
- Drop-in compatible with all SQLite APIs

`better-sqlite3-multiple-ciphers` is a Node.js binding for SQLCipher — same API as `better-sqlite3`, just with cipher support built in.

### The Key Pragma

```typescript
db.pragma(`key = '${encryptionKey}'`);
```

This **must be the first pragma after opening** the database. SQLCipher uses it to derive the AES-256 encryption key via PBKDF2. After this call, all reads and writes are transparently encrypted/decrypted.

### The Migration Function

When you set `DB_ENCRYPTION_KEY` on an existing unencrypted database, SQLCipher can't read it (no cipher header). The migration path:

1. Open the plaintext DB normally (no key)
2. `ATTACH` an encrypted copy at a temp path with the key
3. `SELECT sqlcipher_export('encrypted')` — copies all data to the encrypted DB
4. `DETACH`, close, rename temp → original
5. Re-open with the key — fully encrypted DB with all your data intact

This is SQLCipher's own built-in export mechanism — reliable and well-tested.

### Security Model

```
Layer 1: Transport (HTTPS or localhost for SubtleCrypto access)
Layer 2: Database at rest (SQLCipher AES-256) ← THIS FEATURE
Layer 3: Note content (ShellCryption™ AES-256-GCM, client-side)
```

All three layers are independent. This feature adds Layer 2 protection — even if someone steals your `.db` file, they get an unreadable binary blob without the key.

---

## Behavior Matrix

| Scenario | What Happens |
|---|---|
| No key set, new DB | Plaintext DB created, warning logged |
| No key set, existing DB | Plaintext DB opened, warning logged |
| Key set, new DB | Encrypted DB created, no warning |
| Key set, existing encrypted DB (correct key) | Opens normally |
| Key set, existing plaintext DB | Auto-migrates to encrypted, logs progress |
| Key set, existing encrypted DB (wrong key) | Fails to open, error thrown |

---

## Files Changed Checklist

For any target project:

- [ ] `package.json` — dependency swap
- [ ] `src/server/db.ts` — import + `openDatabase()` + `encryptExistingDatabase()`
- [ ] `test/shared/app.ts` (or equivalent test utility) — import swap
- [ ] All test files that import `better-sqlite3` — import swap
- [ ] `.env.example` — add `DB_ENCRYPTION_KEY` documentation
- [ ] `docker-compose.yml` — add commented env var
- [ ] `docker-compose.dev.yml` — add commented env var
- [ ] `README.md` — add encryption setup section (optional but recommended)

**Total app-level logic changes**: 1 file (`db.ts`)
**Total import-only changes**: N test files (grep to find them)

---

## Reference: PinchPad Implementation

The canonical implementation lives in:
- `src/server/db.ts` — full working implementation
- `.crustagent/crustaudits/CRUSTAUDIT_SQLCIPHER_ENCRYPTION.md` — full technical audit

---

*Maintained by CrustAgent©™*
*Origin: PinchPad©™ — 2026-03-16*
*Universal across: ClawStack Studios©™ projects using better-sqlite3 + Express + Docker*
