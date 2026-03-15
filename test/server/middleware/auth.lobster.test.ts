import { describe, it, expect, beforeEach } from 'vitest';
import { requireAuth, requirePermission, requireHuman, AuthRequest } from '../../../src/server/middleware/auth';
import { Response, NextFunction } from 'express';
import { createTestApp, createTestUser, createTestToken, createTestLobsterKey } from '../../shared/app';
import request from 'supertest';
import { Express } from 'express';
import Database from 'better-sqlite3';
import { vi } from 'vitest';

describe('Auth Middleware', () => {
  describe('requireAuth via HTTP', () => {
    let app: Express;
    let db: Database.Database;
    let userUuid: string;
    let validToken: string;

    beforeEach(() => {
      const testSetup = createTestApp();
      app = testSetup.app;
      db = testSetup.db;
      userUuid = createTestUser(db);
      validToken = createTestToken(db, userUuid);
    });

    it('allows request with valid token', async () => {
      const response = await request(app)
        .get('/api/notes')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
    });

    it('rejects request without token', async () => {
      const response = await request(app).get('/api/notes');

      expect(response.status).toBe(401);
    });

    it('rejects request with invalid token', async () => {
      const response = await request(app)
        .get('/api/notes')
        .set('Authorization', 'Bearer invalid-token-xyz');

      expect(response.status).toBe(401);
    });

    it('rejects expired token and deletes it', async () => {
      // Create an expired token
      const expiredToken = `api-${Math.random().toString(36).slice(2, 34)}`;
      db.prepare('INSERT INTO api_tokens (key, owner_uuid, owner_type, expires_at, created_at) VALUES (?, ?, ?, ?, ?)').run(
        expiredToken,
        userUuid,
        'human',
        new Date(Date.now() - 1000).toISOString(),
        new Date().toISOString()
      );

      // Try to use the expired token
      const response = await request(app)
        .get('/api/notes')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);

      // Verify token was deleted
      const token = db.prepare('SELECT * FROM api_tokens WHERE key = ?').get(expiredToken);
      expect(token).toBeUndefined();
    });

    it('attaches permissions from lobster key', async () => {
      const lobsterUserUuid = createTestUser(db, 'lobsteruser');
      const { id: lobsterKeyId } = createTestLobsterKey(db, lobsterUserUuid, { canRead: true, canWrite: false });
      const lobsterToken = createTestToken(db, lobsterUserUuid, 'lobster', lobsterKeyId);

      const response = await request(app)
        .get('/api/notes')
        .set('Authorization', `Bearer ${lobsterToken}`);

      // Should succeed with read permission
      expect(response.status).toBe(200);
    });
  });

  describe('requirePermission (direct unit tests)', () => {
    let mockRes: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
      mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis()
      };
      mockNext = vi.fn();
    });

    it('allows human type to pass all permissions', () => {
      const req: Partial<AuthRequest> = {
        user: { uuid: 'test-uuid', keyType: 'human', permissions: {} }
      } as any;

      const middleware = requirePermission('canWrite');
      middleware(req as any, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('allows lobster with required permission', () => {
      const req: Partial<AuthRequest> = {
        user: { uuid: 'test-uuid', keyType: 'lobster', permissions: { canRead: true, canWrite: true } }
      } as any;

      const middleware = requirePermission('canWrite');
      middleware(req as any, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('blocks lobster key without required permission', () => {
      const req: Partial<AuthRequest> = {
        user: { uuid: 'test-uuid', keyType: 'lobster', permissions: { canRead: true, canWrite: false } }
      } as any;

      const middleware = requirePermission('canWrite');
      middleware(req as any, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('blocks unauthenticated request', () => {
      const req: Partial<AuthRequest> = { user: undefined } as any;

      const middleware = requirePermission('canWrite');
      middleware(req as any, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireHuman (direct unit tests)', () => {
    let mockRes: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
      mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis()
      };
      mockNext = vi.fn();
    });

    it('allows human type to pass', () => {
      const req: Partial<AuthRequest> = {
        user: { uuid: 'test-uuid', keyType: 'human', permissions: {} }
      } as any;

      const middleware = requireHuman();
      middleware(req as any, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('blocks lobster key type', () => {
      const req: Partial<AuthRequest> = {
        user: { uuid: 'test-uuid', keyType: 'lobster', permissions: {} }
      } as any;

      const middleware = requireHuman();
      middleware(req as any, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('blocks unauthenticated request', () => {
      const req: Partial<AuthRequest> = { user: undefined } as any;

      const middleware = requireHuman();
      middleware(req as any, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

});
