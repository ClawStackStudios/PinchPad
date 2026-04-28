import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestApp, createTestUser } from '../../shared/app';
import { Express } from 'express';
import Database from 'better-sqlite3-multiple-ciphers';
import crypto from 'crypto';

function mockHash() {
  return crypto.createHash('sha256').update(crypto.randomUUID()).digest('hex');
}

describe('Auth Routes', () => {
  let app: Express;
  let db: Database.Database;
  let testUuid: string;
  let testKeyHash: string;

  beforeEach(() => {
    const testSetup = createTestApp();
    app = testSetup.app;
    db = testSetup.db;

    testKeyHash = mockHash();
    testUuid = createTestUser(db, 'authuser', testKeyHash);
  });

  describe('POST /api/auth/register', () => {
    it('registers a new user with valid input', async () => {
      const newUuid = crypto.randomUUID();
      const newKeyHash = mockHash();

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          uuid: newUuid,
          username: 'newuser',
          displayName: 'New User',
          keyHash: newKeyHash
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);

      // Verify user was created
      const user = db.prepare('SELECT * FROM users WHERE uuid = ?').get(newUuid) as any;
      expect(user).toBeDefined();
      expect(user.username).toBe('newuser');
    });

    it('rejects duplicate username', async () => {
      const newUuid = crypto.randomUUID();
      const newKeyHash = mockHash();

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          uuid: newUuid,
          username: 'authuser', // Already exists
          displayName: 'Another User',
          keyHash: newKeyHash
        });

      // Zod validation should pass, but DB insert should fail (caught in handler)
      expect(response.status).toBe(409);
      expect(response.body.error).toBe('Username already taken.');
    });

    it('rejects missing uuid', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'someuser',
          displayName: 'Some User',
          keyHash: mockHash()
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/token', () => {
    it('generates token with valid uuid and keyHash', async () => {
      const response = await request(app)
        .post('/api/auth/token')
        .send({
          uuid: testUuid,
          keyHash: testKeyHash,
          type: 'human'
        });

      expect(response.status).toBe(201);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.token).toMatch(/^api-/);
      expect(response.body.data.user.uuid).toBe(testUuid);
      expect(response.body.data.user.username).toBe('authuser');
    });

    it('rejects invalid keyHash', async () => {
      const response = await request(app)
        .post('/api/auth/token')
        .send({
          uuid: testUuid,
          keyHash: mockHash(), // Wrong hash
          type: 'human'
        });

      expect(response.status).toBe(401);
    });

    it('rejects non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/token')
        .send({
          uuid: crypto.randomUUID(),
          keyHash: testKeyHash,
          type: 'human'
        });

      // Non-existent user returns 404 "Identity not registered on this node"
      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/auth/verify', () => {
    it('verifies valid token', async () => {
      // First get a token
      const tokenResponse = await request(app)
        .post('/api/auth/token')
        .send({
          uuid: testUuid,
          keyHash: testKeyHash,
          type: 'human'
        });

      const token = tokenResponse.body.data.token;

      // Then verify it
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.uuid).toBe(testUuid);
      expect(response.body.type).toBe('human');
    });

    it('rejects request without token', async () => {
      const response = await request(app).get('/api/auth/verify');

      expect(response.status).toBe(401);
    });

    it('rejects invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'Bearer invalid-token-xyz');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('logs out user with valid token', async () => {
      // Get a token
      const tokenResponse = await request(app)
        .post('/api/auth/token')
        .send({
          uuid: testUuid,
          keyHash: testKeyHash,
          type: 'human'
        });

      const token = tokenResponse.body.data.token;

      // Logout
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify token was deleted from DB
      const tokenRecord = db.prepare('SELECT * FROM api_tokens WHERE key = ?').get(token);
      expect(tokenRecord).toBeUndefined();
    });

    it('rejects logout without token', async () => {
      const response = await request(app).post('/api/auth/logout');

      expect(response.status).toBe(401);
    });
  });
});
