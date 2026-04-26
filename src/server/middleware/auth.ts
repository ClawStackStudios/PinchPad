import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import db from '../database/index';
import { createAuditLogger } from '../utils/auditLogger';

const audit = createAuditLogger(db);

export interface AuthRequest extends Request {
  user?: {
    uuid: string;
    keyType: 'human' | 'lobster';
    permissions?: Record<string, boolean>;
    rateLimit?: number | null;
    lobsterKeyId?: string | null;
  };
  authContext?: {
    type: 'human' | 'lobster';
    id: string;
  };
  db?: any; // Injected in tests; production uses singleton
}

export const requireAuth = () => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const activeDb = req.db || db;
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing token' });
    }

    const token = authHeader.slice(7);
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    try {
      const session = activeDb.prepare('SELECT * FROM api_tokens WHERE key = ?').get(tokenHash) as any;
      if (!session) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      if (session.expires_at && new Date(session.expires_at) < new Date()) {
        audit.log('AUTH_TOKEN_EXPIRED', {
          actor: session.owner_key,
          actor_type: session.owner_type,
          action: 'verify',
          outcome: 'failure',
          ip_address: req.ip,
          user_agent: req.headers['user-agent'] as string,
        });
        activeDb.prepare('DELETE FROM api_tokens WHERE key = ?').run(tokenHash);
        return res.status(401).json({ error: 'Token expired' });
      }

      let permissions = {};
      let rateLimit: number | null = null;
      if (session.owner_type === 'lobster' && session.lobster_key_id) {
        const lobster = activeDb.prepare('SELECT permissions, rate_limit FROM lobster_keys WHERE id = ?').get(session.lobster_key_id) as any;
        if (lobster) {
          permissions = JSON.parse(lobster.permissions);
          rateLimit = lobster.rate_limit ?? null;
        }
      }

      req.user = {
        uuid: session.owner_key,
        keyType: session.owner_type as 'human' | 'lobster',
        permissions,
        rateLimit,
        lobsterKeyId: session.lobster_key_id ?? null
      };

      req.authContext = {
        type: session.owner_type,
        id: session.owner_key
      };

      next();
    } catch (error) {
      console.error('[AuthMiddleware] Error:', error);
      res.status(500).json({ error: 'Authentication check failed' });
    }
  };
};

export const requirePermission = (permission: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

    if (req.user.keyType === 'human') {
      return next(); // Humans have full access
    }

    const hasPermission = req.user.permissions && req.user.permissions[permission] === true;
    if (!hasPermission) {
      audit.log('PERMISSION_DENIED', {
        actor: req.user.uuid,
        actor_type: req.user.keyType,
        action: 'access',
        outcome: 'failure',
        resource: 'endpoint',
        ip_address: req.ip,
        user_agent: req.headers['user-agent'] as string,
        details: { required_permission: permission },
      });
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

export const requireHuman = () => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    
    if (req.user.keyType !== 'human') {
      return res.status(403).json({
        error: 'This operation is for humans only',
        reason: 'Agent keys cannot access sensitive endpoints'
      });
    }
    next();
  };
};
