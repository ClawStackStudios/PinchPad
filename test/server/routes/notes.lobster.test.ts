/// <reference types="vitest" />
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestApp, createTestUser, createTestToken } from '../../shared/app';
import { Express } from 'express';
import Database from 'better-sqlite3-multiple-ciphers';
import crypto from 'crypto';

describe('Notes Routes', () => {
  let app: Express;
  let db: Database.Database;
  let userUuid: string;
  let token: string;
  let noteId: string;

  beforeEach(() => {
    const testSetup = createTestApp();
    app = testSetup.app;
    db = testSetup.db;

    userUuid = createTestUser(db);
    token = createTestToken(db, userUuid);
    noteId = crypto.randomUUID();
  });

  describe('GET /api/notes', () => {
    it('returns empty array for new user', async () => {
      const res = await request(app)
        .get('/api/notes')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });

    it('returns notes created by this user only', async () => {
      // Create note as user1
      await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${token}`)
        .send({
          id: noteId,
          title: 'My Note',
          content: 'My Content'
        });

      // Get notes as user1
      const res = await request(app)
        .get('/api/notes')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].id).toBe(noteId);
    });

    it('requires authorization', async () => {
      const res = await request(app).get('/api/notes');
      expect(res.status).toBe(401);
    });

    it.skip('rejects expired token', async () => {
      // expires_at column removed - tokens don't expire anymore
      // Create an expired token
      const expiredToken = `api-${Math.random().toString(36).slice(2, 34)}`;
      db.prepare('INSERT INTO api_tokens (key, owner_key, created_at) VALUES (?, ?, ?)').run(
        expiredToken,
        userUuid,
        new Date().toISOString()
      );

      const res = await request(app)
        .get('/api/notes')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/notes', () => {
    it('creates a note with required fields', async () => {
      const res = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${token}`)
        .send({
          id: noteId,
          title: 'Test Note',
          content: 'Test Content'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBe(noteId);
      expect(res.body.data.title).toBe('Test Note');
      expect(res.body.data.content).toBe('Test Content');
      expect(res.body.data.starred).toBe(0);
      expect(res.body.data.pinned).toBe(0);
    });

    it('requires id, title, and content', async () => {
      const res = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Missing id and content' });

      expect(res.status).toBe(400);
    });

    it('sets default values for starred and pinned', async () => {
      const res = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${token}`)
        .send({
          id: noteId,
          title: 'Test',
          content: 'Content'
        });

      expect(res.body.data.starred).toBe(0);
      expect(res.body.data.pinned).toBe(0);
    });

    it('accepts initial starred and pinned values', async () => {
      const res = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${token}`)
        .send({
          id: noteId,
          title: 'Test',
          content: 'Content',
          starred: 1,
          pinned: 1
        });

      expect(res.body.data.starred).toBe(1);
      expect(res.body.data.pinned).toBe(1);
    });

    it('requires authorization', async () => {
      const res = await request(app)
        .post('/api/notes')
        .send({
          id: noteId,
          title: 'Test',
          content: 'Content'
        });

      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/notes/:id', () => {
    it('updates an existing note', async () => {
      // Create
      await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${token}`)
        .send({ id: noteId, title: 'Original', content: 'Original' });

      // Update
      const res = await request(app)
        .put(`/api/notes/${noteId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Updated', content: 'Updated', starred: 1 });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Updated');
      expect(res.body.data.content).toBe('Updated');
      expect(res.body.data.starred).toBe(1);
    });

    it('updates multiple fields independently', async () => {
      // Create
      await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${token}`)
        .send({ id: noteId, title: 'Original', content: 'Original' });

      // Update only title
      const res = await request(app)
        .put(`/api/notes/${noteId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'New Title', content: 'Original' });

      expect(res.body.data.title).toBe('New Title');
      expect(res.body.data.content).toBe('Original');
    });

    it('returns 404 for non-existent note', async () => {
      const res = await request(app)
        .put(`/api/notes/nonexistent`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'New', content: 'New' });

      expect(res.status).toBe(404);
    });

    it('allows partial updates', async () => {
      await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${token}`)
        .send({ id: noteId, title: 'Test', content: 'Test' });

      const res = await request(app)
        .put(`/api/notes/${noteId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Updated Title' });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Updated Title');
      expect(res.body.data.content).toBe('Test'); // Unchanged
    });
  });

  describe('PATCH /api/notes/:id/starred', () => {
    it('toggles starred flag to true', async () => {
      // Create
      await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${token}`)
        .send({ id: noteId, title: 'Test', content: 'Test' });

      // Star it
      const res = await request(app)
        .patch(`/api/notes/${noteId}/starred`)
        .set('Authorization', `Bearer ${token}`)
        .send({ starred: 1 });

      expect(res.status).toBe(200);
      expect(res.body.data.success).toBe(true);

      // Verify the note was actually starred
      const note = db.prepare('SELECT starred FROM notes WHERE id = ?').get(noteId) as any;
      expect(note.starred).toBe(1);
    });

    it('toggles starred flag to false', async () => {
      // Create with starred
      await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${token}`)
        .send({ id: noteId, title: 'Test', content: 'Test', starred: 1 });

      // Unstar it
      const res = await request(app)
        .patch(`/api/notes/${noteId}/starred`)
        .set('Authorization', `Bearer ${token}`)
        .send({ starred: 0 });

      expect(res.status).toBe(200);
      expect(res.body.data.success).toBe(true);

      // Verify the note was actually unstarred
      const note = db.prepare('SELECT starred FROM notes WHERE id = ?').get(noteId) as any;
      expect(note.starred).toBe(0);
    });

    it('returns 404 for non-existent note', async () => {
      const res = await request(app)
        .patch(`/api/notes/nonexistent/starred`)
        .set('Authorization', `Bearer ${token}`)
        .send({ starred: 1 });

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/notes/:id/pinned', () => {
    it('toggles pinned flag to true', async () => {
      // Create
      await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${token}`)
        .send({ id: noteId, title: 'Test', content: 'Test' });

      // Pin it
      const res = await request(app)
        .patch(`/api/notes/${noteId}/pinned`)
        .set('Authorization', `Bearer ${token}`)
        .send({ pinned: 1 });

      expect(res.status).toBe(200);
      expect(res.body.data.success).toBe(true);

      // Verify the note was actually pinned
      const note = db.prepare('SELECT pinned FROM notes WHERE id = ?').get(noteId) as any;
      expect(note.pinned).toBe(1);
    });

    it('toggles pinned flag to false', async () => {
      // Create with pinned
      await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${token}`)
        .send({ id: noteId, title: 'Test', content: 'Test', pinned: 1 });

      // Unpin it
      const res = await request(app)
        .patch(`/api/notes/${noteId}/pinned`)
        .set('Authorization', `Bearer ${token}`)
        .send({ pinned: 0 });

      expect(res.status).toBe(200);
      expect(res.body.data.success).toBe(true);

      // Verify the note was actually unpinned
      const note = db.prepare('SELECT pinned FROM notes WHERE id = ?').get(noteId) as any;
      expect(note.pinned).toBe(0);
    });

    it('returns 404 for non-existent note', async () => {
      const res = await request(app)
        .patch(`/api/notes/nonexistent/pinned`)
        .set('Authorization', `Bearer ${token}`)
        .send({ pinned: 1 });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/notes/:id', () => {
    it('deletes an existing note', async () => {
      // Create
      await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${token}`)
        .send({ id: noteId, title: 'Test', content: 'Test' });

      // Delete
      const res = await request(app)
        .delete(`/api/notes/${noteId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.success).toBe(true);

      // Verify it's gone
      const getRes = await request(app)
        .get(`/api/notes`)
        .set('Authorization', `Bearer ${token}`);

      expect(getRes.body.data).toHaveLength(0);
    });

    it('returns 404 for non-existent note', async () => {
      const res = await request(app)
        .delete(`/api/notes/nonexistent`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });

    it('requires authorization', async () => {
      const res = await request(app)
        .delete(`/api/notes/${noteId}`);

      expect(res.status).toBe(401);
    });
  });

  describe('Cross-user isolation', () => {
    it('prevents user A from reading user B notes', async () => {
      const userB = createTestUser(db, 'userb');
      const tokenB = createTestToken(db, userB);

      // User A creates note
      await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${token}`)
        .send({ id: noteId, title: 'User A note', content: 'Private' });

      // User B tries to read it
      const res = await request(app)
        .get('/api/notes')
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.body.data).toHaveLength(0);
    });

    it('prevents user A from updating user B notes', async () => {
      const userB = createTestUser(db, 'userb');
      const tokenB = createTestToken(db, userB);

      // User A creates note
      await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${token}`)
        .send({ id: noteId, title: 'User A note', content: 'Original' });

      // User B tries to update it
      const res = await request(app)
        .put(`/api/notes/${noteId}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ title: 'Hacked', content: 'Hacked' });

      expect(res.status).toBe(404);
    });

    it('prevents user A from deleting user B notes', async () => {
      const userB = createTestUser(db, 'userb');
      const tokenB = createTestToken(db, userB);

      // User A creates note
      await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${token}`)
        .send({ id: noteId, title: 'User A note', content: 'Private' });

      // User B tries to delete it
      const res = await request(app)
        .delete(`/api/notes/${noteId}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(404);

      // Verify it still exists for user A
      const getRes = await request(app)
        .get('/api/notes')
        .set('Authorization', `Bearer ${token}`);

      expect(getRes.body.data).toHaveLength(1);
    });
  });

  describe('Permission-based access control', () => {
    it('requires canRead permission for GET', async () => {
      // Create a lobster key without canRead
      const lobsterKeyId = crypto.randomUUID();
      const lobsterApiKey = `lb-${crypto.randomBytes(24).toString('hex')}`;
      db.prepare(`
        INSERT INTO agent_keys (id, user_uuid, name, description, api_key, permissions, expiration_type, expiration_date, rate_limit, is_active, created_at, last_used)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        lobsterKeyId,
        userUuid,
        'No Read Key',
        null,
        lobsterApiKey, // Store plain key
        JSON.stringify({ canRead: false }),
        'never',
        null,
        null,
        1,
        new Date().toISOString(),
        null
      );

      const lobsterToken = createTestToken(db, userUuid, 'agent', lobsterKeyId);

      const res = await request(app)
        .get('/api/notes')
        .set('Authorization', `Bearer ${lobsterToken}`);

      expect(res.status).toBe(403);
    });

    it('requires canWrite permission for POST', async () => {
      const lobsterKeyId = crypto.randomUUID();
      const lobsterApiKey = `lb-${crypto.randomBytes(24).toString('hex')}`;
      db.prepare(`
        INSERT INTO agent_keys (id, user_uuid, name, description, api_key, permissions, expiration_type, expiration_date, rate_limit, is_active, created_at, last_used)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        lobsterKeyId,
        userUuid,
        'No Write Key',
        null,
        lobsterApiKey, // Store plain key
        JSON.stringify({ canRead: true, canWrite: false }),
        'never',
        null,
        null,
        1,
        new Date().toISOString(),
        null
      );

      const lobsterToken = createTestToken(db, userUuid, 'agent', lobsterKeyId);

      const res = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${lobsterToken}`)
        .send({ id: noteId, title: 'Test', content: 'Content' });

      expect(res.status).toBe(403);
    });
  });

  describe('Timestamp handling', () => {
    it('sets created_at and updated_at on creation', async () => {
      const beforeTime = new Date();
      const res = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${token}`)
        .send({ id: noteId, title: 'Test', content: 'Content' });
      const afterTime = new Date();

      expect(res.body.data.created_at).toBeDefined();
      expect(res.body.data.updated_at).toBeDefined();

      const createdAt = new Date(res.body.data.created_at);
      const updatedAt = new Date(res.body.data.updated_at);

      expect(createdAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(createdAt.getTime()).toBeLessThanOrEqual(afterTime.getTime());
      expect(updatedAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
    });

    it('updates updated_at when note is modified', async () => {
      // Create
      const createRes = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${token}`)
        .send({ id: noteId, title: 'Test', content: 'Content' });

      const createdAt = createRes.body.data.created_at;

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100));

      // Update
      const updateRes = await request(app)
        .put(`/api/notes/${noteId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Updated', content: 'Updated' });

      const updatedAt = updateRes.body.data.updated_at;

      expect(new Date(updatedAt).getTime()).toBeGreaterThan(new Date(createdAt).getTime());
    });
  });
});
