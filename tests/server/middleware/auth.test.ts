import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { requireAuth, requirePermission, requireHuman, AuthRequest } from '../../../src/server/middleware/auth';
import { Response, NextFunction } from 'express';
import db from '../../../src/server/db';

describe('Auth Middleware', () => {
  let userUuid: string;
  let validToken: string;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    // Clean up tokens and users from previous tests
    db.prepare('DELETE FROM api_tokens').run();
    db.prepare('DELETE FROM lobster_keys').run();
    db.prepare('DELETE FROM users').run();

    // Test data
    userUuid = 'user-uuid-' + Math.random().toString(36).substring(7);
    validToken = 'api-validtoken' + Math.random().toString(36).substring(7);

    db.prepare('INSERT INTO users (uuid, username, display_name, key_hash, created_at) VALUES (?, ?, ?, ?, ?)').run(
      userUuid,
      'testuser-' + Math.random().toString(36).substring(7),
      'Test User',
      'test-hash-' + Math.random().toString(36).substring(7),
      new Date().toISOString()
    );

    db.prepare(`
      INSERT INTO api_tokens (key, owner_uuid, owner_type, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      validToken,
      userUuid,
      'human',
      new Date(Date.now() + 3600000).toISOString(),
      new Date().toISOString()
    );

    // Mock Response
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };

    mockNext = vi.fn();
  });

  afterEach(() => {
    // Clean up after each test
    db.prepare('DELETE FROM api_tokens').run();
    db.prepare('DELETE FROM lobster_keys').run();
    db.prepare('DELETE FROM users').run();
  });

  describe('requireAuth', () => {
    it('allows request with valid token', () => {
      const req: Partial<AuthRequest> = {
        headers: { authorization: `Bearer ${validToken}` }
      } as any;

      const middleware = requireAuth();
      middleware(req as any, mockRes as Response, mockNext);

      expect(req.user).toBeDefined();
      expect(req.user?.uuid).toBe(userUuid);
      expect(req.user?.keyType).toBe('human');
      expect(mockNext).toHaveBeenCalled();
    });

    it('rejects request without token', () => {
      const req: Partial<AuthRequest> = {
        headers: {}
      } as any;

      const middleware = requireAuth();
      middleware(req as any, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('rejects request with missing Bearer prefix', () => {
      const req: Partial<AuthRequest> = {
        headers: { authorization: `Basic ${validToken}` }
      } as any;

      const middleware = requireAuth();
      middleware(req as any, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('rejects request with invalid token', () => {
      const req: Partial<AuthRequest> = {
        headers: { authorization: 'Bearer invalid-token-xyz' }
      } as any;

      const middleware = requireAuth();
      middleware(req as any, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('rejects request with expired token', () => {
      const expiredToken = 'api-expiredtoken-' + Math.random().toString(36).substring(7);
      db.prepare(`
        INSERT INTO api_tokens (key, owner_uuid, owner_type, expires_at, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        expiredToken,
        userUuid,
        'human',
        new Date(Date.now() - 1000).toISOString(),
        new Date().toISOString()
      );

      const req: Partial<AuthRequest> = {
        headers: { authorization: `Bearer ${expiredToken}` }
      } as any;

      const middleware = requireAuth();
      middleware(req as any, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();

      // Verify token was deleted
      const deletedToken = db.prepare('SELECT * FROM api_tokens WHERE key = ?').get(expiredToken);
      expect(deletedToken).toBeUndefined();
    });

    it('attaches permissions from lobster key', () => {
      const lobsterKeyId = 'lobster-' + Math.random().toString(36).substring(7);
      const lobsterPermissions = { canRead: true, canWrite: false };

      db.prepare(`
        INSERT INTO lobster_keys (id, user_uuid, name, api_key, permissions, expiration_type, is_active, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 1, ?)
      `).run(
        lobsterKeyId,
        userUuid,
        'Test Agent',
        'lb-test-key-' + Math.random().toString(36).substring(7),
        JSON.stringify(lobsterPermissions),
        'never',
        new Date().toISOString()
      );

      const lobsterToken = 'api-lobstertoken-' + Math.random().toString(36).substring(7);
      db.prepare(`
        INSERT INTO api_tokens (key, owner_uuid, owner_type, lobster_key_id, expires_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        lobsterToken,
        userUuid,
        'lobster',
        lobsterKeyId,
        new Date(Date.now() + 3600000).toISOString(),
        new Date().toISOString()
      );

      const req: Partial<AuthRequest> = {
        headers: { authorization: `Bearer ${lobsterToken}` }
      } as any;

      const middleware = requireAuth();
      middleware(req as any, mockRes as Response, mockNext);

      expect(req.user).toBeDefined();
      expect(req.user?.keyType).toBe('lobster');
      expect(req.user?.permissions).toEqual(lobsterPermissions);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('requirePermission', () => {
    it('allows human type to pass all permissions', () => {
      const req: Partial<AuthRequest> = {
        user: { uuid: userUuid, keyType: 'human', permissions: {} }
      } as any;

      const middleware = requirePermission('canWrite');
      middleware(req as any, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('allows lobster with required permission', () => {
      const req: Partial<AuthRequest> = {
        user: {
          uuid: userUuid,
          keyType: 'lobster',
          permissions: { canRead: true, canWrite: true }
        }
      } as any;

      const middleware = requirePermission('canWrite');
      middleware(req as any, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('blocks lobster key without required permission', () => {
      const req: Partial<AuthRequest> = {
        user: {
          uuid: userUuid,
          keyType: 'lobster',
          permissions: { canRead: true, canWrite: false }
        }
      } as any;

      const middleware = requirePermission('canWrite');
      middleware(req as any, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('blocks unauthenticated request', () => {
      const req: Partial<AuthRequest> = {
        user: undefined
      } as any;

      const middleware = requirePermission('canWrite');
      middleware(req as any, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('blocks multiple missing permissions', () => {
      const req: Partial<AuthRequest> = {
        user: {
          uuid: userUuid,
          keyType: 'lobster',
          permissions: { canRead: true }
        }
      } as any;

      const middleware = requirePermission('canDelete');
      middleware(req as any, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });
  });

  describe('requireHuman', () => {
    it('allows human type to pass', () => {
      const req: Partial<AuthRequest> = {
        user: { uuid: userUuid, keyType: 'human', permissions: {} }
      } as any;

      const middleware = requireHuman();
      middleware(req as any, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('blocks lobster key type', () => {
      const req: Partial<AuthRequest> = {
        user: { uuid: userUuid, keyType: 'lobster', permissions: {} }
      } as any;

      const middleware = requireHuman();
      middleware(req as any, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('blocks unauthenticated request', () => {
      const req: Partial<AuthRequest> = {
        user: undefined
      } as any;

      const middleware = requireHuman();
      middleware(req as any, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Middleware chaining', () => {
    it('permissions work correctly when composed in sequence', () => {
      // Test that permission checking works after auth succeeds
      const req: Partial<AuthRequest> = {
        headers: { authorization: `Bearer ${validToken}` }
      } as any;

      const authMiddleware = requireAuth();
      authMiddleware(req as any, mockRes as Response, () => {
        // After auth succeeds, the user is attached
        expect(req.user).toBeDefined();

        // Now test permission check
        const permMiddleware = requirePermission('canRead');
        const permNext = vi.fn();
        permMiddleware(req as any, mockRes as Response, permNext);

        expect(permNext).toHaveBeenCalled();
      });
    });

    it('human gate works correctly in sequence', () => {
      // Test that human gate works after auth succeeds
      const req: Partial<AuthRequest> = {
        headers: { authorization: `Bearer ${validToken}` }
      } as any;

      const authMiddleware = requireAuth();
      authMiddleware(req as any, mockRes as Response, () => {
        // After auth succeeds, the user is attached
        expect(req.user).toBeDefined();
        expect(req.user?.keyType).toBe('human');

        // Now test human gate
        const humanMiddleware = requireHuman();
        const humanNext = vi.fn();
        humanMiddleware(req as any, mockRes as Response, humanNext);

        expect(humanNext).toHaveBeenCalled();
      });
    });
  });
});
