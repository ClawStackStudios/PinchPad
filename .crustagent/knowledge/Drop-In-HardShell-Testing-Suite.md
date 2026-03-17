# HardShell Testing Suite — Drop-In Implementation Guide

**Framework:** Inspired by Ken Lasko's Monize testing patterns, adapted for Express + SQLite
**Status:** Production-ready, battle-tested in ClawChives
**Effort:** 2–4 hours to integrate into new project
**Benefit:** Eliminates test setup boilerplate, prevents test pollution, ensures consistency

---

## What is HardShell?

HardShell is a **test infrastructure layer** consisting of three modular helper utilities:

1. **testDb.ts** — Isolated database creation & cleanup
2. **testFactories.ts** — Realistic test data generation
3. **testAuth.ts** — Token generation & authentication helpers

Together, they eliminate the need to mock the database or manually set up test users/tokens. Your tests interact with a **real, isolated SQLite database** that mirrors production schema.

**Philosophy:** Tests should be:
- ✅ **Isolated** — Each test gets a fresh database
- ✅ **Realistic** — Using real schema, real constraints, real data flows
- ✅ **Fast** — SQLite in-memory or local SSD, no network delays
- ✅ **Maintainable** — Reusable factories, not copy-pasted setup code
- ✅ **Composable** — Chain helpers for complex scenarios

---

## Prerequisites

### Required Dependencies

```json
{
  "dependencies": {
    "express": "^5.2.1",
    "better-sqlite3-multiple-ciphers": "^9.1.1",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "vitest": "^4.0.18",
    "supertest": "^7.2.2",
    "@types/express": "^5.0.6",
    "@types/node": "^25.3.3"
  }
}
```

### Assumed Project Structure

```
your-project/
├── src/
│   ├── server/
│   │   ├── db.ts                    (your SQLite database module)
│   │   ├── middleware/              (auth, error handling, validation)
│   │   └── routes/                  (API endpoints)
│   └── services/
├── tests/
│   ├── helpers/                     (← You'll create these three files)
│   │   ├── testDb.ts
│   │   ├── testFactories.ts
│   │   └── testAuth.ts
│   ├── unit/                        (existing unit tests)
│   ├── integration/                 (← New integration tests)
│   └── data/                        (← Auto-created test database files)
├── vitest.config.ts
└── package.json
```

---

## Step 1: Create testDb.ts

**File:** `tests/helpers/testDb.ts`

This module handles test database lifecycle:
- Creates a fresh, isolated SQLite database for each test run
- Applies the same schema as production
- Supports database encryption (if using SQLCipher)
- Provides cleanup and reset utilities

```typescript
import Database from 'better-sqlite3-multiple-ciphers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Creates a fresh, isolated test database for each test run.
 * The database is created in tests/data/test-*.sqlite with a unique name.
 * All schema and migrations are applied automatically.
 */
export function createTestDatabase(): Database.Database {
  const testDataDir = path.join(__dirname, '..', 'data');

  // Create data directory if it doesn't exist
  if (!fs.existsSync(testDataDir)) {
    fs.mkdirSync(testDataDir, { recursive: true });
  }

  // Create a unique test database file for this test session
  const timestamp = Date.now();
  const testDbPath = path.join(testDataDir, `test-${timestamp}.sqlite`);

  // Clean up old test db if it somehow exists
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }

  // Create database
  const db = new Database(testDbPath);

  // Apply encryption key if provided (same as production)
  const encryptionKey = process.env.DB_ENCRYPTION_KEY;
  if (encryptionKey) {
    db.pragma(`key = '${encryptionKey}'`);
  }

  // Run schema (same as production db.ts)
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // ────────────────────────────────────────────────────────────────────────────
  // TODO: Replace this with YOUR project's schema
  // Copy the db.exec() block from your src/server/db.ts
  // ────────────────────────────────────────────────────────────────────────────

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id          TEXT PRIMARY KEY,
      email       TEXT NOT NULL UNIQUE,
      name        TEXT,
      created_at  TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS items (
      id          TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL,
      title       TEXT NOT NULL,
      created_at  TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Create indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_items_user_id ON items(user_id);
  `);

  return db;
}

