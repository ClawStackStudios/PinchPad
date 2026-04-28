import { Request, Response, NextFunction } from 'express';
import db from '../database/index';
import { createAuditLogger } from '../utils/auditLogger';
import { checkMoltExpiry } from '../utils/tokenExpiry';
import { createAgentKeyRateLimiter } from './rateLimiter';

const audit = createAuditLogger(db);
const agentRateLimiter = createAgentKeyRateLimiter();

export interface AuthRequest extends Request {
  apiKey: string;
  keyType: 'human' | 'agent' | 'api';
  userUuid: string;
  agentPermissions: Record<string, boolean | string>;
  agentId?: string;
  agentApiKey?: string;
  agentRateLimit?: number | null;
}

function detectKeyType(key: string): 'human' | 'agent' | 'api' | null {
  if (key?.startsWith('hu-'))  return 'human';
  if (key?.startsWith('lb-'))  return 'agent';
  if (key?.startsWith('api-')) return 'api';
  return null;
}

const HUMAN_PERMISSIONS = {
  canRead: true, canWrite: true, canEdit: true, canMove: true, canDelete: true,
};

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Unauthorized: no Bearer token' });
    return;
  }

  const key = auth.substring(7).trim();
  const keyType = detectKeyType(key);

  if (!keyType) {
    res.status(401).json({ success: false, error: 'Invalid key format — must use hu-, lb-, or api- prefix' });
    return;
  }

  let finalUserUuid: string | null = null;
  let finalPermissions: Record<string, boolean | string> | null = null;
  let actualKeyType: 'human' | 'agent' | 'api' = keyType;

  if (keyType === 'api') {
    const row = db.prepare('SELECT * FROM api_tokens WHERE key = ?').get(key) as any;
    if (!row) {
      res.status(401).json({ success: false, error: 'Invalid or revoked API token' });
      return;
    }
    if (!checkMoltExpiry(row.expires_at)) {
      db.prepare('DELETE FROM api_tokens WHERE key = ?').run(key);
      audit.log('AUTH_FAILURE', { actor: row.owner_key, action: 'validate_token', outcome: 'failure', resource: 'api_token', details: { reason: 'Token expired' } });
      res.status(401).json({ success: false, error: 'Token expired. Please authenticate again.' });
      return;
    }
    if (row.owner_type === 'human') {
      finalUserUuid = row.owner_key;
      finalPermissions = HUMAN_PERMISSIONS;
      actualKeyType = 'human';
    } else if (row.owner_type === 'agent') {
      const agent = db.prepare('SELECT id, user_uuid, api_key, permissions, is_active, expiration_date, rate_limit FROM agent_keys WHERE api_key = ?').get(row.owner_key) as any;
      if (!agent) { res.status(401).json({ success: false, error: 'Agent for this token no longer exists' }); return; }
      if (!agent.is_active) { res.status(401).json({ success: false, error: 'Lobster Key Revoked, Are you art of this reef?' }); return; }
      if (agent.expiration_date && new Date(agent.expiration_date) < new Date()) { res.status(401).json({ success: false, error: 'Lobster Key expired' }); return; }
      finalUserUuid = agent.user_uuid;
      finalPermissions = JSON.parse(agent.permissions || '{}');
      actualKeyType = 'agent';
      (req as AuthRequest).agentId = agent.id;
      (req as AuthRequest).agentApiKey = agent.api_key;
      (req as AuthRequest).agentRateLimit = agent.rate_limit;
    }
  }

  if (keyType === 'agent') {
    const row = db.prepare('SELECT id, user_uuid, api_key, permissions, is_active, expiration_date, rate_limit FROM agent_keys WHERE api_key = ? AND is_active = 1').get(key) as any;
    if (!row) { res.status(401).json({ success: false, error: 'Lobster Key Revoked, Are you art of this reef?' }); return; }
    if (row.expiration_date && new Date(row.expiration_date) < new Date()) { res.status(401).json({ success: false, error: 'Lobster Key expired' }); return; }
    db.prepare('UPDATE agent_keys SET last_used = ? WHERE api_key = ?').run(new Date().toISOString(), key);
    finalUserUuid = row.user_uuid;
    finalPermissions = JSON.parse(row.permissions || '{}');
    actualKeyType = 'agent';
    (req as AuthRequest).agentId = row.id;
    (req as AuthRequest).agentApiKey = row.api_key;
    (req as AuthRequest).agentRateLimit = row.rate_limit;
  }

  if (!finalUserUuid) {
    res.status(401).json({ success: false, error: 'Could not resolve user identity' });
    return;
  }

  const authReq = req as AuthRequest;
  authReq.apiKey = key;
  authReq.keyType = actualKeyType;
  authReq.userUuid = finalUserUuid;
  authReq.agentPermissions = finalPermissions || {};

  agentRateLimiter(req, res, next);
}

export function requirePermission(action: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthRequest;
    if (authReq.agentPermissions?.level === 'full') { next(); return; }
    if (authReq.agentPermissions?.[action] === true) { next(); return; }
    res.status(403).json({ success: false, error: `Your carapace lacks the required '${action}' permission` });
  };
}

export function requireHuman(req: Request, res: Response, next: NextFunction): void {
  const authReq = req as AuthRequest;
  let isHuman = authReq.keyType === 'human';

  if (!isHuman && authReq.keyType === 'api') {
    const row = db.prepare('SELECT owner_type FROM api_tokens WHERE key = ?').get(authReq.apiKey) as any;
    if (row?.owner_type === 'human') isHuman = true;
  }

  if (isHuman) { next(); return; }
  res.status(403).json({ success: false, error: 'Forbidden: This area of the Reef requires Human identity' });
}
