import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestApp, createTestUser, createTestAgentKey, createTestToken } from '../../shared/app';
import crypto from 'crypto';

describe('Photos API (Lobster Key Permissions)', () => {
  let app: any;
  let db: any;
  let userUuid: string;
  let humanToken: string;
  let pearlId: string;

  beforeEach(async () => {
    const testSetup = createTestApp();
    app = testSetup.app;
    db = testSetup.db;
    userUuid = createTestUser(db);
    humanToken = createTestToken(db, userUuid, 'human');

    const pearlRes = await request(app)
      .post('/api/notes')
      .set('Authorization', `Bearer ${humanToken}`)
      .send({ title: 'Photo Pearl', content: 'Testing photos' });
    pearlId = pearlRes.body.data.id;
  });

  describe('POST /api/photos/upload', () => {
    it('should allow agent with canWrite: true to upload photo', async () => {
      const { apiKey } = createTestAgentKey(db, userUuid, { canWrite: true });
      const agentToken = createTestToken(db, userUuid, 'agent', null);
      db.prepare('UPDATE api_tokens SET owner_key = ? WHERE key = ?').run(apiKey, agentToken);

      const res = await request(app)
        .post('/api/photos/upload')
        .set('Authorization', `Bearer ${agentToken}`)
        .field('pearlId', pearlId)
        .attach('photo', Buffer.from('fake-image-data'), 'test.png');

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.url).toContain('/api/photos/');
    });

    it('should deny agent with canWrite: false', async () => {
      const { apiKey } = createTestAgentKey(db, userUuid, { canWrite: false });
      const agentToken = createTestToken(db, userUuid, 'agent', null);
      db.prepare('UPDATE api_tokens SET owner_key = ? WHERE key = ?').run(apiKey, agentToken);

      const res = await request(app)
        .post('/api/photos/upload')
        .set('Authorization', `Bearer ${agentToken}`)
        .field('pearlId', pearlId)
        .attach('photo', Buffer.from('fake-image-data'), 'test.png');

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/photos/:id', () => {
    it('should require authentication (Option A fix)', async () => {
      // Create a photo first
      const uploadRes = await request(app)
        .post('/api/photos/upload')
        .set('Authorization', `Bearer ${humanToken}`)
        .field('pearlId', pearlId)
        .attach('photo', Buffer.from('image-data'), 'img.png');
      const photoId = uploadRes.body.data.id;

      const res = await request(app).get(`/api/photos/${photoId}`);
      expect(res.status).toBe(401);
    });

    it('should allow agent with canRead: true to view photo', async () => {
      const { apiKey } = createTestAgentKey(db, userUuid, { canRead: true });
      const agentToken = createTestToken(db, userUuid, 'agent', null);
      db.prepare('UPDATE api_tokens SET owner_key = ? WHERE key = ?').run(apiKey, agentToken);

      const uploadRes = await request(app)
        .post('/api/photos/upload')
        .set('Authorization', `Bearer ${humanToken}`)
        .field('pearlId', pearlId)
        .attach('photo', Buffer.from('image-data'), 'img.png');
      const photoId = uploadRes.body.data.id;

      const res = await request(app)
        .get(`/api/photos/${photoId}`)
        .set('Authorization', `Bearer ${agentToken}`);

      expect(res.status).toBe(200);
      expect(res.header['content-type']).toBe('image/png');
    });

    it('should deny access to photo from another user', async () => {
      const otherUser = createTestUser(db, 'other');
      const otherToken = createTestToken(db, otherUser, 'human');

      const uploadRes = await request(app)
        .post('/api/photos/upload')
        .set('Authorization', `Bearer ${humanToken}`)
        .field('pearlId', pearlId)
        .attach('photo', Buffer.from('image-data'), 'img.png');
      const photoId = uploadRes.body.data.id;

      const res = await request(app)
        .get(`/api/photos/${photoId}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('access denied');
    });
  });

  describe('DELETE /api/photos/:id', () => {
    it('should allow agent with canDelete: true to delete photo', async () => {
      const { apiKey } = createTestAgentKey(db, userUuid, { canDelete: true });
      const agentToken = createTestToken(db, userUuid, 'agent', null);
      db.prepare('UPDATE api_tokens SET owner_key = ? WHERE key = ?').run(apiKey, agentToken);

      const uploadRes = await request(app)
        .post('/api/photos/upload')
        .set('Authorization', `Bearer ${humanToken}`)
        .field('pearlId', pearlId)
        .attach('photo', Buffer.from('image-data'), 'img.png');
      const photoId = uploadRes.body.data.id;

      const res = await request(app)
        .delete(`/api/photos/${photoId}`)
        .set('Authorization', `Bearer ${agentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