/**
 * Cleanly closes and removes the test database.
 * Call this in afterAll() or afterEach() to prevent test pollution.
 */
export function cleanupTestDatabase(db: Database.Database, testDbPath?: string): void {
  try {
    db.close();
  } catch (err) {
    console.error('[TestDb] Error closing database:', err);
  }

  // If path not provided, try to infer it from the database filename
  if (!testDbPath) {
    // Database filename is stored internally; we'll just skip file cleanup
    // in this case to avoid errors
    return;
  }

  try {
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  } catch (err) {
    console.error('[TestDb] Error removing test database file:', err);
  }
}

/**
 * Clears all data from the test database without closing it.
 * Useful for resetting state between tests while keeping the database connection open.
 */
export function resetTestDatabase(db: Database.Database): void {
  try {
    // Disable foreign key constraints temporarily to allow deletion order flexibility
    db.pragma('foreign_keys = OFF');

    // Delete all data in reverse dependency order
    db.prepare('DELETE FROM items').run();
    db.prepare('DELETE FROM users').run();

    // Re-enable foreign key constraints
    db.pragma('foreign_keys = ON');
  } catch (err) {
    console.error('[TestDb] Error resetting database:', err);
    throw err;
  }
}
```

**Key Points:**
- Generates a unique database filename with `Date.now()` to avoid collisions
- Applies the same schema as your production database
- Supports encryption key (if you're using SQLCipher)
- `resetTestDatabase()` respects foreign key constraints (deletes in dependency order)

---

## Step 2: Create testFactories.ts

**File:** `tests/helpers/testFactories.ts`

Factory functions for creating realistic test data. Each factory inserts directly into the database and returns typed data.

```typescript
import Database from 'better-sqlite3-multiple-ciphers';
import { v4 as uuidv4 } from 'uuid';

/**
 * Factory functions for creating test data.
 * These functions insert records directly into the test database,
 * allowing tests to set up realistic scenarios quickly.
 */

// ────────────────────────────────────────────────────────────────────────────
// TODO: Replace these with YOUR project's domain entities
// ────────────────────────────────────────────────────────────────────────────

export interface TestUser {
  id: string;
  email: string;
  name?: string;
  createdAt: string;
}

export interface TestItem {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
}

/**
 * Creates a test user with generated UUID and email.
 * Returns the user data for use in token generation.
 */
export function createTestUser(
  db: Database.Database,
  overrides?: Partial<TestUser>
): TestUser {
  const id = overrides?.id ?? uuidv4();
  const email = overrides?.email ?? `user-${id.slice(0, 8)}@test.local`;
  const name = overrides?.name ?? `Test User ${id.slice(0, 8)}`;
  const createdAt = overrides?.createdAt ?? new Date().toISOString();

  db.prepare(
    'INSERT INTO users (id, email, name, created_at) VALUES (?, ?, ?, ?)'
  ).run(id, email, name, createdAt);

  return { id, email, name, createdAt };
}

/**
 * Creates a test item owned by a user.
 * Requires that the user already exists.
 */
export function createTestItem(
  db: Database.Database,
  userId: string,
  overrides?: Partial<TestItem>
): TestItem {
  const id = overrides?.id ?? uuidv4();
  const title = overrides?.title ?? `Test Item ${Date.now()}`;
  const createdAt = overrides?.createdAt ?? new Date().toISOString();

  db.prepare(
    'INSERT INTO items (id, user_id, title, created_at) VALUES (?, ?, ?, ?)'
  ).run(id, userId, title, createdAt);

  return { id, userId, title, createdAt };
}
```

**Key Points:**
- Return types mirror your domain entities
- Each factory has an `overrides` parameter for customization
- Factories use `uuidv4()` for unique IDs
- All factories return the inserted data (useful for assertions)

**Example Usage:**
```typescript
const user = createTestUser(db, { email: 'admin@test.local' });
const item = createTestItem(db, user.id, { title: 'Custom Title' });
```

---

## Step 3: Create testAuth.ts

**File:** `tests/helpers/testAuth.ts`

Authentication helpers for generating tokens and setting up authenticated scenarios.

```typescript
import Database from 'better-sqlite3-multiple-ciphers';
import request from 'supertest';
import { Express } from 'express';
import { createTestUser, TestUser } from './testFactories.js';

