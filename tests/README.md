# PinchPad Test Suite

Core tests for PinchPad using Vitest with jsdom and Node environments.

## Test Files

### 1. `lib/crypto.test.ts`
Tests for cryptographic utility functions.
- **generateBase62()** - generates random base62 strings of correct length, uses only valid charset
- **hashToken()** - produces consistent SHA-256 hashes, generates valid hex strings

**Environment:** jsdom (needed for window.crypto)
**Tests:** 6

### 2. `lib/shellCryption.test.ts`
Tests for field-level encryption/decryption with AES-GCM.
- **encryptField/decryptField** - round-trip encryption, AAD validation
- **deriveShellKey** - HKDF key derivation from hu-keys
- **Tamper detection** - rejects modified ciphertexts
- **Edge cases** - empty plaintext, large payloads

**Environment:** jsdom
**Tests:** 8

### 3. `services/authService.test.ts`
Tests for session management in localStorage.
- **readSession()** - reads and validates session data
- **Expiry handling** - detects and clears expired sessions
- **Partial data** - handles missing optional fields

**Environment:** jsdom (needs localStorage)
**Tests:** 6

### 4. `server/auth.test.ts`
Integration tests for auth routes with in-memory SQLite.
- **POST /api/auth/register** - user registration, duplicate detection
- **POST /api/auth/token** - token generation, credential validation
- **GET /api/auth/verify** - token verification, expiry checks
- **POST /api/auth/logout** - session cleanup

Uses Express app with in-memory database for testing.

**Environment:** jsdom
**Tests:** 10

## Running Tests

```bash
# Run all tests
npm test

# Watch mode
npm test:watch

# Coverage report
npm test:coverage
```

## Setup

- **vitest.config.ts** - configures jsdom for files that need it, v8 coverage
- **tests/setup.ts** - polyfills globalThis.crypto for Node environments
- **package.json** - includes vitest, jsdom, supertest, better-sqlite3

All 30 tests pass successfully.
