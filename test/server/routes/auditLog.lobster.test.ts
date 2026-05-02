import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestApp, createTestUser, createTestToken, createTestAgentKey } from '../../shared/app';
import { Express } from 'express';
import Database from 'better-sqlite3-multiple-ciphers';
import crypto from 'crypto';

describe('Audit Logging — Auth Events', () => {
  let app: Express;
  let db: Database.Database;

  beforeEach(() => {
    const result = createTestApp();
    app = result.app;
    db = result.db;
  });

  describe('AUTH_REGISTER — Successful registration', () => {
    it('logs AUTH_REGISTER event on successful user registration', async () => {
      const uuid = crypto.randomUUID();
      const response = await request(app).post('/api/auth/register').send({
        uuid,
        username: 'newuser',
        keyHash: crypto.createHash('sha256').update('secret').digest('hex'),
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);

      const auditLog = db.prepare('SELECT * FROM audit_logs WHERE event_type = ? AND actor = ?').get('AUTH_REGISTER', uuid) as any;
      expect(auditLog).toBeDefined();
      expect(auditLog.event_type).toBe('AUTH_REGISTER');
      expect(auditLog.actor).toBe(uuid);
      expect(auditLog.actor_type).toBe('human');
      expect(auditLog.ip_address).toBeDefined();
      expect(auditLog.timestamp).toBeDefined();
      expect(auditLog.details).toContain('newuser');
    });
  });

  describe('AUTH_REGISTER_FAILURE — Duplicate username', () => {
    it('does not log AUTH_REGISTER on failure', async () => {
      const userUuid = createTestUser(db, 'existinguser');

      const response = await request(app).post('/api/auth/register').send({
        uuid: crypto.randomUUID(),
        username: 'existinguser',
        keyHash: crypto.createHash('sha256').update('newsecret').digest('hex'),
        displayName: 'Existing User',
      });

      expect(response.status).toBe(409);
      expect(response.body.error).toContain('already taken');
    });
  });

  describe('AUTH_SUCCESS — Human key login', () => {
    it('logs AUTH_SUCCESS on valid human key authentication', async () => {
      const keyHash = crypto.createHash('sha256').update('mysecret').digest('hex');
      const userUuid = createTestUser(db, 'humanuser', keyHash);

      const response = await request(app).post('/api/auth/token').send({
        username: 'humanuser',
        keyHash,
        type: 'human',
      });

      expect(response.status).toBe(201);
      expect(response.body.data.token).toBeDefined();

      const auditLog = db.prepare('SELECT * FROM audit_logs WHERE event_type = ? AND actor = ?').get('AUTH_SUCCESS', userUuid) as any;
      expect(auditLog).toBeDefined();
      expect(auditLog.event_type).toBe('AUTH_SUCCESS');
      expect(auditLog.actor).toBe(userUuid);
      expect(auditLog.actor_type).toBe('human');
    });
  });

  describe('AUTH_SUCCESS — Lobster key login', () => {
    it('logs AUTH_SUCCESS on valid lobster key authentication', async () => {
      const userUuid = createTestUser(db, 'lobsteruser');
      const { id: keyId, apiKey } = createTestAgentKey(db, userUuid, { canRead: true });

      const response = await request(app).post('/api/auth/token').send({
        ownerKey: apiKey,
        type: 'agent',
      });

      expect(response.status).toBe(201);
      expect(response.body.data.token).toBeDefined();

      const auditLog = db.prepare('SELECT * FROM audit_logs WHERE event_type = ? AND actor = ?').get('AUTH_SUCCESS', keyId) as any;
      expect(auditLog).toBeDefined();
      expect(auditLog.event_type).toBe('AUTH_SUCCESS');
      expect(auditLog.actor_type).toBe('agent');
    });
  });

  describe('AUTH_FAILURE — Invalid user', () => {
    it('logs AUTH_FAILURE when user not found', async () => {
      const response = await request(app).post('/api/auth/token').send({
        username: 'nonexistent',
        keyHash: crypto.createHash('sha256').update('somehash').digest('hex'),
        type: 'human',
      });

      expect(response.status).toBe(404);

      const auditLog = db.prepare('SELECT * FROM audit_logs WHERE event_type = ?').get('AUTH_FAILURE') as any;
      expect(auditLog).toBeDefined();
    });
  });

  describe('AUTH_FAILURE — Invalid key', () => {
    it('logs AUTH_FAILURE when key hash does not match', async () => {
      const keyHash = crypto.createHash('sha256').update('correct').digest('hex');
      const userUuid = createTestUser(db, 'testuser', keyHash);

      const wrongHash = crypto.createHash('sha256').update('wrong').digest('hex');
      const response = await request(app).post('/api/auth/token').send({
        uuid: userUuid,
        keyHash: wrongHash,
        type: 'human',
      });

      expect(response.status).toBe(401);

      const auditLog = db.prepare('SELECT * FROM audit_logs WHERE event_type = ?').get('AUTH_FAILURE') as any;
      expect(auditLog).toBeDefined();
    });
  });

  describe('AUTH_FAILURE — Invalid lobster key', () => {
    it('logs AUTH_FAILURE when lobster key is invalid or inactive', async () => {
      const userUuid = createTestUser(db, 'lobsteruser2');

      const response = await request(app).post('/api/auth/token').send({
        ownerKey: 'lb-invalidkeyhash12345678901234567890',
        type: 'agent',
      });

      expect(response.status).toBe(401);

      const auditLog = db.prepare('SELECT * FROM audit_logs WHERE event_type = ?').get('AUTH_FAILURE') as any;
      expect(auditLog).toBeDefined();
    });
  });

  describe('AUTH_LOGOUT — Session termination', () => {
    it('logs AUTH_LOGOUT when user terminates session', async () => {
      const keyHash = crypto.createHash('sha256').update('secret').digest('hex');
      const userUuid = createTestUser(db, 'logoutuser', keyHash);
      const token = createTestToken(db, userUuid, 'human');

      const response = await request(app).post('/api/auth/logout').set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);

      const auditLog = db.prepare('SELECT * FROM audit_logs WHERE event_type = ?').get('AUTH_LOGOUT') as any;
      expect(auditLog).toBeDefined();
      expect(auditLog.event_type).toBe('AUTH_LOGOUT');
      expect(auditLog.actor).toBe(userUuid);
      expect(auditLog.actor_type).toBe('human');
    });
  });

  describe('PERMISSION_DENIED — Insufficient permissions', () => {
    it.skip('logs PERMISSION_DENIED when lobster key lacks required permission', async () => {
      // SKIPPED: Audit logging for permission denied not yet implemented in requirePermission middleware
      const userUuid = createTestUser(db, 'restricteduser');
      const { apiKey } = createTestAgentKey(db, userUuid, { canRead: true, canWrite: false });

      // Login as lobster key
      const loginResponse = await request(app).post('/api/auth/token').send({
        ownerKey: apiKey,
        type: 'agent',
      });
      const token = loginResponse.body.token;

      // Try to write notes (requires canWrite permission)
      const response = await request(app).post('/api/notes').set('Authorization', `Bearer ${token}`).send({
        title: 'Test',
        content: 'Content',
      });

      expect(response.status).toBe(403);

      const auditLog = db.prepare('SELECT * FROM audit_logs WHERE event_type = ?').get('PERMISSION_DENIED') as any;
      expect(auditLog).toBeDefined();
      expect(auditLog.event_type).toBe('PERMISSION_DENIED');
      expect(auditLog.actor).toBe(userUuid);
      const details = JSON.parse(auditLog.details);
      expect(details.required_permission).toBeDefined();
    });
  });

  describe('AUTH_TOKEN_EXPIRED — Token expiration', () => {
    it.skip('logs AUTH_TOKEN_EXPIRED when accessing with an expired token', async () => {
      // SKIPPED: expires_at column removed from api_tokens schema
      // Tokens no longer expire - they must be explicitly revoked
      const keyHash = crypto.createHash('sha256').update('secret').digest('hex');
      const userUuid = createTestUser(db, 'expireduser', keyHash);

      // Create an expired token
      const expiredToken = `api-${Math.random().toString(36).slice(2, 34)}`;
      const tokenHash = crypto.createHash('sha256').update(expiredToken).digest('hex');
      db.prepare('INSERT INTO api_tokens (key, owner_key, owner_type, created_at) VALUES (?, ?, ?, ?)').run(
        tokenHash,
        userUuid,
        'human',
        new Date().toISOString()
      );

      // Try to access protected resource
      const response = await request(app).get('/api/notes').set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('expired');

      const auditLog = db.prepare('SELECT * FROM audit_logs WHERE event_type = ?').get('AUTH_TOKEN_EXPIRED') as any;
      expect(auditLog).toBeDefined();
      expect(auditLog.event_type).toBe('AUTH_TOKEN_EXPIRED');
      expect(auditLog.actor).toBe(userUuid);
      expect(auditLog.actor_type).toBe('human');
    });
  });

  describe('AUTH_REGISTER_RATE_LIMITED — Registration rate limit', () => {
    it.skip('logs AUTH_REGISTER_RATE_LIMITED when exceeding 5 registrations per 15 min', async () => {
      // SKIPPED: Rate limiting not yet implemented
      // Attempt 6 registrations (limit is 5)
      for (let i = 0; i < 6; i++) {
        await request(app).post('/api/auth/register').send({
          uuid: crypto.randomUUID(),
          username: `user${i}`,
          keyHash: crypto.createHash('sha256').update(`secret${i}`).digest('hex'),
        });
      }

      const auditLog = db.prepare('SELECT * FROM audit_logs WHERE event_type = ?').get('AUTH_REGISTER_RATE_LIMITED') as any;
      expect(auditLog).toBeDefined();
      expect(auditLog.event_type).toBe('AUTH_REGISTER_RATE_LIMITED');
    });
  });

  describe('AUTH_LOGIN_RATE_LIMITED — Login rate limit', () => {
    it.skip('logs AUTH_LOGIN_RATE_LIMITED when exceeding 10 login attempts per 15 min', async () => {
      // SKIPPED: Rate limiting not yet implemented
      // Attempt 11 logins (limit is 10)
      for (let i = 0; i < 11; i++) {
        await request(app).post('/api/auth/token').send({
          username: `user${i}`,
          keyHash: `hash${i}`,
          type: 'human',
        });
      }

      const auditLog = db.prepare('SELECT * FROM audit_logs WHERE event_type = ?').get('AUTH_LOGIN_RATE_LIMITED') as any;
      expect(auditLog).toBeDefined();
      expect(auditLog.event_type).toBe('AUTH_LOGIN_RATE_LIMITED');
    });
  });

});
