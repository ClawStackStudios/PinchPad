import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestApp, createTestUser, createTestAgentKey, createTestToken } from '../../shared/app';

describe('Pots API (Lobster Key Permissions)', () => {
  let app: any;
  let db: any;
  let userUuid: string;
  let humanToken: string;

  beforeEach(() => {
    const testSetup = createTestApp();
    app = testSetup.app;
    db = testSetup.db;
    userUuid = createTestUser(db);
    humanToken = createTestToken(db, userUuid, 'human');
  });

  describe('GET /api/pots', () => {
    it('should allow agent with canRead: true to list pots', async () => {
      const { apiKey } = createTestAgentKey(db, userUuid, { canRead: true });
      const agentToken = createTestToken(db, userUuid, 'agent', null);
      // Wait, createTestToken needs the agentKey string for owner_key if type is agent
      db.prepare('UPDATE api_tokens SET owner_key = ? WHERE key = ?').run(apiKey, agentToken);

      await request(app)
        .post('/api/pots')
        .set('Authorization', `Bearer ${humanToken}`)
        .send({ name: 'Test Pot', color: '#ff0000' });

      const res = await request(app)
        .get('/api/pots')
        .set('Authorization', `Bearer ${agentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toBe('Test Pot');
    });

    it('should deny agent with canRead: false', async () => {
      const { apiKey } = createTestAgentKey(db, userUuid, { canRead: false });
      const agentToken = createTestToken(db, userUuid, 'agent', null);
      db.prepare('UPDATE api_tokens SET owner_key = ? WHERE key = ?').run(apiKey, agentToken);

      const res = await request(app)
        .get('/api/pots')
        .set('Authorization', `Bearer ${agentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('permission');
    });
  });

  describe('POST /api/pots', () => {
    it('should allow agent with canWrite: true to create pot', async () => {
      const { apiKey } = createTestAgentKey(db, userUuid, { canWrite: true });
      const agentToken = createTestToken(db, userUuid, 'agent', null);
      db.prepare('UPDATE api_tokens SET owner_key = ? WHERE key = ?').run(apiKey, agentToken);

      const res = await request(app)
        .post('/api/pots')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({ name: 'Agent Pot', color: '#00ff00' });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Agent Pot');
    });

    it('should deny agent with canWrite: false', async () => {
      const { apiKey } = createTestAgentKey(db, userUuid, { canWrite: false });
      const agentToken = createTestToken(db, userUuid, 'agent', null);
      db.prepare('UPDATE api_tokens SET owner_key = ? WHERE key = ?').run(apiKey, agentToken);

      const res = await request(app)
        .post('/api/pots')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({ name: 'Forbidden Pot' });

      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /api/pots/:id', () => {
    it('should allow agent with canEdit: true to update pot', async () => {
      const { apiKey } = createTestAgentKey(db, userUuid, { canEdit: true });
      const agentToken = createTestToken(db, userUuid, 'agent', null);
      db.prepare('UPDATE api_tokens SET owner_key = ? WHERE key = ?').run(apiKey, agentToken);

      const setup = await request(app)
        .post('/api/pots')
        .set('Authorization', `Bearer ${humanToken}`)
        .send({ name: 'Old Name' });
      const potId = setup.body.data.id;

      const res = await request(app)
        .patch(`/api/pots/${potId}`)
        .set('Authorization', `Bearer ${agentToken}`)
        .send({ name: 'New Name' });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('New Name');
    });
  });

  describe('DELETE /api/pots/:id', () => {
    it('should allow agent with canDelete: true to delete pot', async () => {
      const { apiKey } = createTestAgentKey(db, userUuid, { canDelete: true });
      const agentToken = createTestToken(db, userUuid, 'agent', null);
      db.prepare('UPDATE api_tokens SET owner_key = ? WHERE key = ?').run(apiKey, agentToken);

      const setup = await request(app)
        .post('/api/pots')
        .set('Authorization', `Bearer ${humanToken}`)
        .send({ name: 'To Delete' });
      const potId = setup.body.data.id;

      const res = await request(app)
        .delete(`/api/pots/${potId}`)
        .set('Authorization', `Bearer ${agentToken}`);

      expect(res.status).toBe(200);
      const check = db.prepare('SELECT * FROM pots WHERE id = ?').get(potId);
      expect(check).toBeUndefined();
    });
  });
});
