import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestApp, createTestUser, createTestToken, createTestLobsterKey } from '../../shared/app';
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
        displayName: 'New User',
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
    it('logs AUTH_REGISTER_FAILURE when username is already taken', async () => {
      const userUuid = createTestUser(db, 'existinguser');

      const response = await request(app).post('/api/auth/register').send({
        uuid: crypto.randomUUID(),
        username: 'existinguser',
        displayName: 'Duplicate',
        keyHash: crypto.createHash('sha256').update('newsecret').digest('hex'),
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('already taken');

      const auditLog = db.prepare('SELECT * FROM audit_logs WHERE event_type = ?').get('AUTH_REGISTER_FAILURE') as any;
      expect(auditLog).toBeDefined();
      expect(auditLog.event_type).toBe('AUTH_REGISTER_FAILURE');
      expect(auditLog.ip_address).toBeDefined();
      const details = JSON.parse(auditLog.details);
      expect(details.reason).toBe('username_taken');
      expect(details.username).toBe('existinguser');
    });
  });

  describe('AUTH_LOGIN_SUCCESS — Human key login', () => {
    it('logs AUTH_LOGIN_SUCCESS on valid human key authentication', async () => {
      const keyHash = crypto.createHash('sha256').update('mysecret').digest('hex');
      const userUuid = createTestUser(db, 'humanuser', keyHash);

      const response = await request(app).post('/api/auth/token').send({
        username: 'humanuser',
        keyHash,
        type: 'human',
      });

      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();

      const auditLog = db.prepare('SELECT * FROM audit_logs WHERE event_type = ? AND actor = ?').get('AUTH_LOGIN_SUCCESS', userUuid) as any;
      expect(auditLog).toBeDefined();
      expect(auditLog.event_type).toBe('AUTH_LOGIN_SUCCESS');
      expect(auditLog.actor).toBe(userUuid);
      expect(auditLog.actor_type).toBe('human');
      const details = JSON.parse(auditLog.details);
      expect(details.type).toBe('human');
    });
  });

  describe('AUTH_LOGIN_SUCCESS — Lobster key login', () => {
    it('logs AUTH_LOGIN_SUCCESS on valid lobster key authentication', async () => {
      const userUuid = createTestUser(db, 'lobsteruser');
      const { id: keyId, apiKeyHash } = createTestLobsterKey(db, userUuid, { canRead: true });

      const response = await request(app).post('/api/auth/token').send({
        uuid: userUuid,
        keyHash: apiKeyHash,
        type: 'lobster',
      });

      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();

      const auditLog = db.prepare('SELECT * FROM audit_logs WHERE event_type = ? AND actor = ?').get('AUTH_LOGIN_SUCCESS', userUuid) as any;
      expect(auditLog).toBeDefined();
      expect(auditLog.event_type).toBe('AUTH_LOGIN_SUCCESS');
      expect(auditLog.actor_type).toBe('lobster');
      const details = JSON.parse(auditLog.details);
      expect(details.type).toBe('lobster');
      expect(details.lobsterKeyId).toBe(keyId);
    });
  });

  describe('AUTH_LOGIN_FAILURE — Invalid user', () => {
    it('logs AUTH_LOGIN_FAILURE when user not found', async () => {
      const response = await request(app).post('/api/auth/token').send({
        username: 'nonexistent',
        keyHash: 'somehash',
        type: 'human',
      });

      expect(response.status).toBe(401);

      const auditLog = db.prepare('SELECT * FROM audit_logs WHERE event_type = ?').get('AUTH_LOGIN_FAILURE') as any;
      expect(auditLog).toBeDefined();
      const details = JSON.parse(auditLog.details);
      expect(details.reason).toBe('user_not_found');
      expect(details.type).toBe('human');
    });
  });

  describe('AUTH_LOGIN_FAILURE — Invalid key', () => {
    it('logs AUTH_LOGIN_FAILURE when key hash does not match', async () => {
      const keyHash = crypto.createHash('sha256').update('correct').digest('hex');
      const userUuid = createTestUser(db, 'testuser', keyHash);

      const wrongHash = crypto.createHash('sha256').update('wrong').digest('hex');
      const response = await request(app).post('/api/auth/token').send({
        username: 'testuser',
        keyHash: wrongHash,
        type: 'human',
      });

      expect(response.status).toBe(401);

      const auditLog = db.prepare('SELECT * FROM audit_logs WHERE event_type = ?').get('AUTH_LOGIN_FAILURE') as any;
      expect(auditLog).toBeDefined();
      const details = JSON.parse(auditLog.details);
      expect(details.reason).toBe('invalid_key');
    });
  });

  describe('AUTH_LOGIN_FAILURE — Invalid lobster key', () => {
    it('logs AUTH_LOGIN_FAILURE when lobster key is invalid or inactive', async () => {
      const userUuid = createTestUser(db, 'lobsteruser2');

      const response = await request(app).post('/api/auth/token').send({
        uuid: userUuid,
        keyHash: 'invalidlobsterkeyhash',
        type: 'lobster',
      });

      expect(response.status).toBe(401);

      const auditLog = db.prepare('SELECT * FROM audit_logs WHERE event_type = ?').get('AUTH_LOGIN_FAILURE') as any;
      expect(auditLog).toBeDefined();
      const details = JSON.parse(auditLog.details);
      expect(details.reason).toBe('invalid_lobster_key');
      expect(details.type).toBe('lobster');
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
    it('logs PERMISSION_DENIED when lobster key lacks required permission', async () => {
      const userUuid = createTestUser(db, 'restricteduser');
      const { apiKeyHash } = createTestLobsterKey(db, userUuid, { canRead: true, canWrite: false });

      // Login as lobster key
      const loginResponse = await request(app).post('/api/auth/token').send({
        uuid: userUuid,
        keyHash: apiKeyHash,
        type: 'lobster',
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
    it('logs AUTH_TOKEN_EXPIRED when accessing with an expired token', async () => {
      const keyHash = crypto.createHash('sha256').update('secret').digest('hex');
      const userUuid = createTestUser(db, 'expireduser', keyHash);

      // Create an expired token
      const expiredToken = `api-${Math.random().toString(36).slice(2, 34)}`;
      const tokenHash = crypto.createHash('sha256').update(expiredToken).digest('hex');
      db.prepare('INSERT INTO api_tokens (key, owner_uuid, owner_type, expires_at, created_at) VALUES (?, ?, ?, ?, ?)').run(
        tokenHash,
        userUuid,
        'human',
        new Date(Date.now() - 1000).toISOString(), // Already expired
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
    it('logs AUTH_REGISTER_RATE_LIMITED when exceeding 5 registrations per 15 min', async () => {
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
    it('logs AUTH_LOGIN_RATE_LIMITED when exceeding 10 login attempts per 15 min', async () => {
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
