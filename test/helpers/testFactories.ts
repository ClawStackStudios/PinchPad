import Database from 'better-sqlite3-multiple-ciphers';
import crypto from 'crypto';

/**
 * Domain types for test data factories.
 * These match PinchPad's real entities.
 */

export interface TestUser {
  uuid: string;
  username: string;
  keyHash: string;
  createdAt: string;
}

export interface TestLobsterKey {
  id: string;
  name: string;
  apiKey: string;
  apiKeyHash: string;
  permissions: Record<string, boolean>;
  expirationDate?: string;
  rateLimit?: number;
  isActive: boolean;
  createdAt: string;
}

export interface TestNote {
  id: string;
  userId: string;
  title: string;
  content: string;
  starred: boolean;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TestToken {
  key: string;
  keyHash: string;
  ownerUuid: string;
  ownerType: 'human' | 'agent';
  createdAt: string;
  expiresAt?: string | null;
}

/**
 * Creates a test user with optional overrides.
 */
export function createTestUser(
  db: Database.Database,
  overrides?: Partial<TestUser>
): TestUser {
  const uuid = overrides?.uuid ?? crypto.randomUUID();
  const username = overrides?.username ?? `user-${uuid.slice(0, 8)}`;
  const keyHash = overrides?.keyHash ?? crypto.createHash('sha256').update(`secret-${uuid}`).digest('hex');
  const createdAt = overrides?.createdAt ?? new Date().toISOString();

  db.prepare(
    'INSERT INTO users (uuid, username, key_hash, created_at) VALUES (?, ?, ?, ?)'
  ).run(uuid, username, keyHash, createdAt);

  return { uuid, username, keyHash, createdAt };
}

/**
 * Creates a test lobster (agent) key.
 * Note: agent_keys is tied to users via user_uuid.
 * SECURITY NOTE: The current implementation stores plain API keys in the database.
 * This is a security vulnerability that should be addressed in production.
 */
export function createTestLobsterKey(
  db: Database.Database,
  userId: string, // Required - agent_keys is tied to users
  overrides?: Partial<TestLobsterKey>
): TestLobsterKey {
  const id = overrides?.id ?? crypto.randomUUID();
  const name = overrides?.name ?? `Lobster Key ${id.slice(0, 8)}`;
  const apiKey = overrides?.apiKey ?? `lb-${crypto.randomBytes(32).toString('hex')}`;
  const apiKeyHash = overrides?.apiKeyHash ?? crypto.createHash('sha256').update(apiKey).digest('hex');
  const permissions = overrides?.permissions ?? { canRead: true };
  const expirationDate = overrides?.expirationDate ?? null;
  const rateLimit = overrides?.rateLimit ?? null;
  const isActive = overrides?.isActive ?? true;
  const createdAt = overrides?.createdAt ?? new Date().toISOString();

  // SECURITY WARNING: Storing plain API key - this matches current implementation
  // TODO: Implement hashing for API keys in production
  db.prepare(`
    INSERT INTO agent_keys (id, user_uuid, name, description, api_key, permissions, expiration_type, expiration_date, rate_limit, is_active, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    userId, // Required user_uuid
    name,
    null, // description
    apiKey, // Store plain key (matches current auth implementation)
    JSON.stringify(permissions),
    'never',
    expirationDate,
    rateLimit,
    isActive ? 1 : 0,
    createdAt
  );

  return {
    id,
    name,
    apiKey,
    apiKeyHash,
    permissions,
    expirationDate,
    rateLimit,
    isActive,
    createdAt,
  };
}

/**
 * Creates a test API token.
 * Used for authentication in tests.
 */
export function createTestToken(
  db: Database.Database,
  ownerUuid: string,
  ownerType: 'human' | 'agent' = 'human',
  overrides?: Partial<TestToken>
): TestToken {
  const key = overrides?.key ?? `api-${crypto.randomBytes(16).toString('hex')}`;
  const keyHash = overrides?.keyHash ?? crypto.createHash('sha256').update(key).digest('hex');
  const createdAt = overrides?.createdAt ?? new Date().toISOString();
  const expiresAt = overrides?.expiresAt ?? null;

  db.prepare(
    'INSERT INTO api_tokens (key, owner_key, owner_type, created_at, expires_at) VALUES (?, ?, ?, ?, ?)'
  ).run(key, ownerUuid, ownerType, createdAt, expiresAt);

  return { key, keyHash, ownerUuid, ownerType, createdAt, expiresAt };
}

/**
 * Creates a test note owned by a user.
 */
export function createTestNote(
  db: Database.Database,
  userId: string,
  overrides?: Partial<TestNote>
): TestNote {
  const id = overrides?.id ?? crypto.randomUUID();
  const title = overrides?.title ?? `Note ${Date.now()}`;
  const content = overrides?.content ?? 'Test content';
  const starred = overrides?.starred ?? false;
  const pinned = overrides?.pinned ?? false;
  const now = new Date().toISOString();
  const createdAt = overrides?.createdAt ?? now;
  const updatedAt = overrides?.updatedAt ?? now;

  db.prepare(
    'INSERT INTO notes (id, user_uuid, title, content, starred, pinned, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(id, userId, title, content, starred ? 1 : 0, pinned ? 1 : 0, createdAt, updatedAt);

  return { id, userId, title, content, starred, pinned, createdAt, updatedAt };
}

/**
 * Creates an audit log entry (for testing audit logging).
 */
export function createTestAuditLog(
  db: Database.Database,
  eventType: string,
  overrides?: Partial<any>
): any {
  const timestamp = overrides?.timestamp ?? new Date().toISOString();
  const actor = overrides?.actor ?? null;
  const actorType = overrides?.actorType ?? null;
  const ipAddress = overrides?.ipAddress ?? '127.0.0.1';
  const userAgent = overrides?.userAgent ?? null;
  const details = overrides?.details ?? null;

  const result = db.prepare(`
    INSERT INTO audit_logs (timestamp, event_type, actor, actor_type, ip_address, user_agent, details)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    timestamp,
    eventType,
    actor,
    actorType,
    ipAddress,
    userAgent,
    details ? JSON.stringify(details) : null
  );

  return { id: result.lastInsertRowid, timestamp, eventType, actor, actorType, ipAddress, userAgent, details };
}
