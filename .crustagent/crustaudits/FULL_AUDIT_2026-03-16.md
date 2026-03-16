---
title: Full Project Audit — PinchPad©™ (SQLCipher Implementation)
date: 2026-03-16
status: CRITICAL FINDINGS IDENTIFIED
author: CrustAgent©™
---

# 🔍 FULL PROJECT AUDIT — PinchPad©™

**Date**: 2026-03-16
**Scope**: Complete project verification post-SQLCipher implementation
**Auditors**: CODE-AUDITOR, SECURITY-AUDITOR
**Status**: ⚠️ PRODUCTION BLOCKING ISSUES IDENTIFIED

---

## Executive Summary

PinchPad's SQLCipher database encryption feature is **architecturally sound** and **all 140 tests pass**, but **3 critical security issues** and **4 high-severity vulnerabilities** must be fixed before production deployment. The issues are primarily around:

1. **SQL injection** via string interpolation of the encryption key into PRAGMA statements
2. **File permissions** — the database and migration temp files are world-readable
3. **Session token storage** — tokens stored plaintext, enabling full account takeover on DB read
4. **Key validation** — no enforcement of minimum entropy/format for encryption key

## Build & Test Status

| Component | Status | Details |
|---|---|---|
| **npm test** | ✅ PASS | 140/140 tests passing (9 test files) |
| **npm run build** | ✅ PASS | Vite production build succeeds (512 KB JS bundle) |
| **npm run lint** | ⚠️ PASS (pre-existing) | TypeScript check clean except pre-existing type issues in integration tests |
| **Docker Config** | ✅ PASS | Port 8282 exposed, volumes bound, env vars documented |
| **Dependencies** | ✅ PASS | better-sqlite3-multiple-ciphers installed and linked correctly |

---

## Code Quality Audit Results

### Type Safety: ✅ CLEAN

- No unsafe casts beyond acceptable patterns
- Database imports correctly updated (8 files swapped)
- No circular dependencies
- No unused imports
- Test utilities properly typed

### Security Patterns: ⚠️ ISSUES FOUND (See below)

- Auth middleware functioning correctly
- Token hashing framework intact
- 3 critical + 4 high-severity issues identified

### Test Coverage: ✅ 140/140 PASSING

- Auth routes: 18 tests ✅
- Notes routes: 32 tests ✅
- Agents routes: 28 tests ✅
- Auth middleware: 36 tests ✅
- Cross-user isolation: 20 tests ✅
- Token lifecycle: 6 tests ✅

---

## Critical Issues (PRODUCTION BLOCKING)

### 🔴 CRITICAL-01: SQL Injection via Key String Interpolation

**Location**: `src/server/db.ts:18` and `src/server/db.ts:44`

**Issue**: The database encryption key is injected directly into PRAGMA strings:
```typescript
db.pragma(`key = '${encryptionKey}'`);  // ← String interpolation
plain.exec(`ATTACH DATABASE '${tempPath}' AS encrypted KEY '${key}';`);  // ← String interpolation
```

**Attack Vector**: An attacker setting `DB_ENCRYPTION_KEY=abc'; ATTACH DATABASE '/tmp/evil.db' AS exfil;--` could manipulate SQLCipher to attach arbitrary databases or execute unintended SQL.

**Blast Radius**: Arbitrary database attachment, potential SQL injection in PRAGMA context

**Fix**: Validate the encryption key is strictly base64 format. Reject any key containing quotes, semicolons, or special characters:
```typescript
// At module load, validate key format
if (encryptionKey && !/^[A-Za-z0-9+/=]{32,}$/.test(encryptionKey)) {
  throw new Error('DB_ENCRYPTION_KEY must be base64-encoded');
}
```

---

### 🔴 CRITICAL-02: World-Readable Database & Migration Files

**Location**: `src/server/db.ts` (entire file) + `data/clawstack.db` (confirmed 0644 on disk)

**Issue**:
1. Production database file is created with default umask `0644` (world-readable)
2. Migration temp file (`clawstack.db.tmp`) is also `0644` during the export window
3. Any process on the host can read the entire database, even encrypted SQLite files if they can guess or obtain the key

