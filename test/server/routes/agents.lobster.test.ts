/// <reference types="vitest" />
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestApp, createTestUser, createTestToken, createTestAgentKey } from '../../shared/app';
import { Express } from 'express';
import Database from 'better-sqlite3-multiple-ciphers';
import crypto from 'crypto';

describe('Agents Routes (Lobster Keys)', () => {
  let app: Express;
  let db: Database.Database;
  let userUuid: string;
  let token: string;
  let keyId: string;

  beforeEach(() => {
    const testSetup = createTestApp();
    app = testSetup.app;
    db = testSetup.db;

    userUuid = createTestUser(db);
    token = createTestToken(db, userUuid);
    keyId = crypto.randomUUID();
  });

  describe('GET /api/agents', () => {
    it('returns empty array for new user', async () => {
      const res = await request(app)
        .get('/api/agents')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });

    it('returns lobster keys created by user', async () => {
      // Create a key
      const keyData = createTestAgentKey(db, userUuid, { canRead: true, canWrite: true });

      // Get keys
      const res = await request(app)
        .get('/api/agents')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].id).toBe(keyData.id);
      expect(res.body.data[0].name).toBe('Test Lobster Key');
    });

    it('returns keys ordered by created_at descending', async () => {
      // Create first key
      const key1 = createTestAgentKey(db, userUuid);

      // Wait a tiny bit
      await new Promise(resolve => setTimeout(resolve, 10));

      // Create second key
      const key2 = createTestAgentKey(db, userUuid);

      const res = await request(app)
        .get('/api/agents')
        .set('Authorization', `Bearer ${token}`);

      expect(res.body.data[0].id).toBe(key2.id);
      expect(res.body.data[1].id).toBe(key1.id);
    });

    it('requires authorization', async () => {
      const res = await request(app).get('/api/agents');
      expect(res.status).toBe(401);
    });

    it('requires human key type (human-only endpoint)', async () => {
      // Create a lobster key
      const lobsterKeyId = crypto.randomUUID();
      db.prepare(`
        INSERT INTO agent_keys (id, user_uuid, name, description, api_key, permissions, expiration_type, expiration_date, rate_limit, is_active, created_at, last_used)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        lobsterKeyId,
        userUuid,
        'Agent Key',
        null,
        crypto.createHash('sha256').update(`lb-${crypto.randomBytes(24).toString('hex')}`).digest('hex'), // Store hash
        JSON.stringify({ canRead: true }),
        'never',
        null,
        null,
        1,
        new Date().toISOString(),
        null
      );

      // Create token for agent key
      const agentToken = createTestToken(db, userUuid, 'agent', lobsterKeyId);

      const res = await request(app)
        .get('/api/agents')
        .set('Authorization', `Bearer ${agentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Forbidden: This area of the Reef requires Human identity');
    });
  });

  describe('POST /api/agents', () => {
    it('creates a new lobster key with required fields', async () => {
      const res = await request(app)
        .post('/api/agents')
        .set('Authorization', `Bearer ${token}`)
        .send({
          id: keyId,
          name: 'My Agent Key',
          permissions: { canRead: true, canWrite: true, canDelete: false },
          expiration_type: 'never',
          api_key: 'encrypted-key-xyz'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBe(keyId);
      expect(res.body.data.name).toBe('My Agent Key');
      expect(res.body.data.permissions).toEqual({ canRead: true, canWrite: true, canDelete: false });
      expect(res.body.data.expiration_type).toBe('never');
      expect(res.body.data.is_active).toBe(1);
    });

    it('stores permissions as JSON and retrieves them correctly', async () => {
      const permissions = {
        canRead: true,
        canWrite: false,
        canDelete: false,
        canManageKeys: true
      };

      const res = await request(app)
        .post('/api/agents')
        .set('Authorization', `Bearer ${token}`)
        .send({
          id: keyId,
          name: 'Test Key',
          permissions,
          expiration_type: 'never',
          api_key: 'encrypted'
        });

      expect(res.body.data.permissions).toEqual(permissions);

      // Verify in database as well
      const dbKey = db.prepare('SELECT permissions FROM agent_keys WHERE id = ?').get(keyId) as any;
      expect(JSON.parse(dbKey.permissions)).toEqual(permissions);
    });

    it('accepts optional rate_limit', async () => {
      const res = await request(app)
        .post('/api/agents')
        .set('Authorization', `Bearer ${token}`)
        .send({
          id: keyId,
          name: 'Rate Limited Key',
          permissions: { canRead: true },
          expiration_type: 'never',
          rate_limit: 100,
          api_key: 'encrypted'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.rate_limit).toBe(100);
    });

    it('accepts optional expiration_date', async () => {
      const expirationDate = '2026-12-31T23:59:59Z';

      const res = await request(app)
        .post('/api/agents')
        .set('Authorization', `Bearer ${token}`)
        .send({
          id: keyId,
          name: 'Expiring Key',
          permissions: { canRead: true },
          expiration_type: 'custom',
          expiration_date: expirationDate,
          api_key: 'encrypted'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.expiration_date).toBe(expirationDate);
    });

    it('requires id, name, permissions, expiration_type, api_key_hash, api_key', async () => {
      const res = await request(app)
        .post('/api/agents')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Incomplete Key'
          // Missing required fields
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Validation Error');
    });

    it('requires human key type (human-only endpoint)', async () => {
      const lobsterKeyId = crypto.randomUUID();
      db.prepare(`
        INSERT INTO agent_keys (id, user_uuid, name, description, api_key, permissions, expiration_type, expiration_date, rate_limit, is_active, created_at, last_used)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        lobsterKeyId,
        userUuid,
        'Agent Key',
        null,
        crypto.createHash('sha256').update(`lb-${crypto.randomBytes(24).toString('hex')}`).digest('hex'), // Store hash
        JSON.stringify({ canRead: true }),
        'never',
        null,
        null,
        1,
        new Date().toISOString(),
        null
      );

      const agentToken = createTestToken(db, userUuid, 'agent', lobsterKeyId);

      const res = await request(app)
        .post('/api/agents')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          id: keyId,
          name: 'Should Fail',
          permissions: { canRead: true },
          expiration_type: 'never',
          api_key: 'encrypted'
        });

      expect(res.status).toBe(403);
    });

    it('returns encrypted key in response (not hash)', async () => {
      const encryptedKey = 'encrypted-secret-key-xyz';

      const res = await request(app)
        .post('/api/agents')
        .set('Authorization', `Bearer ${token}`)
        .send({
          id: keyId,
          name: 'Test Key',
          permissions: { canRead: true },
          expiration_type: 'never',
          api_key: encryptedKey
        });

      expect(res.body.data.api_key).toBe(encryptedKey);
    });
  });

  describe('PUT /api/agents/:id/revoke', () => {
    it('revokes an active lobster key', async () => {
      // Create a key
      const keyData = createTestAgentKey(db, userUuid);

      // Verify it's active
      let dbKey = db.prepare('SELECT is_active FROM agent_keys WHERE id = ?').get(keyData.id) as any;
      expect(dbKey.is_active).toBe(1);

      // Revoke it
      const res = await request(app)
        .put(`/api/agents/${keyData.id}/revoke`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.success).toBe(true);

      // Verify it's inactive
      dbKey = db.prepare('SELECT is_active FROM agent_keys WHERE id = ?').get(keyData.id) as any;
      expect(dbKey.is_active).toBe(0);
    });

    it('returns 404 for non-existent key', async () => {
      const res = await request(app)
        .put(`/api/agents/nonexistent/revoke`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/not found/i);
    });

    it('requires authorization', async () => {
      const res = await request(app)
        .put(`/api/agents/${keyId}/revoke`);

      expect(res.status).toBe(401);
    });

    it('requires human key type', async () => {
      // Create a lobster key
      const lobsterKeyId = crypto.randomUUID();
      db.prepare(`
        INSERT INTO agent_keys (id, user_uuid, name, description, api_key, permissions, expiration_type, expiration_date, rate_limit, is_active, created_at, last_used)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        lobsterKeyId,
        userUuid,
        'Agent Key',
        null,
        crypto.createHash('sha256').update(`lb-${crypto.randomBytes(24).toString('hex')}`).digest('hex'), // Store hash
        JSON.stringify({ canRead: true }),
        'never',
        null,
        null,
        1,
        new Date().toISOString(),
        null
      );

      const agentToken = createTestToken(db, userUuid, 'agent', lobsterKeyId);

      // Try to revoke with agent token
      const res = await request(app)
        .put(`/api/agents/${keyId}/revoke`)
        .set('Authorization', `Bearer ${agentToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('Cross-user isolation', () => {
    it('prevents user A from listing user B keys', async () => {
      const userB = createTestUser(db, 'userb');
      const tokenB = createTestToken(db, userB);

      // User A creates a key
      createTestAgentKey(db, userUuid);

      // User B lists keys
      const res = await request(app)
        .get('/api/agents')
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.body.data).toHaveLength(0);
    });

    it('prevents user A from revoking user B keys', async () => {
      const userB = createTestUser(db, 'userb');
      const tokenB = createTestToken(db, userB);

      // User A creates a key
      const keyData = createTestAgentKey(db, userUuid);

      // User B tries to revoke it
      const res = await request(app)
        .put(`/api/agents/${keyData.id}/revoke`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(404);

      // Verify it's still active for user A
      const dbKey = db.prepare('SELECT is_active FROM agent_keys WHERE id = ?').get(keyData.id) as any;
      expect(dbKey.is_active).toBe(1);
    });
  });

  describe('Rate limit handling', () => {
    it('accepts null rate_limit', async () => {
      const res = await request(app)
        .post('/api/agents')
        .set('Authorization', `Bearer ${token}`)
        .send({
          id: keyId,
          name: 'Unlimited Key',
          permissions: { canRead: true },
          expiration_type: 'never',
          rate_limit: null,
          api_key: 'encrypted'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.rate_limit).toBeNull();
    });

    it('stores numeric rate_limit', async () => {
      const rateLimit = 1000;
      const res = await request(app)
        .post('/api/agents')
        .set('Authorization', `Bearer ${token}`)
        .send({
          id: keyId,
          name: 'Limited Key',
          permissions: { canRead: true },
          expiration_type: 'never',
          rate_limit: rateLimit,
          api_key: 'encrypted'
        });

      expect(res.body.data.rate_limit).toBe(rateLimit);

      // Verify in database
      const dbKey = db.prepare('SELECT rate_limit FROM agent_keys WHERE id = ?').get(keyId) as any;
      expect(dbKey.rate_limit).toBe(rateLimit);
    });
  });

  describe('Expiration handling', () => {
    it('accepts never expiration type', async () => {
      const res = await request(app)
        .post('/api/agents')
        .set('Authorization', `Bearer ${token}`)
        .send({
          id: keyId,
          name: 'Never Expire',
          permissions: { canRead: true },
          expiration_type: 'never',
          api_key: 'encrypted'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.expiration_type).toBe('never');
      expect(res.body.data.expiration_date).toBeUndefined();
    });

    it('accepts date expiration type with expiration_date', async () => {
      const expirationDate = '2027-06-30T23:59:59Z';

      const res = await request(app)
        .post('/api/agents')
        .set('Authorization', `Bearer ${token}`)
        .send({
          id: keyId,
          name: 'Expiring Soon',
          permissions: { canRead: true },
          expiration_type: 'custom',
          expiration_date: expirationDate,
          api_key: 'encrypted'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.expiration_type).toBe('custom');
      expect(res.body.data.expiration_date).toBe(expirationDate);
    });

    it('allows null expiration_date when using never type', async () => {
      const res = await request(app)
        .post('/api/agents')
        .set('Authorization', `Bearer ${token}`)
        .send({
          id: keyId,
          name: 'No Expiry',
          permissions: { canRead: true },
          expiration_type: 'never',
          expiration_date: null,
          api_key: 'encrypted'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.expiration_date).toBeNull();
    });
  });

  describe('Timestamps and metadata', () => {
    it('sets created_at on key creation', async () => {
      const beforeTime = new Date();
      const res = await request(app)
        .post('/api/agents')
        .set('Authorization', `Bearer ${token}`)
        .send({
          id: keyId,
          name: 'Timestamped Key',
          permissions: { canRead: true },
          expiration_type: 'never',
          api_key: 'encrypted'
        });
      const afterTime = new Date();

      expect(res.body.data.created_at).toBeDefined();

      const createdAt = new Date(res.body.data.created_at);
      expect(createdAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(createdAt.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });

    it('returns key metadata in GET response', async () => {
      const keyData = createTestAgentKey(db, userUuid, { canRead: true, canWrite: true });

      const res = await request(app)
        .get('/api/agents')
        .set('Authorization', `Bearer ${token}`);

      const key = res.body.data[0];
      expect(key.id).toBeDefined();
      expect(key.name).toBeDefined();
      expect(key.permissions).toBeDefined();
      expect(key.expiration_type).toBeDefined();
      expect(key.rate_limit).toBeDefined();
      expect(key.is_active).toBeDefined();
      expect(key.created_at).toBeDefined();
      expect(key.last_used).toBeDefined();

      // Verify api_key is NOT returned in GET response (security)
      expect(key.api_key).toBeUndefined();
    });
  });

  describe('Security - Sensitive data exclusion', () => {
    it.skip('excludes api_key_hash from GET response', async () => {
      // SKIPPED: api_key_hash column removed from schema
      createTestAgentKey(db, userUuid);

      const res = await request(app)
        .get('/api/agents')
        .set('Authorization', `Bearer ${token}`);

      expect(res.body.data[0].api_key_hash).toBeUndefined();
    });

    it.skip('excludes api_key_hash from POST response', async () => {
      // SKIPPED: api_key_hash column removed from schema
      const res = await request(app)
        .post('/api/agents')
        .set('Authorization', `Bearer ${token}`)
        .send({
          id: keyId,
          name: 'Secure Key',
          permissions: { canRead: true },
          expiration_type: 'never',
          api_key: 'encrypted-value'
        });

      expect(res.body.data.api_key_hash).toBeUndefined();
    });

    it('returns encrypted key value in POST response (for user backup)', async () => {
      const encryptedKey = 'the-encrypted-secret';

      const res = await request(app)
        .post('/api/agents')
        .set('Authorization', `Bearer ${token}`)
        .send({
          id: keyId,
          name: 'Backup Key',
          permissions: { canRead: true },
          expiration_type: 'never',
          api_key: encryptedKey
        });

      // POST returns encrypted key for user to save
      expect(res.body.data.api_key).toBe(encryptedKey);
    });
  });
});
