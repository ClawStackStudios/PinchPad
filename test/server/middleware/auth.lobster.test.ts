import { describe, it, expect, beforeEach } from 'vitest';
import { requireAuth, requirePermission, requireHuman, AuthRequest } from '../../../src/server/middleware/auth';
import { Response, NextFunction } from 'express';
import { createTestApp, createTestUser, createTestToken, createTestAgentKey } from '../../shared/app';
import request from 'supertest';
import { Express } from 'express';
import Database from 'better-sqlite3-multiple-ciphers';
import crypto from 'crypto';
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

    it('rejects agent key type for human-only routes', async () => {
      const { id: agentKeyId, apiKey } = createTestAgentKey(db, userUuid, { canRead: true });
      const agentToken = apiKey; // Use the direct LobsterKey

      const response = await request(app)
        .get('/api/agents')
        .set('Authorization', `Bearer ${agentToken}`);

      expect([403, 401]).toContain(response.status);
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
        apiKey: 'hu-testkey',
        keyType: 'human',
        userUuid: 'test-uuid',
        agentPermissions: { canRead: true, canWrite: true }
      } as any;

      const middleware = requirePermission('canWrite');
      middleware(req as any, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('allows agent with required permission', () => {
      const req: Partial<AuthRequest> = {
        apiKey: 'lb-testkey',
        keyType: 'agent',
        userUuid: 'test-uuid',
        agentPermissions: { canRead: true, canWrite: true }
      } as any;

      const middleware = requirePermission('canWrite');
      middleware(req as any, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('blocks agent without required permission', () => {
      const req: Partial<AuthRequest> = {
        apiKey: 'lb-testkey',
        keyType: 'agent',
        userUuid: 'test-uuid',
        agentPermissions: { canRead: true, canWrite: false }
      } as any;

      const middleware = requirePermission('canWrite');
      middleware(req as any, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('allows agent with full permission level', () => {
      const req: Partial<AuthRequest> = {
        apiKey: 'lb-testkey',
        keyType: 'agent',
        userUuid: 'test-uuid',
        agentPermissions: { level: 'full' }
      } as any;

      const middleware = requirePermission('canDelete');
      middleware(req as any, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
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
      const req = {
        apiKey: 'hu-testkey',
        keyType: 'human',
        userUuid: 'test-uuid',
        agentPermissions: {}
      } as AuthRequest;

      const middleware = requireHuman;
      middleware(req as any, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('blocks agent key type', () => {
      const req = {
        apiKey: 'lb-testkey',
        keyType: 'agent',
        userUuid: 'test-uuid',
        agentPermissions: {}
      } as AuthRequest;

      const middleware = requireHuman;
      middleware(req as any, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