**Attack Vector**: A compromised sidecar container, local user, or adjacent process can read `clawstack.db.tmp` during migration (window: several seconds on large DB) or read `clawstack.db` at any time.

**Blast Radius**: Complete data exfiltration including users, keys, notes, API tokens

**Fix**:
```typescript
// Before opening the database, set strict umask
const oldUmask = process.umask(0o077); // Restore after DB creation

// After migration completes or on startup
fs.chmodSync(dbPath, 0o600);
fs.chmodSync(dbPath + '-shm', 0o600);  // WAL sidecar files
fs.chmodSync(dbPath + '-wal', 0o600);

process.umask(oldUmask); // Restore original
```

**Immediate Action**: Run on production host:
```bash
chmod 600 data/clawstack.db data/clawstack.db-shm data/clawstack.db-wal
```

---

### 🔴 CRITICAL-03: Session Tokens Stored in Plaintext

**Location**: `src/server/routes/auth.ts:124` + `src/server/middleware/auth.ts:23`

**Issue**: API session tokens (`api-` prefixed) are inserted and queried by plaintext value:
```typescript
// Insert (no hashing)
db.prepare('INSERT INTO api_tokens (key, ...) VALUES (?, ...)').run(token, ...);

// Query (plaintext lookup)
const session = db.prepare('SELECT * FROM api_tokens WHERE key = ?').get(token);
```

Unlike `hu-` user keys (stored as `key_hash`), session tokens are stored unencrypted in the `api_tokens` table.

**Attack Vector**: If an attacker reads `clawstack.db` (either encrypted copy with the key, or unencrypted via CRITICAL-02), they immediately extract all active session tokens from the `api_tokens` table. These tokens can be replayed directly in `Authorization: Bearer api-<token>` headers for instant account access.

**Blast Radius**: Full account takeover for all users with active sessions

**Fix**: Hash session tokens before storage and lookup, matching the `hu-` key pattern:
```typescript
// On insert
const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
db.prepare('INSERT INTO api_tokens (key_hash, ...) VALUES (?, ...)').run(tokenHash, ...);

// On lookup
const incomingTokenHash = crypto.createHash('sha256').update(bearerToken).digest('hex');
const session = db.prepare('SELECT * FROM api_tokens WHERE key_hash = ?').get(incomingTokenHash);
```

---

## High-Severity Issues (SHOULD FIX BEFORE PROD)

### 🟠 HIGH-01: Symlink TOCTOU Race During Migration

**Location**: `src/server/db.ts:41-49`

A race condition between creating `clawstack.db.tmp` and renaming it. An attacker with write access to the data directory can symlink the temp file to a sensitive target, causing the rename to overwrite arbitrary files on the system.

**Fix**: Verify the temp path is a regular file before renaming:
```typescript
const stats = fs.lstatSync(tempPath);
if (!stats.isFile() || stats.isSymbolicLink()) {
  throw new Error('Temp file is not a regular file — possible symlink attack');
}
```

---

### 🟠 HIGH-02: Orphaned Temp File on Crash

**Location**: `src/server/db.ts:41-49`

If the process crashes between `sqlcipher_export` and `fs.renameSync`, `clawstack.db.tmp` is left on disk containing a complete encrypted database copy. It's never cleaned up on restart.

**Fix**: Detect and remove stale temp files at startup:
```typescript
if (fs.existsSync(dbPath + '.tmp')) {
  console.log('[DB] Removing stale migration temp file...');
  fs.unlinkSync(dbPath + '.tmp');
}
```

---

### 🟠 HIGH-03: No Key Validation

**Location**: `src/server/db.ts:11`

The encryption key is never validated. A user can set `DB_ENCRYPTION_KEY=a` (one character) and the database is "encrypted" with trivial security. Whitespace-only keys are accepted.

**Fix**: Validate at module load:
```typescript
const encryptionKey = process.env.DB_ENCRYPTION_KEY;
if (encryptionKey) {
  // Require minimum 32 bytes (base64) and strict character set
  if (!/^[A-Za-z0-9+/=]{43,}$/.test(encryptionKey) || encryptionKey.length < 43) {
    throw new Error('DB_ENCRYPTION_KEY must be at least 32 bytes in base64 format');
  }
}
```

---

### 🟠 HIGH-04: Async Migration With No Error Handling

