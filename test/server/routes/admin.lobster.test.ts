/**
 * admin.lobster.test.ts — PinchPad©™
 *
 * Automated tests for the SuperAdmin panel.
 *
 * Maintained by CrustAgent©™
 */

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestApp, createTestUser } from '../../shared/app';
import { Express } from 'express';
import Database from 'better-sqlite3-multiple-ciphers';
import crypto from 'crypto';
import adminRoutes from '../../../src/server/routes/admin';

import cookieParser from 'cookie-parser';

// Mock ADMIN_TOKEN
process.env.ADMIN_TOKEN = 'test-admin-token-123';
const ADMIN_TOKEN_HASH = crypto.createHash('sha256').update(process.env.ADMIN_TOKEN).digest('hex');

describe('SuperAdmin API', () => {
  let app: Express;
  let db: Database.Database;
  let sessionToken: string;

  beforeEach(() => {
    const testSetup = createTestApp();
    app = testSetup.app;
    db = testSetup.db;
    
    // Add admin-specific middleware/routes to the test app
    app.use(cookieParser());
    app.use('/api/admin', adminRoutes);
  });

  it('POST /api/admin/auth — fails with wrong token', async () => {
    const res = await request(app)
      .post('/api/admin/auth')
      .send({ token: 'wrong-token' });
    
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/admin/auth — succeeds with correct token hash', async () => {
    const res = await request(app)
      .post('/api/admin/auth')
      .send({ token: ADMIN_TOKEN_HASH });
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.sessionToken).toBeDefined();
    sessionToken = res.body.sessionToken;
  });

  describe('Authenticated Admin Routes', () => {
    beforeEach(async () => {
      const res = await request(app)
        .post('/api/admin/auth')
        .send({ token: ADMIN_TOKEN_HASH });
      sessionToken = res.body.sessionToken;
    });

    it('GET /api/admin/verify — succeeds with valid session', async () => {
      const res = await request(app)
        .get('/api/admin/verify')
        .set('Cookie', [`pp_admin_session=${sessionToken}`]);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('GET /api/admin/users — returns list of users', async () => {
      createTestUser(db, 'admin_test_user');
      
      const res = await request(app)
        .get('/api/admin/users')
        .set('Cookie', [`pp_admin_session=${sessionToken}`]);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.some((u: any) => u.username === 'admin_test_user')).toBe(true);
    });

    it('GET /api/admin/system — returns system stats', async () => {
      const res = await request(app)
        .get('/api/admin/system')
        .set('Cookie', [`pp_admin_session=${sessionToken}`]);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalUsers).toBeDefined();
    });

    it('DELETE /api/admin/users/:uuid — deletes user', async () => {
      const uuid = createTestUser(db, 'to_be_deleted');
      
      const res = await request(app)
        .delete(`/api/admin/users/${uuid}`)
        .set('Cookie', [`pp_admin_session=${sessionToken}`]);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      
      const user = db.prepare('SELECT * FROM users WHERE uuid = ?').get(uuid);
      expect(user).toBeUndefined();
    });

    it('POST /api/admin/logout — clears session', async () => {
      await request(app)
        .post('/api/admin/logout')
        .set('Cookie', [`pp_admin_session=${sessionToken}`]);
      
      const res = await request(app)
        .get('/api/admin/verify')
        .set('Cookie', [`pp_admin_session=${sessionToken}`]);
      
      expect(res.status).toBe(401);
    });
  });
});