/**
 * Authentication helpers for tests.
 * These functions handle token generation and user setup for API testing.
 */

/**
 * Gets a session token for a given user.
 * Used to authenticate subsequent API requests.
 */
export async function getAuthToken(
  app: Express,
  userId: string
): Promise<string> {
  const res = await request(app)
    .post('/api/auth/token')
    .send({ userId });

  if (res.status !== 201 || !res.body.data?.token) {
    throw new Error(
      `Failed to get token: ${res.status} ${JSON.stringify(res.body)}`
    );
  }

  return res.body.data.token;
}

/**
 * Creates a test user in the database and returns auth credentials.
 * Combines user factory + token generation for convenient test setup.
 */
export async function createTestUserWithToken(
  app: Express,
  db: Database.Database,
  userOverrides?: Partial<TestUser>
): Promise<{ user: TestUser; token: string }> {
  const user = createTestUser(db, userOverrides);
  const token = await getAuthToken(app, user.id);

  return { user, token };
}
```

**Key Points:**
- `getAuthToken()` calls your real auth endpoint (not mocked)
- `createTestUserWithToken()` combines factory + token for one-liner setup
- Works with your actual Express app instance (passed via test fixture)

---

## Step 4: Configure Vitest

**File:** `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 10000,
    hookTimeout: 10000,
    isolate: true,
    // Optional: use threads for better isolation
    threads: true,
    // Optional: clean up databases after all tests
    teardownTimeout: 10000,
  },
});
```

---

## Step 5: Write Your First Integration Test

**File:** `tests/integration/bookmarks.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Database from 'better-sqlite3-multiple-ciphers';
import request from 'supertest';
import { Express } from 'express';
import { createTestDatabase, cleanupTestDatabase } from '../helpers/testDb.js';
import { createTestUserWithToken } from '../helpers/testAuth.js';
import { createTestBookmark } from '../helpers/testFactories.js';
import app from '../../src/server.js';  // Your Express app

