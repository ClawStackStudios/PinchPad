import express, { Express } from 'express';
import Database from 'better-sqlite3-multiple-ciphers';
import crypto from 'crypto';

// Need to set NODE_ENV before importing any server modules
process.env.NODE_ENV = 'test';
process.env.AUTH_RATE_LIMIT = '1000';
process.env.API_RATE_LIMIT = '1000';

import db from '../../src/server/database/index';
import authRoutes from '../../src/server/routes/auth';
import notesRoutes from '../../src/server/routes/notes';
import agentsRoutes from '../../src/server/routes/agents';
import potsRoutes from '../../src/server/routes/pots';
import photosRoutes from '../../src/server/routes/photos';
import lobsterSessionRoutes from '../../src/server/routes/lobsterSession';
import { requireAuth } from '../../src/server/middleware/auth';
import { createAgentKeyRateLimiter, apiLimiter } from '../../src/server/middleware/rateLimiter';

export function createTestApp(): { app: Express; db: Database.Database } {
  // Database schema is already initialized by ../../src/server/database/index.ts
  // because runMigrations and initializeSchema run automatically.
  // We just need to clear all tables to ensure a clean slate for tests.
  
  // Clear tables
  db.exec(`
    DELETE FROM import_sessions;
    DELETE FROM pearl_photos;
    DELETE FROM pots;
    DELETE FROM notes;
    DELETE FROM agent_keys;
    DELETE FROM api_tokens;
    DELETE FROM users;
    DELETE FROM audit_logs;
  `);

  const app = express();
  app.use(express.json());
  
  app.use('/api', apiLimiter);
  app.use('/api/auth', authRoutes);
  app.use('/api/notes', notesRoutes);
  app.use('/api/agents', agentsRoutes);
  app.use('/api/pots', potsRoutes);
  app.use('/api/photos', photosRoutes);
  app.use('/api/lobster-session', lobsterSessionRoutes);

  return { app, db };
}

export function createTestUser(db: Database.Database, username = 'testuser', keyHash?: string): string {
  const uuid = crypto.randomUUID();
  const hash = keyHash || crypto.createHash('sha256').update(`pass-${uuid}`).digest('hex');
  db.prepare('INSERT INTO users (uuid, username, key_hash, created_at) VALUES (?, ?, ?, ?)').run(
    uuid, username, hash, new Date().toISOString()
  );
  return uuid;
}

export function createTestToken(db: Database.Database, userUuid: string, type = 'human', agentKeyId: string | null = null): string {
  const token = `api-${Math.random().toString(36).slice(2, 34)}`;
  let ownerKey = userUuid;
  let ownerType = type;

  if (type === 'agent' && agentKeyId) {
    const agent = db.prepare('SELECT api_key FROM agent_keys WHERE id = ?').get(agentKeyId) as any;
    if (agent) {
      ownerKey = agent.api_key;
    }
  }

  db.prepare('INSERT INTO api_tokens (key, owner_key, owner_type, created_at) VALUES (?, ?, ?, ?)').run(
    token, ownerKey, ownerType, new Date().toISOString()
  );
  return token;
}

export function createTestAgentKey(
  db: Database.Database,
  userUuid: string,
  permissions: Record<string, boolean> = { canRead: true },
  rateLimit: number | null = null
): { id: string; apiKey: string; apiKeyHash: string } {
  const id = crypto.randomUUID();
  const apiKey = `lb-${crypto.randomBytes(24).toString('hex')}`;
  const apiKeyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

  db.prepare(`
    INSERT INTO agent_keys (id, user_uuid, name, description, api_key, permissions, expiration_type, expiration_date, rate_limit, is_active, created_at, last_used)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    userUuid,
    'Test Lobster Key',
    'Test key for testing',
    apiKey, // Store the plain key
    JSON.stringify(permissions),
    'never',
    null,
    rateLimit,
    1,
    new Date().toISOString(),
    null
  );

  return { id, apiKey, apiKeyHash };
}
