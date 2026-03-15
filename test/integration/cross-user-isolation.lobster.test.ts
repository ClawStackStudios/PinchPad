import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Database from 'better-sqlite3';
import express from 'express';
import request from 'supertest';
import authRouter from '../../src/server/routes/auth';
import notesRouter from '../../src/server/routes/notes';
import agentsRouter from '../../src/server/routes/agents';

describe('Cross-User Data Isolation', () => {
  let db: Database.Database;
  let app: express.Application;

  // User A credentials and token
  const userA = {
    uuid: 'user-a-isolation',
    username: 'useraisolation',
    keyHash: 'user-a-hash',
    displayName: 'User A'
  };
  let tokenA: string;

  // User B credentials and token
  const userB = {
    uuid: 'user-b-isolation',
    username: 'userbisolation',
    keyHash: 'user-b-hash',
    displayName: 'User B'
  };
  let tokenB: string;

  // Shared resource IDs
  let noteAId: string = 'note-a-isolation-1';
  let agentKeyAId: string = 'agent-a-isolation-1';

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
    app.use('/api/agents', agentsRouter);
  });

  afterAll(() => {
    db.close();
  });

  describe('User Registration and Authentication', () => {
    it('1. Register user A', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(userA);

      expect(response.status).toBe(201);
    });

    it('2. Register user B', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(userB);

      expect(response.status).toBe(201);
    });

    it('3. Get token for user A', async () => {
      const response = await request(app)
        .post('/api/auth/token')
        .send({
          uuid: userA.uuid,
          keyHash: userA.keyHash,
          type: 'human'
        });

      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
      tokenA = response.body.token;
    });

    it('4. Get token for user B', async () => {
      const response = await request(app)
        .post('/api/auth/token')
        .send({
          uuid: userB.uuid,
          keyHash: userB.keyHash,
          type: 'human'
        });

      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
      tokenB = response.body.token;
    });
  });

  describe('Note Data Isolation', () => {
    it('5. User A creates a note', async () => {
      const response = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          id: noteAId,
          title: 'User A Private Note',
          content: 'This is only for user A to see'
        });

      expect(response.status).toBe(201);
      expect(response.body.data.id).toBe(noteAId);
    });

    it('6. User A can list their own notes', async () => {
      const response = await request(app)
        .get('/api/notes')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].id).toBe(noteAId);
    });

    it('7. User B\'s GET /api/notes returns empty (cannot see user A\'s notes)', async () => {
      const response = await request(app)
        .get('/api/notes')
        .set('Authorization', `Bearer ${tokenB}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(0);
    });

    it('8. User B cannot PUT to user A\'s note (modify via direct ID)', async () => {
      const response = await request(app)
        .put(`/api/notes/${noteAId}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({
          title: 'Hacked Title',
          content: 'Hacked content'
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Note not found');

      // Verify note was not modified
      const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(noteAId);
      expect(note.title).toBe('User A Private Note');
    });

    it('9. User A can PUT their own note', async () => {
      const response = await request(app)
        .put(`/api/notes/${noteAId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          title: 'Updated by User A',
          content: 'Successfully updated'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.title).toBe('Updated by User A');
    });

    it('10. User B creates their own note', async () => {
      const response = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({
          id: 'note-b-isolation-1',
          title: 'User B Note',
          content: 'Only for user B'
        });

      expect(response.status).toBe(201);
    });

    it('11. User A still cannot see user B\'s note', async () => {
      const response = await request(app)
        .get('/api/notes')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].id).toBe(noteAId);
    });

    it('12. User B cannot DELETE user A\'s note', async () => {
      const response = await request(app)
        .delete(`/api/notes/${noteAId}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(response.status).toBe(404);

      // Verify note still exists
      const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(noteAId);
      expect(note).toBeDefined();
    });

    it('13. User A can DELETE their own note', async () => {
      const response = await request(app)
        .delete(`/api/notes/${noteAId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(response.status).toBe(200);

      // Verify note was deleted
      const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(noteAId);
      expect(note).toBeUndefined();
    });
  });

  describe('Agent Key Data Isolation', () => {
    it('14. User A creates an agent key', async () => {
      const response = await request(app)
        .post('/api/agents')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          id: agentKeyAId,
          name: 'User A Agent',
          permissions: { canRead: true, canWrite: true },
          expiration_type: 'never',
          api_key_hash: 'agent-a-hash-123',
          api_key_encrypted: 'encrypted-key-a'
        });

      expect(response.status).toBe(201);
      expect(response.body.data.id).toBe(agentKeyAId);
    });

    it('15. User A can list their agent keys', async () => {
      const response = await request(app)
        .get('/api/agents')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].id).toBe(agentKeyAId);
    });

    it('16. User B cannot see user A\'s agent keys', async () => {
      const response = await request(app)
        .get('/api/agents')
        .set('Authorization', `Bearer ${tokenB}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(0);
    });

    it('17. User B cannot revoke user A\'s agent key', async () => {
      const response = await request(app)
        .put(`/api/agents/${agentKeyAId}/revoke`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(response.status).toBe(404);

      // Verify key is still active
      const key = db.prepare('SELECT is_active FROM lobster_keys WHERE id = ?').get(agentKeyAId);
      expect(key.is_active).toBe(1);
    });

    it('18. User A can revoke their own agent key', async () => {
      const response = await request(app)
        .put(`/api/agents/${agentKeyAId}/revoke`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(response.status).toBe(200);

      // Verify key is revoked
      const key = db.prepare('SELECT is_active FROM lobster_keys WHERE id = ?').get(agentKeyAId);
      expect(key.is_active).toBe(0);
    });
  });

  describe('Cross-User Attack Scenarios', () => {
    it('19. User B cannot access user A\'s data through direct DB query pattern', async () => {
      // User A creates a note
      db.prepare('INSERT INTO notes (id, user_uuid, title, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)').run(
        'note-attack-test',
        userA.uuid,
        'Secret Note',
        'Secret content',
        new Date().toISOString(),
        new Date().toISOString()
      );

      // User B tries to fetch it via API (should only see their own note from test 10)
      const response = await request(app)
        .get('/api/notes')
        .set('Authorization', `Bearer ${tokenB}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].id).toBe('note-b-isolation-1');
      // Verify user A's attack note is NOT in the results
      expect(response.body.data.some((note: any) => note.id === 'note-attack-test')).toBe(false);
    });

    it('20. Unauthenticated request cannot access any user data', async () => {
      const response = await request(app)
        .get('/api/notes');

      expect(response.status).toBe(401);
    });

    it('21. Invalid token cannot access any user data', async () => {
      const response = await request(app)
        .get('/api/notes')
        .set('Authorization', 'Bearer invalid-token-xyz');

      expect(response.status).toBe(401);
    });
  });

  describe('User Deletion Cascade', () => {
    let deleteUserUuid: string;
    let deleteUserToken: string;

    it('22. Create user for deletion test', async () => {
      deleteUserUuid = 'user-delete-test';
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          uuid: deleteUserUuid,
          username: 'deleteuser',
          displayName: 'Delete User',
          keyHash: 'delete-hash'
        });

      expect(response.status).toBe(201);

      const tokenResponse = await request(app)
        .post('/api/auth/token')
        .send({
          uuid: deleteUserUuid,
          keyHash: 'delete-hash',
          type: 'human'
        });

      deleteUserToken = tokenResponse.body.token;
    });

    it('23. User can create resources before deletion', async () => {
      await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${deleteUserToken}`)
        .send({
          id: 'note-delete-1',
          title: 'To be deleted',
          content: 'With user'
        });

      const note = db.prepare('SELECT * FROM notes WHERE user_uuid = ?').get(deleteUserUuid);
      expect(note).toBeDefined();
    });

    it('24. Manual cleanup of user deletes cascading data', () => {
      // Simulate user deletion
      db.prepare('DELETE FROM users WHERE uuid = ?').run(deleteUserUuid);

      // Verify user is deleted
      const user = db.prepare('SELECT * FROM users WHERE uuid = ?').get(deleteUserUuid);
      expect(user).toBeUndefined();

      // Verify cascading delete worked (with foreign key constraints)
      const tokens = db.prepare('SELECT * FROM api_tokens WHERE owner_uuid = ?').all(deleteUserUuid);
      expect(tokens).toHaveLength(0);

      const notes = db.prepare('SELECT * FROM notes WHERE user_uuid = ?').all(deleteUserUuid);
      expect(notes).toHaveLength(0);
    });
  });
});
