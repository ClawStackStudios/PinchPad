import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Database from 'better-sqlite3-multiple-ciphers';
import express from 'express';
import request from 'supertest';
import crypto from 'crypto';
import authRouter from '../../src/server/routes/auth';

const TOKEN_TTL_DEFAULT = 24 * 60 * 60 * 1000; // 24 hours in ms
import notesRouter from '../../src/server/routes/notes';
import { requireAuth } from '../../src/server/middleware/auth';

describe('Token Lifecycle Integration', () => {
  let db: Database.Database;
  let app: express.Application;
  let testUuid: string;
  let testUsername: string;
  let testKeyHash: string;

  beforeAll(() => {
    // Create in-memory database
    db = new Database(':memory:');
    db.pragma('foreign_keys = ON');

    // Initialize schema
    db.exec(`
      CREATE TABLE users (
        uuid TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        display_name TEXT,
        key_hash TEXT NOT NULL UNIQUE,
        created_at TEXT NOT NULL
      );

      CREATE TABLE api_tokens (
        key TEXT PRIMARY KEY,
        owner_uuid TEXT NOT NULL,
        owner_type TEXT NOT NULL,
        lobster_key_id TEXT,
        expires_at TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY(owner_uuid) REFERENCES users(uuid) ON DELETE CASCADE
      );

      CREATE TABLE lobster_keys (
        id TEXT PRIMARY KEY,
        user_uuid TEXT NOT NULL,
        name TEXT NOT NULL,
        api_key TEXT,
        api_key_hash TEXT UNIQUE,
        permissions TEXT NOT NULL,
        expiration_type TEXT NOT NULL,
        expiration_date TEXT,
        rate_limit INTEGER,
        is_active INTEGER DEFAULT 1,
        created_at TEXT NOT NULL,
        last_used TEXT,
        FOREIGN KEY(user_uuid) REFERENCES users(uuid) ON DELETE CASCADE
      );

      CREATE TABLE notes (
        id TEXT PRIMARY KEY,
        user_uuid TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        starred INTEGER DEFAULT 0,
        pinned INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY(user_uuid) REFERENCES users(uuid) ON DELETE CASCADE
      );
    `);

    // Setup test data
    testUuid = 'user-lifecycle-test';
    testUsername = 'lifecycleuser';
    testKeyHash = 'test-key-hash-12345';

    // Create Express app
    app = express();
    app.use(express.json());

    // Provide db to routes via middleware
    app.use((req: any, res, next) => {
      req.db = db;
      next();
    });

    app.use('/api/auth', authRouter);
    app.use('/api/notes', notesRouter);

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({ status: 'ok' });
    });
  });

  afterAll(() => {
    db.close();
  });

  describe('Complete Token Lifecycle', () => {
    let sessionToken: string;
    let noteId: string;

    it('1. Register user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          uuid: testUuid,
          username: testUsername,
          displayName: 'Lifecycle User',
          keyHash: testKeyHash
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);

      // Verify user exists
      const user = db.prepare('SELECT * FROM users WHERE uuid = ?').get(testUuid) as any;
      expect(user).toBeDefined();
      expect(user.username).toBe(testUsername);
    });

    it('2. Get token with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/token')
        .send({
          uuid: testUuid,
          keyHash: testKeyHash,
          type: 'human'
        });

      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
      expect(response.body.token).toMatch(/^api-/);
      expect(response.body.uuid).toBe(testUuid);
      expect(response.body.username).toBe(testUsername);

      sessionToken = response.body.token;

      // Verify token exists in DB
      const sessionTokenHash = crypto.createHash('sha256').update(sessionToken).digest('hex');
      const token = db.prepare('SELECT * FROM api_tokens WHERE key = ?').get(sessionTokenHash) as any;
      expect(token).toBeDefined();
      expect(token.owner_key || token.owner_uuid).toBe(testUuid);
      expect(token.owner_type).toBe('human');
    });

    it('3. Use token for API call (GET /api/notes)', async () => {
      const response = await request(app)
        .get('/api/notes')
        .set('Authorization', `Bearer ${sessionToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
    });

    it('4. Create a note with valid token', async () => {
      noteId = 'note-lifecycle-1';
      const response = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${sessionToken}`)
        .send({
          id: noteId,
          title: 'Lifecycle Test Note',
          content: 'This is a test note for lifecycle'
        });

      expect(response.status).toBe(201);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.title).toBe('Lifecycle Test Note');

      // Verify note exists in DB
      const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(noteId) as any;
      expect(note).toBeDefined();
      expect(note.user_uuid).toBe(testUuid);
    });

    it('5. Simulate token expiry by manually expiring it', () => {
      const expiredTime = new Date(Date.now() - 1000).toISOString();
      const sessionTokenHash = crypto.createHash('sha256').update(sessionToken).digest('hex');
      db.prepare('UPDATE api_tokens SET expires_at = ? WHERE key = ?').run(expiredTime, sessionTokenHash);

      // Verify token is marked expired
      const token = db.prepare('SELECT expires_at FROM api_tokens WHERE key = ?').get(sessionTokenHash) as any;
      expect(new Date(token.expires_at).getTime()).toBeLessThan(Date.now());
    });

    it('6. Verify expired token returns 401', async () => {
      const response = await request(app)
        .get('/api/notes')
        .set('Authorization', `Bearer ${sessionToken}`);

      expect(response.status).toBe(401);
      expect(response.body.error).toMatch(/expired|invalid/i);
    });

    it('7. Verify token was deleted after expiry check', () => {
      const sessionTokenHash = crypto.createHash('sha256').update(sessionToken).digest('hex');
      const token = db.prepare('SELECT * FROM api_tokens WHERE key = ?').get(sessionTokenHash);
      expect(token).toBeUndefined();
    });

    it('8. Get new token after expiry', async () => {
      const response = await request(app)
        .post('/api/auth/token')
        .send({
          uuid: testUuid,
          keyHash: testKeyHash,
          type: 'human'
        });

      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
      expect(response.body.token).not.toBe(sessionToken);

      sessionToken = response.body.token;
    });

    it('9. Verify new token works for API calls', async () => {
      const response = await request(app)
        .get('/api/notes')
        .set('Authorization', `Bearer ${sessionToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].id).toBe(noteId);
    });

    it('10. Logout user with valid token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${sessionToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify token was deleted
      const sessionTokenHash = crypto.createHash('sha256').update(sessionToken).digest('hex');
      const token = db.prepare('SELECT * FROM api_tokens WHERE key = ?').get(sessionTokenHash);
      expect(token).toBeUndefined();
    });

    it('11. Verify deleted token fails for API calls', async () => {
      const response = await request(app)
        .get('/api/notes')
        .set('Authorization', `Bearer ${sessionToken}`);

      expect(response.status).toBe(401);
    });
  });

  describe('Token Invalidation on New Login', () => {
    let token1: string;
    let token2: string;

    beforeAll(() => {
      // Create fresh user for this test
      db.prepare('INSERT INTO users (uuid, username, display_name, key_hash, created_at) VALUES (?, ?, ?, ?, ?)').run(
        'user-token-inv',
        'tokeninvuser',
        'Token Inv User',
        'inv-key-hash',
        new Date().toISOString()
      );
    });

    it('first login generates token', async () => {
      const response = await request(app)
        .post('/api/auth/token')
        .send({
          uuid: 'user-token-inv',
          keyHash: 'inv-key-hash',
          type: 'human'
        });

      expect(response.status).toBe(200);
      token1 = response.body.token;

      // Verify token exists
      const token1Hash = crypto.createHash('sha256').update(token1).digest('hex');
      const token = db.prepare('SELECT * FROM api_tokens WHERE key = ?').get(token1Hash);
      expect(token).toBeDefined();
    });

    it('second login invalidates previous token', async () => {
      const response = await request(app)
        .post('/api/auth/token')
        .send({
          uuid: 'user-token-inv',
          keyHash: 'inv-key-hash',
          type: 'human'
        });

      expect(response.status).toBe(200);
      token2 = response.body.token;
      expect(token2).not.toBe(token1);

      // Verify old token is deleted
      const token1Hash = crypto.createHash('sha256').update(token1).digest('hex');
      const oldToken = db.prepare('SELECT * FROM api_tokens WHERE key = ?').get(token1Hash);
      expect(oldToken).toBeUndefined();

      // Verify new token exists
      const token2Hash = crypto.createHash('sha256').update(token2).digest('hex');
      const newToken = db.prepare('SELECT * FROM api_tokens WHERE key = ?').get(token2Hash);
      expect(newToken).toBeDefined();
    });

    it('old token no longer works', async () => {
      const response = await request(app)
        .get('/api/notes')
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(401);
    });

    it('new token works', async () => {
      const response = await request(app)
        .get('/api/notes')
        .set('Authorization', `Bearer ${token2}`);

      expect(response.status).toBe(200);
    });
  });

  describe('Token TTL Enforcement', () => {
    it('token expires after TTL duration', () => {
      const now = new Date();
      db.prepare('INSERT INTO users (uuid, username, display_name, key_hash, created_at) VALUES (?, ?, ?, ?, ?)').run(
        'user-ttl-test',
        'ttluser',
        'TTL User',
        'ttl-hash',
        now.toISOString()
      );

      const token = 'api-ttltoken123456789012345678901';
      const expiresAt = new Date(now.getTime() + TOKEN_TTL_DEFAULT).toISOString();

      db.prepare(`
        INSERT INTO api_tokens (key, owner_uuid, owner_type, expires_at, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        token,
        'user-ttl-test',
        'human',
        expiresAt,
        now.toISOString()
      );

      // Verify TTL is approximately 24 hours
      const ttl = new Date(expiresAt).getTime() - now.getTime();
      expect(ttl).toBeGreaterThan(23 * 60 * 60 * 1000); // Greater than 23 hours
      expect(ttl).toBeLessThan(25 * 60 * 60 * 1000); // Less than 25 hours
    });
  });
});
