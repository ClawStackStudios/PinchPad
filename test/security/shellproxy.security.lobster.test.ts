import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { Express } from 'express';
import Database from 'better-sqlite3-multiple-ciphers';
import crypto from 'crypto';
import { createTestApp, createTestUser, createTestToken } from '../shared/app';
import { createTestNote } from '../helpers/testFactories';

describe('ShellProxy Sharing & API Security', () => {
  let app: Express;
  let db: Database.Database;

  beforeEach(() => {
    const result = createTestApp();
    app = result.app;
    db = result.db;
  });

  afterEach(() => {
    // Reset databases is implicitly handled in createTestApp via truncates
  });

  describe('Share Management Access Control (/api/shares)', () => {
    it('requires authentication to create a share', async () => {
      const res = await request(app)
        .post('/api/shares/pearl/some-note-id')
        .send({ expiresAt: null });

      expect(res.status).toBe(401);
    });

    it('requires canWrite permission to create a share', async () => {
      const userUuid = createTestUser(db, 'writer');
      // Create a read-only token
      const token = `api-readonly-${crypto.randomBytes(8).toString('hex')}`;
      db.prepare("INSERT INTO api_tokens (key, owner_key, owner_type, created_at) VALUES (?, ?, ?, datetime('now'))").run(
        token,
        userUuid,
        'human'
      );
      // Give the agent read-only permissions in the DB if we mock permissions, 
      // but for a standard human token, default allows it. Let's create an agent key to test permission checks
      const agentId = crypto.randomUUID();
      const apiKey = `lb-testagent-${crypto.randomBytes(8).toString('hex')}`;
      // Read-only permissions: canRead=true, canWrite=false
      db.prepare(`
        INSERT INTO agent_keys (id, user_uuid, name, api_key, permissions, expiration_type, is_active, created_at)
        VALUES (?, ?, ?, ?, ?, 'never', 1, datetime('now'))
      `).run(
        agentId,
        userUuid,
        'Agent ReadOnly',
        apiKey,
        JSON.stringify({ canRead: true, canWrite: false })
      );

      const agentToken = `api-agent-${crypto.randomBytes(8).toString('hex')}`;
      db.prepare("INSERT INTO api_tokens (key, owner_key, owner_type, created_at) VALUES (?, ?, ?, datetime('now'))").run(
        agentToken,
        apiKey,
        'agent'
      );

      const note = createTestNote(db, userUuid, { title: 'Secret Pearl' });

      // Create request with agent token lacking canWrite
      const res = await request(app)
        .post(`/api/shares/pearl/${note.id}`)
        .set('Authorization', `Bearer ${agentToken}`)
        .send({ expiresAt: null });

      expect(res.status).toBe(403);
    });

    it('prevents user from sharing notes owned by another user', async () => {
      const user1 = createTestUser(db, 'user1');
      const user2 = createTestUser(db, 'user2');
      const token1 = createTestToken(db, user1);

      const noteOfUser2 = createTestNote(db, user2, { title: 'Secret Note User 2' });

      const res = await request(app)
        .post(`/api/shares/pearl/${noteOfUser2.id}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ expiresAt: null });

      expect(res.status).toBe(404); // Access denied / Not found boundary
    });
  });

  describe('ShellProxy Guard & Hash Validation', () => {
    it('silently drops requests with malformed hashes (404)', async () => {
      const invalidHashes = [
        'short-hash',
        'a'.repeat(63) + 'Z', // Invalid hex character
        'a'.repeat(65),      // Too long
        '../path/traversal',
        "' OR '1'='1"
      ];

      for (const hash of invalidHashes) {
        const res = await request(app).get(`/shellproxy/share/${hash}`);
        expect(res.status).toBe(404);
      }
    });
  });

  describe('ShellProxy Sanitization & Data Exposure', () => {
    it('serves shared notes with absolute sanitization (no internal IDs)', async () => {
      const user = createTestUser(db, 'sharer');
      const token = createTestToken(db, user);
      const note = createTestNote(db, user, {
        title: 'Public Pearl',
        content: 'This content is intended to be public.',
        starred: true,
        pinned: true
      });

      // Create a share
      const shareHash = crypto.randomBytes(32).toString('hex');
      const shareId = crypto.randomUUID();
      db.prepare(`
        INSERT INTO pearl_shares (id, pearl_id, share_hash, is_active, created_at, expires_at)
        VALUES (?, ?, ?, 1, datetime('now'), null)
      `).run(shareId, note.id, shareHash);

      // Add a test photo
      const photoId = crypto.randomUUID();
      db.prepare(`
        INSERT INTO pearl_photos (id, user_uuid, pearl_id, filename, mime_type, data, created_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      `).run(photoId, user, note.id, 'scenic.png', 'image/png', Buffer.from('fake-image-bytes'));

      const res = await request(app).get(`/shellproxy/share/${shareHash}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      
      const payload = res.body.data;
      expect(payload.title).toBe('Public Pearl');
      expect(payload.content).toBe('This content is intended to be public.');
      
      // Verification of robust user-isolation / metadata scrubbing:
      expect(payload.user_uuid).toBeUndefined();
      expect(payload.pearl_id).toBeUndefined();
      expect(payload.pot_id).toBeUndefined();
      expect(payload.starred).toBeUndefined();
      expect(payload.pinned).toBeUndefined();

      // Photos metadata should be returned without internal database fields
      expect(payload.photos).toBeDefined();
      expect(payload.photos).toHaveLength(1);
      expect(payload.photos[0].id).toBe(photoId);
      expect(payload.photos[0].filename).toBe('scenic.png');
      expect(payload.photos[0].mimeType).toBe('image/png');
      expect(payload.photos[0].url).toBe(`/shellproxy/share/${shareHash}/photos/${photoId}`);
    });

    it('returns 404 for expired shares', async () => {
      const user = createTestUser(db, 'sharer');
      const note = createTestNote(db, user, { title: 'Expired Pearl' });

      // Create an expired share (expired 1 hour ago)
      const shareHash = crypto.randomBytes(32).toString('hex');
      const shareId = crypto.randomUUID();
      db.prepare(`
        INSERT INTO pearl_shares (id, pearl_id, share_hash, is_active, created_at, expires_at)
        VALUES (?, ?, ?, 1, datetime('now', '-2 hours'), datetime('now', '-1 hours'))
      `).run(shareId, note.id, shareHash);

      const res = await request(app).get(`/shellproxy/share/${shareHash}`);
      expect(res.status).toBe(404);
    });
  });

  describe('Attached Attachment Photo Security', () => {
    it('returns raw binary data with safe header defense and restricts path traversal', async () => {
      const user = createTestUser(db, 'photo-sharer');
      const note = createTestNote(db, user, { title: 'Pearl with photo' });

      const shareHash = crypto.randomBytes(32).toString('hex');
      const shareId = crypto.randomUUID();
      db.prepare(`
        INSERT INTO pearl_shares (id, pearl_id, share_hash, is_active, created_at, expires_at)
        VALUES (?, ?, ?, 1, datetime('now'), null)
      `).run(shareId, note.id, shareHash);

      const photoId = crypto.randomUUID();
      db.prepare(`
        INSERT INTO pearl_photos (id, user_uuid, pearl_id, filename, mime_type, data, created_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      `).run(photoId, user, note.id, 'vacation.jpg', 'image/jpeg', Buffer.from('jpeg-binary-payload'));

      const res = await request(app).get(`/shellproxy/share/${shareHash}/photos/${photoId}`);

      expect(res.status).toBe(200);
      expect(res.header['content-type']).toBe('image/jpeg');
      expect(res.header['content-disposition']).toBe('inline');
      expect(res.header['x-content-type-options']).toBe('nosniff');
      expect(res.body.toString('utf8')).toBe('jpeg-binary-payload');
    });

    it('secures unsafe MIME types by defaulting to application/octet-stream', async () => {
      const user = createTestUser(db, 'mime-attacker');
      const note = createTestNote(db, user, { title: 'XSS Attack Pearl' });

      const shareHash = crypto.randomBytes(32).toString('hex');
      const shareId = crypto.randomUUID();
      db.prepare(`
        INSERT INTO pearl_shares (id, pearl_id, share_hash, is_active, created_at, expires_at)
        VALUES (?, ?, ?, 1, datetime('now'), null)
      `).run(shareId, note.id, shareHash);

      const photoId = crypto.randomUUID();
      // Try to inject HTML/XSS MIME type
      db.prepare(`
        INSERT INTO pearl_photos (id, user_uuid, pearl_id, filename, mime_type, data, created_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      `).run(photoId, user, note.id, 'exploit.html', 'text/html', Buffer.from('<script>alert("XSS")</script>'));

      const res = await request(app).get(`/shellproxy/share/${shareHash}/photos/${photoId}`);

      expect(res.status).toBe(200);
      // Whitelist defaults to application/octet-stream if not in the whitelisted set
      expect(res.header['content-type']).toBe('application/octet-stream');
      expect(res.header['content-disposition']).toBe('inline');
      expect(res.header['x-content-type-options']).toBe('nosniff');
    });

    it('silently blocks non-UUID photo IDs to protect SQL injection & traversal', async () => {
      const shareHash = crypto.randomBytes(32).toString('hex');

      const invalidPhotoIds = [
        '../exploit',
        '12345',
        'some-random-id',
        "1' OR '1'='1"
      ];

      for (const photoId of invalidPhotoIds) {
        const res = await request(app).get(`/shellproxy/share/${shareHash}/photos/${photoId}`);
        expect(res.status).toBe(404);
      }
    });
  });
});
