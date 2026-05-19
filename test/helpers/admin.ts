/**
 * admin.ts — PinchPad©™
 *
 * Test helpers for the Admin Dashboard.
 *
 * Maintained by CrustAgent©™
 */

import request from 'supertest';
import { Express } from 'express';
import crypto from 'crypto';

/**
 * Authenticates as admin and returns the session token.
 */
export async function loginAsAdmin(app: Express, adminToken: string): Promise<string> {
  const tokenHash = crypto.createHash('sha256').update(adminToken).digest('hex');
  const res = await request(app)
    .post('/api/admin/auth')
    .send({ token: tokenHash });
  
  if (res.status !== 200) {
    throw new Error(`Admin login failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  
  return res.body.sessionToken;
}

/**
 * Convenience for making authenticated admin requests.
 */
export function adminRequest(app: Express, method: 'get' | 'post' | 'patch' | 'delete', path: string, sessionToken: string) {
  const r = request(app)[method](path);
  if (sessionToken) {
    r.set('x-admin-session', sessionToken);
  }
  return r;
}