describe('Bookmarks API', () => {
  let db: Database.Database;
  let testDbPath: string;

  beforeAll(async () => {
    db = createTestDatabase();
    testDbPath = db.name;  // Store path for cleanup
  });

  afterAll(async () => {
    cleanupTestDatabase(db, testDbPath);
  });

  describe('GET /api/bookmarks', () => {
    it('returns empty array for new user', async () => {
      const { user, token } = await createTestUserWithToken(app, db);

      const res = await request(app)
        .get('/api/bookmarks')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });

    it('returns bookmarks for authenticated user', async () => {
      const { user, token } = await createTestUserWithToken(app, db);
      const bookmark = createTestBookmark(db, user.id, {
        title: 'Example',
        url: 'https://example.com',
      });

      const res = await request(app)
        .get('/api/bookmarks')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].title).toBe('Example');
    });

    it('does not return other users bookmarks', async () => {
      const { token: token1 } = await createTestUserWithToken(app, db);
      const { user: user2 } = await createTestUserWithToken(app, db);

      createTestBookmark(db, user2.id);

      const res = await request(app)
        .get('/api/bookmarks')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(0);
    });
  });

  describe('POST /api/bookmarks', () => {
    it('creates a bookmark', async () => {
      const { user, token } = await createTestUserWithToken(app, db);

      const res = await request(app)
        .post('/api/bookmarks')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'New Bookmark',
          url: 'https://test.com',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe('New Bookmark');

      // Verify it was actually inserted
      const stored = db.prepare('SELECT * FROM bookmarks WHERE id = ?').get(res.body.data.id);
      expect(stored).toBeDefined();
    });
  });
});
```

---

## Usage Patterns

### Pattern 1: Single User, Multiple Resources

```typescript
it('user can organize bookmarks in folders', async () => {
  const { user, token } = await createTestUserWithToken(app, db);

  const folder = createTestFolder(db, user.id, { name: 'Reading List' });
  const bookmark = createTestBookmark(db, user.id, { folderId: folder.id });

  const res = await request(app)
    .get(`/api/folders/${folder.id}/bookmarks`)
    .set('Authorization', `Bearer ${token}`);

  expect(res.body.data).toHaveLength(1);
  expect(res.body.data[0].id).toBe(bookmark.id);
});
```

### Pattern 2: Multi-User Isolation

```typescript
it('prevents cross-user access', async () => {
  const { token: token1 } = await createTestUserWithToken(app, db);
  const { user: user2 } = await createTestUserWithToken(app, db);

  const folder = createTestFolder(db, user2.id);

  const res = await request(app)
    .get(`/api/folders/${folder.id}`)
    .set('Authorization', `Bearer ${token1}`);

  expect(res.status).toBe(403);
});
```

### Pattern 3: Error Condition Testing

```typescript
it('rejects duplicate bookmarks', async () => {
  const { user, token } = await createTestUserWithToken(app, db);

  const bookmark1 = createTestBookmark(db, user.id, {
    url: 'https://unique.com',
  });

  const res = await request(app)
    .post('/api/bookmarks')
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: 'Duplicate',
      url: 'https://unique.com',
    });

  expect(res.status).toBe(409);  // Conflict
  expect(res.body.error).toContain('already exists');
});
```

### Pattern 4: Agent/API Key Testing

```typescript
it('agent can read bookmarks with proper token', async () => {
  const { user, humanToken } = await createTestUserWithAgent(app, db);
  const bookmark = createTestBookmark(db, user.id);

  const res = await request(app)
    .get('/api/bookmarks')
    .set('Authorization', `Bearer ${agentToken}`);

  expect(res.status).toBe(200);
  expect(res.body.data).toHaveLength(1);
});
```

---

## Testing the Four HardShell Phases

HardShell defines four testing phases. Use this structure to organize tests:

### Phase 1: Unit Tests (Happy Path)
```
tests/unit/
├── services/
│   ├── bookmarkService.test.ts
│   ├── authService.test.ts
│   └── folderService.test.ts
└── middleware/
    ├── auth.test.ts
    └── errorHandler.test.ts
