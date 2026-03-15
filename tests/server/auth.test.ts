/// <reference types="vitest" />
/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import Database from 'better-sqlite3';
import express from 'express';
import request from 'supertest';
import { authService } from '../../src/services/authService';
import { generateBase62, hashToken } from '../../src/lib/crypto';

describe('Auth Routes (Integration Tests)', () => {
  let db: Database.Database;
  let app: express.Application;
  let testUuid: string;
  let testHuKey: string;
  let testKeyHash: string;

  beforeAll(async () => {
    // Create in-memory SQLite database
    db = new Database(':memory:');

    // Initialize schema
    db.exec(`
      CREATE TABLE users (
        uuid TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        display_name TEXT,
        key_hash TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE api_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_uuid TEXT NOT NULL,
        token TEXT UNIQUE NOT NULL,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_uuid) REFERENCES users(uuid)
      );

      CREATE TABLE lobster_keys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_uuid TEXT NOT NULL,
        key_hash TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_uuid) REFERENCES users(uuid)
      );
    `);

    // Setup test data
    testUuid = crypto.randomUUID();
    testHuKey = `hu-${generateBase62(64)}`;
    testKeyHash = await hashToken(testHuKey);

    // Insert test user
    const insertStmt = db.prepare(`
      INSERT INTO users (uuid, username, display_name, key_hash, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertStmt.run(testUuid, 'testuser', 'Test User', testKeyHash, new Date().toISOString());

    // Create Express app with minimal auth routes
    app = express();
    app.use(express.json());

    // Mock routes for testing
    app.post('/api/auth/register', async (req, res) => {
      try {
        const { uuid, username, displayName, keyHash } = req.body;

        // Check if user exists
        const existingUser = db.prepare('SELECT uuid FROM users WHERE username = ?').get(username);
        if (existingUser) {
          return res.status(400).json({ error: 'User already exists' });
        }

        // Insert new user
        const stmt = db.prepare(`
          INSERT INTO users (uuid, username, display_name, key_hash, created_at)
          VALUES (?, ?, ?, ?, ?)
        `);
        stmt.run(uuid, username, displayName || null, keyHash, new Date().toISOString());

        res.status(201).json({ message: 'User registered' });
      } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    app.post('/api/auth/token', async (req, res) => {
      try {
        const { uuid, username, keyHash, type } = req.body;

        // Find user by uuid or username
        let user;
        if (uuid) {
          user = db.prepare('SELECT * FROM users WHERE uuid = ?').get(uuid);
        } else if (username) {
          user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
        }

        if (!user) {
          return res.status(401).json({ error: 'User not found' });
        }

        // Verify key hash
        if (user.key_hash !== keyHash) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate session token
        const sessionToken = `cc-${generateBase62(64)}`;
        const expiresAt = new Date(Date.now() + 86400000).toISOString(); // 24 hours

        const insertTokenStmt = db.prepare(`
          INSERT INTO api_tokens (user_uuid, token, expires_at, created_at)
          VALUES (?, ?, ?, ?)
        `);
        insertTokenStmt.run(user.uuid, sessionToken, expiresAt, new Date().toISOString());

        res.status(200).json({
          token: sessionToken,
          uuid: user.uuid,
          username: user.username,
          displayName: user.display_name
        });
      } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    app.get('/api/auth/verify', (req, res) => {
      try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(401).json({ error: 'Missing or invalid token' });
        }

        const token = authHeader.substring(7);
        const tokenRecord = db.prepare('SELECT * FROM api_tokens WHERE token = ?').get(token);

        if (!tokenRecord) {
          return res.status(401).json({ error: 'Token not found' });
        }

        const expiresAt = new Date(tokenRecord.expires_at).getTime();
        if (Date.now() > expiresAt) {
          return res.status(401).json({ error: 'Token expired' });
        }

        const user = db.prepare('SELECT * FROM users WHERE uuid = ?').get(tokenRecord.user_uuid);
        res.status(200).json({
          uuid: user.uuid,
          username: user.username,
          displayName: user.display_name
        });
      } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    app.post('/api/auth/logout', (req, res) => {
      try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(401).json({ error: 'Missing token' });
        }

        const token = authHeader.substring(7);
        const deleteStmt = db.prepare('DELETE FROM api_tokens WHERE token = ?');
        deleteStmt.run(token);

        res.status(200).json({ message: 'Logged out' });
      } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
      }
    });
  });

  afterAll(() => {
    db.close();
  });

  describe('POST /api/auth/register', () => {
    it('registers a new user with valid input', async () => {
      const newUuid = crypto.randomUUID();
      const newKeyHash = await hashToken(`hu-${generateBase62(64)}`);

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          uuid: newUuid,
          username: 'newuser',
          displayName: 'New User',
          keyHash: newKeyHash
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('User registered');
    });

    it('rejects duplicate username', async () => {
      const newUuid = crypto.randomUUID();
      const newKeyHash = await hashToken(`hu-${generateBase62(64)}`);

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          uuid: newUuid,
          username: 'testuser', // Already exists
          displayName: 'Another User',
          keyHash: newKeyHash
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('User already exists');
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

      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
      expect(response.body.token).toMatch(/^cc-/);
      expect(response.body.uuid).toBe(testUuid);
      expect(response.body.username).toBe('testuser');
    });

    it('rejects invalid keyHash', async () => {
      const response = await request(app)
        .post('/api/auth/token')
        .send({
          uuid: testUuid,
          keyHash: 'invalid-hash',
          type: 'human'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });

    it('rejects non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/token')
        .send({
          uuid: crypto.randomUUID(),
          keyHash: testKeyHash,
          type: 'human'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('User not found');
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

      const token = tokenResponse.body.token;

      // Then verify it
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.uuid).toBe(testUuid);
      expect(response.body.username).toBe('testuser');
    });

    it('rejects request without token', async () => {
      const response = await request(app)
        .get('/api/auth/verify');

      expect(response.status).toBe(401);
      expect(response.body.error).toMatch(/Missing|invalid/i);
    });

    it('rejects invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'Bearer invalid-token-xyz');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Token not found');
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

      const token = tokenResponse.body.token;

      // Logout
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Logged out');
    });

    it('rejects logout without token', async () => {
      const response = await request(app)
        .post('/api/auth/logout');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Missing token');
    });
  });
});