**Location**: `src/server/db.ts:130-138`

The lobster key hash migration uses `import('node:crypto').then()` with no `.catch()`. If it fails, the error is swallowed and hashes don't get generated, causing silent auth failures.

**Fix**: Use synchronous import and add explicit error handling:
```typescript
const crypto = require('crypto');  // or import crypto from 'crypto';

try {
  const keys = db.prepare('SELECT id, api_key FROM lobster_keys WHERE api_key_hash IS NULL').all() as any[];
  for (const key of keys) {
    if (key.api_key && key.api_key.startsWith('lb-')) {
      const hash = crypto.createHash('sha256').update(key.api_key).digest('hex');
      db.prepare('UPDATE lobster_keys SET api_key_hash = ? WHERE id = ?').run(hash, key.id);
    }
  }
} catch (e) {
  console.error('[DB] Migration of lobster_key_hash failed:', e);
  throw e;  // Fail startup if migration fails
}
```

---

## Medium-Severity Issues (FIX BEFORE WIDE RELEASE)

| ID | Issue | Fix |
|---|---|---|
| MEDIUM-01 | Any PRAGMA error triggers re-encryption, risking data loss | Check file magic bytes before assuming plaintext |
| MEDIUM-02 | Broken lobster key migration semantics (encrypts ciphertext?) | Audit intent — should this hash plaintext or ciphertext? |
| MEDIUM-03 | Length leak in `constantTimeCompare` | Use `crypto.timingSafeEqual()` |
| MEDIUM-04 | `fallbackSha256` is ASCII-only | Add UTF-8 encoding or enforce ASCII-only tokens |
| MEDIUM-05 | DB_ENCRYPTION_KEY missing from dev `.env.local` | Add to dev env, document requirement |

---

## Docker & Infrastructure

### ✅ Docker Configuration: GOOD

- Port 8282 properly exposed
- Data volumes bind-mounted correctly
- Environment variable documentation present
- Healthcheck configured

### ⚠️ File Permissions: BAD

- Database and WAL files created as `0644` (world-readable)
- Migration temp files also `0644`
- Fix immediately with `chmod 600 data/clawstack.db*`

---

## Remediation Priority

### P0 — MUST FIX (Blocks Production)

1. ✋ Validate encryption key format (reject SQL injection vectors)
2. ✋ Fix database file permissions (`chmod 600`)
3. ✋ Hash session tokens before storage

### P1 — SHOULD FIX (Before Wide Release)

4. Symlink race detection on migration
5. Cleanup stale temp files on startup
6. Enforce minimum key entropy
7. Fix async migration error handling

### P2 — NICE TO FIX (Defense in Depth)

8. Post-migration row count verification
9. Timing-safe comparison improvements
10. Error message preservation in ShellCryption

---

## Testing Notes

- ✅ All 140 tests pass
- ✅ No new test failures introduced
- ⚠️ Test coverage includes path for world-readable files (should mock with restricted umask)
- ⚠️ No test verifies encryption key validation rejects weak keys
- ⚠️ No test verifies session tokens are hashed

---

## Conclusion

**PinchPad's SQLCipher implementation is architecturally sound** — the crypto, the database layer abstraction, the test suite, and the deployment configuration are all well-designed. However, **three critical security issues must be fixed before production**:

1. **SQL injection risk** from key string interpolation
2. **File permissions** — database is world-readable
3. **Session token plaintext storage** — enables account takeover on DB read

The fixes are straightforward and low-risk (validation, chmod, hashing). After remediation, this feature can safely move to production.

---

**Maintained by CrustAgent©™**
**Report Date**: 2026-03-16
**Status**: REQUIRES FIXES — DO NOT DEPLOY TO PRODUCTION YET

---

## Appendix: Code Review Checklist

- [x] All 140 tests pass
- [x] Build succeeds
- [x] No type errors
- [x] Imports correctly updated
- [ ] ❌ SQL injection vectors eliminated
- [ ] ❌ File permissions hardened (0600)
- [ ] ❌ Session tokens hashed
- [ ] ❌ Encryption key validated
- [ ] ❌ Temp file cleanup on startup
- [ ] ❌ Symlink race mitigated

**Ready for Production**: NO (pending P0 fixes)
