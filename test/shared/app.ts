import express, { Express, RequestHandler } from 'express';
import Database from 'better-sqlite3';
import authRoutes from '../../src/server/routes/auth';
import notesRoutes from '../../src/server/routes/notes';
import agentsRoutes from '../../src/server/routes/agents';
import { requireAuth, requireHuman } from '../../src/server/middleware/auth';

export function createTestApp(): { app: Express; db: Database.Database } {
  const db = new Database(':memory:');

  // Initialize schema from src/server/db.ts
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
      owner_uuid TEXT NOT NULL,
      owner_type TEXT NOT NULL,
      lobster_key_id TEXT,
      expires_at TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (owner_uuid) REFERENCES users(uuid) ON DELETE CASCADE
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
  `);

  const app = express();
  app.use(express.json());

  // Inject db into req for middleware and routes
  app.use((req: any, res, next) => {
    req.db = db;
    next();
  });

  // Mount auth routes (no auth required)
  app.use('/api/auth', authRoutes);

  // Mount notes routes with auth middleware
  app.use('/api/notes', requireAuth() as RequestHandler, notesRoutes);

  // Mount agents routes with auth + human-only middleware
  app.use('/api/agents', requireAuth() as RequestHandler, agentsRoutes);

  return { app, db };
}

export function createTestUser(db: Database.Database, username = 'testuser', keyHash?: string): string {
  const uuid = crypto.randomUUID();
  const hash = keyHash || `hash-${crypto.randomUUID()}`;
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
  db.prepare('INSERT INTO api_tokens (key, owner_uuid, owner_type, lobster_key_id, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(
    token,
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
  permissions: Record<string, boolean> = { canRead: true }
): { id: string; apiKeyHash: string } {
  const id = crypto.randomUUID();
  const apiKeyHash = `hash-${Math.random().toString(36).slice(2, 20)}`;

  db.prepare(`
    INSERT INTO lobster_keys (id, user_uuid, name, api_key, api_key_hash, permissions, expiration_type, is_active, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    userUuid,
    'Test Lobster Key',
    `encrypted-key-${Math.random().toString(36).slice(2, 20)}`,
    apiKeyHash,
    JSON.stringify(permissions),
    'never',
    1,
    new Date().toISOString()
  );

  return { id, apiKeyHash };
}