```

### Phase 2: Integration Tests (API Contracts)
```
tests/integration/
├── bookmarks.test.ts
├── folders.test.ts
├── auth.test.ts
└── agentKeys.test.ts
```

### Phase 3: Error Path Tests (Edge Cases)
```
tests/errors/
├── auth.errors.test.ts      # Invalid tokens, expired tokens, locked accounts
├── validation.errors.test.ts  # Malformed input, constraint violations
└── constraints.errors.test.ts  # Foreign key failures, duplicate keys
```

### Phase 4: Security Tests (Attack Vectors)
```
tests/security/
├── auth.security.test.ts     # Timing attacks, token reuse, brute force
├── isolation.security.test.ts  # Cross-user access, privilege escalation
└── injection.security.test.ts  # SQL injection (parameterized queries prevent this)
```

---

## Example: ClawChives Error Handler Tests

ClawChives error handler tests demonstrate comprehensive error categorization:

```typescript
// tests/unit/middleware/errorHandler.test.ts
describe('Error Handler', () => {
  it('returns 409 for UNIQUE constraint violation', () => {
    const err = new Error('UNIQUE constraint failed: users.username');
    errorHandler(err, mockReq, mockRes, vi.fn());
    expect(mockRes.status).toHaveBeenCalledWith(409);
  });

  it('returns 400 for FOREIGN KEY constraint violation', () => {
    const err = new Error('FOREIGN KEY constraint failed: bookmarks.folder_id');
    errorHandler(err, mockReq, mockRes, vi.fn());
    expect(mockRes.status).toHaveBeenCalledWith(400);
  });

  it('hides error details in production', () => {
    process.env.NODE_ENV = 'production';
    const err = new Error('Sensitive internal error');
    errorHandler(err, mockReq, mockRes, vi.fn());

    const response = mockRes.json.mock.calls[0][0];
    expect(response.error).not.toContain('Sensitive');
    expect(response.stack).toBeUndefined();
  });
});
```

---

## Troubleshooting

### Issue: "Cannot find module 'better-sqlite3-multiple-ciphers'"
**Solution:** Run `npm install better-sqlite3-multiple-ciphers` (includes native build)

### Issue: "Timeout: test took longer than 10000ms"
**Solution:** Increase `testTimeout` in vitest.config.ts, or optimize database setup

### Issue: "Foreign key constraint failed" on cleanup
**Solution:** Ensure `resetTestDatabase()` deletes in dependency order (children before parents)

### Issue: "Database is locked"
**Solution:** SQLite doesn't support concurrent writes. Tests should run sequentially (Vitest default)

### Issue: "Test database files accumulating in tests/data/"
**Solution:** Add `.gitignore` entry: `tests/data/test-*.sqlite*`

---

## Performance Tips

1. **Use `resetTestDatabase()` instead of creating new DB per test**
   ```typescript
   // ✅ Fast: reuse database, reset between tests
   beforeEach(() => resetTestDatabase(db));

   // ❌ Slow: create new database for every test
   beforeEach(() => { db = createTestDatabase(); });
   ```

2. **Use in-memory databases for pure unit tests**
   ```typescript
   const db = new Database(':memory:');
   ```

3. **Batch setup in `beforeAll()`, not `beforeEach()`**
   ```typescript
   beforeAll(() => {
     // Create 100 test users once
     for (let i = 0; i < 100; i++) {
       createTestUser(db);
     }
   });
   ```

4. **Use transactions for related operations**
   ```typescript
   // Insert 10 bookmarks in one transaction
   db.exec('BEGIN');
   for (let i = 0; i < 10; i++) {
     createTestBookmark(db, userId);
   }
   db.exec('COMMIT');
   ```

---

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm install
      - run: npm test
      - run: rm -rf tests/data/test-*.sqlite*  # Clean up
```

### GitLab CI Example

```yaml
test:
  image: node:20
  script:
    - npm install
    - npm test
  after_script:
    - rm -rf tests/data/test-*.sqlite*
```

---

## Checklist for Integration

- [ ] Copy `testDb.ts` to `tests/helpers/testDb.ts`
- [ ] Replace schema in `db.exec()` with YOUR database schema
- [ ] Copy `testFactories.ts` to `tests/helpers/testFactories.ts`
- [ ] Customize factories for YOUR domain entities
- [ ] Copy `testAuth.ts` to `tests/helpers/testAuth.ts`
- [ ] Update token generation to match YOUR auth endpoint
- [ ] Configure `vitest.config.ts` with test timeout settings
- [ ] Write first integration test (reference examples above)
- [ ] Run `npm test` and verify all tests pass
- [ ] Add `.gitignore` entry: `tests/data/test-*.sqlite*`
- [ ] Commit with message: `test: Integrate HardShell testing suite`

---

## Next Steps

1. **Phase 1 (Done):** Unit tests for services and middleware
2. **Phase 2 (Next):** Integration tests for API endpoints
3. **Phase 3:** Error path tests for constraint violations and edge cases
4. **Phase 4:** Security tests for auth, isolation, and injection vulnerabilities

See `.crustagent/knowledge/SECURITY_COMPARISON_KEN_VS_LUCAS.md` for security testing patterns.

---

**Maintained by CrustAgent©™**
