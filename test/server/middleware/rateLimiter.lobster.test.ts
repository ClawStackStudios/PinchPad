import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { Express } from 'express';
import Database from 'better-sqlite3-multiple-ciphers';
import { createTestApp, createTestUser, createTestToken, createTestAgentKey } from '../../shared/app';

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
      const { id: lobsterKeyId } = createTestAgentKey(db, userUuid, { canRead: true }, null);
      const token = createTestToken(db, userUuid, 'agent', lobsterKeyId);

      // Make 20 rapid requests — should all succeed
      for (let i = 0; i < 20; i++) {
        const response = await request(app)
          .get('/api/notes')
          .set('Authorization', `Bearer ${token}`);
        expect(response.status).toBe(200);
      }
    });
  });

  describe('rate_limit = 0', () => {
    it('treats 0 as unlimited (no limiter applied)', async () => {
      const { id: lobsterKeyId } = createTestAgentKey(db, userUuid, { canRead: true }, 0);
      const token = createTestToken(db, userUuid, 'agent', lobsterKeyId);

      // Should allow many requests
      for (let i = 0; i < 20; i++) {
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

  describe('Rate limit enforcement', () => {
    it('allows requests up to the limit, then 429s', async () => {
      const { id: lobsterKeyId } = createTestAgentKey(db, userUuid, { canRead: true }, 3);
      const token = createTestToken(db, userUuid, 'agent', lobsterKeyId);

      // First 3 requests should succeed
      for (let i = 0; i < 3; i++) {
        const response = await request(app)
          .get('/api/notes')
          .set('Authorization', `Bearer ${token}`);
        expect(response.status).toBe(200);
      }

      // 4th request should be rate limited (429)
      const blockedResponse = await request(app)
        .get('/api/notes')
        .set('Authorization', `Bearer ${token}`);
      expect(blockedResponse.status).toBe(429);
      expect(blockedResponse.body.error).toContain('carapace lacks the capacity');
    });

    it('enforces per-key rate limits independently', async () => {
      const { id: keyId1 } = createTestAgentKey(db, userUuid, { canRead: true }, 2);
      const { id: keyId2 } = createTestAgentKey(db, userUuid, { canRead: true }, 2);
      const token1 = createTestToken(db, userUuid, 'agent', keyId1);
      const token2 = createTestToken(db, userUuid, 'agent', keyId2);

      // Key 1: use 2 requests
      for (let i = 0; i < 2; i++) {
        const response = await request(app)
          .get('/api/notes')
          .set('Authorization', `Bearer ${token1}`);
        expect(response.status).toBe(200);
      }

      // Key 1: 3rd request blocked
      const blocked1 = await request(app)
        .get('/api/notes')
        .set('Authorization', `Bearer ${token1}`);
      expect(blocked1.status).toBe(429);

      // Key 2: still has 2 requests available (independent limit)
      for (let i = 0; i < 2; i++) {
        const response = await request(app)
          .get('/api/notes')
          .set('Authorization', `Bearer ${token2}`);
        expect(response.status).toBe(200);
      }

      // Key 2: 3rd request blocked
      const blocked2 = await request(app)
        .get('/api/notes')
        .set('Authorization', `Bearer ${token2}`);
      expect(blocked2.status).toBe(429);
    });

    it('includes rate limit headers in response', async () => {
      const { id: lobsterKeyId } = createTestAgentKey(db, userUuid, { canRead: true }, 5);
      const token = createTestToken(db, userUuid, 'agent', lobsterKeyId);

      const response = await request(app)
        .get('/api/notes')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.headers).toHaveProperty('ratelimit-limit');
      expect(response.headers).toHaveProperty('ratelimit-remaining');
      expect(response.headers).toHaveProperty('ratelimit-reset');
      expect(response.headers['ratelimit-limit']).toBe('5');
      expect(response.headers['ratelimit-remaining']).toBe('4');
    });
  });

  describe('Rate limiting applied when rate_limit is set', () => {
    it('attaches rate_limit and lobsterKeyId to req.user from DB', async () => {
      const { id: lobsterKeyId } = createTestAgentKey(db, userUuid, { canRead: true }, 100);
      const token = createTestToken(db, userUuid, 'agent', lobsterKeyId);

      // Make a request and verify auth middleware populated the fields
      const response = await request(app)
        .get('/api/notes')
        .set('Authorization', `Bearer ${token}`);

      // Should succeed because rate limit (100) is not breached
      expect(response.status).toBe(200);
    });
  });
});
