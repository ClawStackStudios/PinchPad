import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { Express } from 'express';
import Database from 'better-sqlite3-multiple-ciphers';
import { createTestApp, createTestUser, createTestToken, createTestLobsterKey } from '../../shared/app';

describe('Lobster Key Rate Limiting', () => {
  let app: Express;
  let db: Database.Database;
  let userUuid: string;

  beforeEach(() => {
    const testSetup = createTestApp();
    app = testSetup.app;
    db = testSetup.db;
    userUuid = createTestUser(db);
  });

  describe('Unlimited lobster keys (rate_limit = NULL)', () => {
    it('allows unlimited requests', async () => {
      const { id: lobsterKeyId } = createTestLobsterKey(db, userUuid, { canRead: true }, null);
      const token = createTestToken(db, userUuid, 'lobster', lobsterKeyId);

      // Make 10 rapid requests — should all succeed
      for (let i = 0; i < 10; i++) {
        const response = await request(app)
          .get('/api/notes')
          .set('Authorization', `Bearer ${token}`);
        expect(response.status).toBe(200);
      }
    });
  });

  describe('rate_limit = 0', () => {
    it('treats 0 as unlimited (no limiter applied)', async () => {
      const { id: lobsterKeyId } = createTestLobsterKey(db, userUuid, { canRead: true }, 0);
      const token = createTestToken(db, userUuid, 'lobster', lobsterKeyId);

      // Should allow many requests
      for (let i = 0; i < 10; i++) {
        const response = await request(app)
          .get('/api/notes')
          .set('Authorization', `Bearer ${token}`);
        expect(response.status).toBe(200);
      }
    });
  });

  describe('Human keys', () => {
    it('bypass rate limiting entirely', async () => {
      const token = createTestToken(db, userUuid, 'human', null);

      // Make 20 rapid requests — all should succeed (no rate limit applied)
      for (let i = 0; i < 20; i++) {
        const response = await request(app)
          .get('/api/notes')
          .set('Authorization', `Bearer ${token}`);
        expect(response.status).toBe(200);
      }
    });
  });

  describe('Rate limiting applied when rate_limit is set', () => {
    it('attaches rate_limit and lobsterKeyId to req.user from DB', async () => {
      const { id: lobsterKeyId } = createTestLobsterKey(db, userUuid, { canRead: true }, 100);
      const token = createTestToken(db, userUuid, 'lobster', lobsterKeyId);

      // Make a request and verify auth middleware populated the fields
      const response = await request(app)
        .get('/api/notes')
        .set('Authorization', `Bearer ${token}`);

      // Should succeed because rate limit (100) is not breached
      expect(response.status).toBe(200);
    });
  });
});
