import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestApp, createTestUser, createTestAgentKey, createTestToken } from '../shared/app';

describe('Lobster Key Permission Matrix', () => {
  let app: any;
  let db: any;
  let userUuid: string;
  let humanToken: string;
  let pearlId: string;
  let potId: string;

  beforeEach(async () => {
    const testSetup = createTestApp();
    app = testSetup.app;
    db = testSetup.db;
    userUuid = createTestUser(db);
    humanToken = createTestToken(db, userUuid, 'human');

    // Create a pearl and a pot for testing
    const pRes = await request(app)
      .post('/api/notes')
      .set('Authorization', `Bearer ${humanToken}`)
      .send({ title: 'Matrix Pearl', content: 'Base content' });
    pearlId = pRes.body.data.id;

    const potRes = await request(app)
      .post('/api/pots')
      .set('Authorization', `Bearer ${humanToken}`)
      .send({ name: 'Matrix Pot' });
    potId = potRes.body.data.id;
  });

  const getAgentToken = (permissions: any) => {
    const { apiKey } = createTestAgentKey(db, userUuid, permissions);
    const token = createTestToken(db, userUuid, 'agent', null);
    db.prepare('UPDATE api_tokens SET owner_key = ? WHERE key = ?').run(apiKey, token);
    return token;
  };

  const testMatrix = [
    { name: 'GET /api/notes', path: '/api/notes', method: 'get', permission: 'canRead' },
    { name: 'POST /api/notes', path: '/api/notes', method: 'post', body: { title: 'New', content: 'C' }, permission: 'canWrite' },
    { name: 'PUT /api/notes/:id', path: () => `/api/notes/${pearlId}`, method: 'put', body: { title: 'U', content: 'C' }, permission: 'canEdit' },
    { name: 'PATCH /api/notes/:id/starred', path: () => `/api/notes/${pearlId}/starred`, method: 'patch', body: { value: true }, permission: 'canEdit' },
    { name: 'DELETE /api/notes/:id', path: () => `/api/notes/${pearlId}`, method: 'delete', permission: 'canDelete' },
    { name: 'GET /api/notes/export', path: '/api/notes/export', method: 'get', permission: 'canRead' },
    { name: 'GET /api/pots', path: '/api/pots', method: 'get', permission: 'canRead' },
    { name: 'POST /api/pots', path: '/api/pots', method: 'post', body: { name: 'P' }, permission: 'canWrite' },
    { name: 'PATCH /api/pots/:id', path: () => `/api/pots/${potId}`, method: 'patch', body: { name: 'U' }, permission: 'canEdit' },
    { name: 'DELETE /api/pots/:id', path: () => `/api/pots/${potId}`, method: 'delete', permission: 'canDelete' },
    { name: 'POST /api/photos/upload', path: '/api/photos/upload', method: 'post', type: 'multipart', permission: 'canWrite' },
    { name: 'DELETE /api/photos/:id', path: '/api/photos/fake', method: 'delete', permission: 'canDelete' },
  ];

  testMatrix.forEach(route => {
    describe(route.name, () => {
      it(`should allow access if ${route.permission} is true`, async () => {
        const token = getAgentToken({ [route.permission]: true });
        const path = typeof route.path === 'function' ? route.path() : route.path;
        
        let req = (request(app) as any)[route.method](path).set('Authorization', `Bearer ${token}`);
        if (route.type === 'multipart') {
          req = req.field('pearlId', pearlId).attach('photo', Buffer.from('data'), 't.png');
        } else if (route.body) {
          req = req.send(route.body);
        }

        const res = await req;
        // 200, 201, 207 (bulk), or 404 (if we deleted/targeted non-existent) are all "authorized" in this context
        // We just want to make sure it isn't 403
        expect(res.status).not.toBe(403);
      });

      it(`should deny access if ${route.permission} is false`, async () => {
        const token = getAgentToken({ [route.permission]: false });
        const path = typeof route.path === 'function' ? route.path() : route.path;
        
        let req = (request(app) as any)[route.method](path).set('Authorization', `Bearer ${token}`);
        if (route.type === 'multipart') {
          req = req.field('pearlId', pearlId).attach('photo', Buffer.from('data'), 't.png');
        } else if (route.body) {
          req = req.send(route.body);
        }

        const res = await req;
        expect(res.status).toBe(403);
      });
    });
  });

  describe('Human-Only Routes', () => {
    const humanRoutes = [
      { name: 'GET /api/agents', path: '/api/agents', method: 'get' },
      { name: 'POST /api/agents', path: '/api/agents', method: 'post', body: { name: 'A', apiKey: 'lb-x' } },
      { name: 'POST /api/lobster-session/start', path: '/api/lobster-session/start', method: 'post' },
    ];

    humanRoutes.forEach(route => {
      it(`${route.name} should deny any agent token regardless of permissions`, async () => {
        const token = getAgentToken({ canRead: true, canWrite: true, canEdit: true, canDelete: true });
        const res = await (request(app) as any)[route.method](route.path)
          .set('Authorization', `Bearer ${token}`)
          .send(route.body || {});
        
        expect(res.status).toBe(403);
        expect(res.body.error).toContain('Human identity');
      });
    });
  });
});
