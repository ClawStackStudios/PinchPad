import express, { Express, RequestHandler } from 'express';
import Database from 'better-sqlite3-multiple-ciphers';
import crypto from 'crypto';
import authRoutes from '../../src/server/routes/auth';
import notesRoutes from '../../src/server/routes/notes';
import agentsRoutes from '../../src/server/routes/agents';
import { requireAuth } from '../../src/server/middleware/auth';
import { lobsterRateLimiter } from '../../src/server/middleware/rateLimiter';

export function createTestApp(): { app: Express; db: Database.Database } {
  const db = new Database(':memory:');

  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      uuid TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      display_name TEXT,
      key_hash TEXT UNIQUE NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS api_tokens (
      key TEXT PRIMARY KEY,
      owner_key TEXT NOT NULL,
      owner_type TEXT NOT NULL,
      lobster_key_id TEXT,
      expires_at TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (owner_key) REFERENCES users(uuid) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS lobster_keys (
      id TEXT PRIMARY KEY,
      user_uuid TEXT NOT NULL,
      name TEXT NOT NULL,
      api_key TEXT NOT NULL,
      api_key_hash TEXT UNIQUE,
      permissions TEXT NOT NULL,
      expiration_type TEXT NOT NULL,
      expiration_date TEXT,
      rate_limit INTEGER,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      last_used TEXT,
      FOREIGN KEY (user_uuid) REFERENCES users(uuid) ON DELETE CASCADE
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
      resource   TEXT,
      action     TEXT,
      outcome    TEXT,
      ip_address TEXT,
      user_agent TEXT,
      details    TEXT
    );
  `);

  const app = express();
  app.use(express.json());

  // In testing, we don't use the singleton db from database/index
  // because we want a clean in-memory DB for each test.
  // We need to ensure the routes use the injected DB.
  
  // NOTE: This requires the routes to check for req.db!
  // I need to add that back to the routes if I want tests to work.
  app.use((req: any, res, next) => {
    req.db = db;
    next();
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/notes', requireAuth() as RequestHandler, lobsterRateLimiter, notesRoutes);
  app.use('/api/agents', requireAuth() as RequestHandler, agentsRoutes);

  return { app, db };
}

export function createTestUser(db: Database.Database, username = 'testuser', keyHash?: string): string {
  const uuid = crypto.randomUUID();
  const hash = keyHash || crypto.createHash('sha256').update(`pass-${uuid}`).digest('hex');
  db.prepare('INSERT INTO users (uuid, username, key_hash, created_at) VALUES (?, ?, ?, ?)').run(
    uuid,
    username,
    hash,
    new Date().toISOString()
  );
  return uuid;
}

export function createTestToken(db: Database.Database, userUuid: string, type = 'human', lobsterKeyId: string | null = null): string {
  const token = `api-${Math.random().toString(36).slice(2, 34)}`;
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  db.prepare('INSERT INTO api_tokens (key, owner_key, owner_type, lobster_key_id, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(
    tokenHash,
    userUuid,
    type,
    lobsterKeyId,
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    new Date().toISOString()
  );
  return token;
}

export function createTestLobsterKey(
  db: Database.Database,
  userUuid: string,
  permissions: Record<string, boolean> = { canRead: true },
  rateLimit: number | null = null
): { id: string; apiKeyHash: string } {
  const id = crypto.randomUUID();
  const apiKey = `lb-${crypto.randomBytes(24).toString('hex')}`;
  const apiKeyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

  db.prepare(`
    INSERT INTO lobster_keys (id, user_uuid, name, api_key, api_key_hash, permissions, expiration_type, rate_limit, is_active, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    userUuid,
    'Test Lobster Key',
    apiKey,
    apiKeyHash,
    JSON.stringify(permissions),
    'never',
    rateLimit,
    1,
    new Date().toISOString()
  );

  return { id, apiKeyHash };
}
