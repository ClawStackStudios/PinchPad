/**
 * admin.dashboard.test.ts — PinchPad©™
 *
 * Comprehensive test suite for the SuperAdmin Dashboard.
 * Validates auth, route guards, system metrics, user management, and settings.
 *
 * Maintained by CrustAgent©™
 */

import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import request from 'supertest';
import { Express } from 'express';
import Database from 'better-sqlite3-multiple-ciphers';
import crypto from 'crypto';
import { createTestApp, createTestUser } from '../../shared/app';
import adminRoutes from '../../../src/server/routes/admin';
import cookieParser from 'cookie-parser';
import { loginAsAdmin, adminRequest } from '../../helpers/admin';

describe('SuperAdmin Dashboard Test Suite', () => {
  let app: Express;
  let db: Database.Database;
  const ADMIN_TOKEN = 'test-secret-token';
  const ADMIN_TOKEN_HASH = crypto.createHash('sha256').update(ADMIN_TOKEN).digest('hex');

  beforeAll(() => {
    process.env.ADMIN_TOKEN = ADMIN_TOKEN;
    process.env.NODE_ENV = 'test';
  });

  beforeEach(() => {
    const testSetup = createTestApp();
    app = testSetup.app;
    db = testSetup.db;
    
    app.use(cookieParser());
    app.use('/api/admin', adminRoutes);
  });

  describe('1. Authentication', () => {
    it('POST /api/admin/auth — succeeds with correct SHA-256 hashed token', async () => {
      const res = await request(app)
        .post('/api/admin/auth')
        .send({ token: ADMIN_TOKEN_HASH });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.sessionToken).toBeDefined();
      expect(res.get('Set-Cookie')[0]).toContain('pp_admin_session');
    });

    it('POST /api/admin/auth — fails with wrong token', async () => {
      const res = await request(app)
        .post('/api/admin/auth')
        .send({ token: 'wrong-hash' });
      
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/admin/auth — fails with empty body', async () => {
      const res = await request(app)
        .post('/api/admin/auth')
        .send({});
      
      expect(res.status).toBe(401); // Our implementation returns 401 if token is missing/wrong
    });

    it('POST /api/admin/auth — fails when ADMIN_TOKEN not set', async () => {
      const originalToken = process.env.ADMIN_TOKEN;
      delete process.env.ADMIN_TOKEN;
      
      const res = await request(app)
        .post('/api/admin/auth')
        .send({ token: ADMIN_TOKEN_HASH });
      
      expect(res.status).toBe(503);
      process.env.ADMIN_TOKEN = originalToken;
    });

    it('GET /api/admin/verify — succeeds with valid session', async () => {
      const sessionToken = await loginAsAdmin(app, ADMIN_TOKEN);
      const res = await adminRequest(app, 'get', '/api/admin/verify', sessionToken);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('POST /api/admin/logout — clears session', async () => {
      const sessionToken = await loginAsAdmin(app, ADMIN_TOKEN);
      await adminRequest(app, 'post', '/api/admin/logout', sessionToken);
      
      const res = await adminRequest(app, 'get', '/api/admin/verify', sessionToken);
      expect(res.body.success).toBe(false);
    });
  });

  describe('2. Protected Route Guards', () => {
    const protectedRoutes = [
      ['get', '/api/admin/users'],
      ['get', '/api/admin/system'],
      ['get', '/api/admin/audit'],
      ['get', '/api/admin/settings'],
      ['get', '/api/admin/uptime']
    ];

    it.each(protectedRoutes)('%s %s — returns 401 without session', async (method, path) => {
      const res = await (request(app) as any)[method](path);
      expect(res.status).toBe(401);
    });
  });

  describe('3. System Stats — Data Collection', () => {
    let sessionToken: string;

    beforeEach(async () => {
      sessionToken = await loginAsAdmin(app, ADMIN_TOKEN);
    });

    it('GET /api/admin/system — returns correct metrics', async () => {
      // Seed data
      const userUuid = createTestUser(db, 'stats_user');
      db.prepare('INSERT INTO notes (id, user_uuid, title, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)').run(
        'note-1', userUuid, 'Title', 'Content', new Date().toISOString(), new Date().toISOString()
      );

      const res = await adminRequest(app, 'get', '/api/admin/system', sessionToken);
      
      expect(res.status).toBe(200);
      expect(res.body.data.totalUsers).toBe(1);
      expect(res.body.data.totalPearls).toBe(1);
      expect(res.body.data.uptime).toBeGreaterThan(0);
    });
  });

  describe('4. User Management', () => {
    let sessionToken: string;

    beforeEach(async () => {
      sessionToken = await loginAsAdmin(app, ADMIN_TOKEN);
    });

    it('GET /api/admin/users — returns list with counts', async () => {
      createTestUser(db, 'user1');
      createTestUser(db, 'user2');

      const res = await adminRequest(app, 'get', '/api/admin/users', sessionToken);
      
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
      expect(res.body.pagination.total).toBe(2);
    });

    it('DELETE /api/admin/users/:uuid — cascade deletes all data', async () => {
      const uuid = createTestUser(db, 'cascade_target');
      db.prepare('INSERT INTO notes (id, user_uuid, title, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)').run(
        'note-target', uuid, 'Title', 'Content', new Date().toISOString(), new Date().toISOString()
      );

      const res = await adminRequest(app, 'delete', `/api/admin/users/${uuid}`, sessionToken);
      expect(res.status).toBe(200);

      const user = db.prepare('SELECT * FROM users WHERE uuid = ?').get(uuid);
      const note = db.prepare('SELECT * FROM notes WHERE user_uuid = ?').get(uuid);
      expect(user).toBeUndefined();
      expect(note).toBeUndefined();
    });
  });

  describe('5. Audit Logs', () => {
    let sessionToken: string;

    beforeEach(async () => {
      sessionToken = await loginAsAdmin(app, ADMIN_TOKEN);
    });

    it('GET /api/admin/audit — filters and paginates', async () => {
      const { auditDb } = await import('../../../src/server/database/index');
      auditDb.prepare(`INSERT INTO audit_logs (timestamp, event_type, action, outcome) VALUES (?, ?, ?, ?)`).run(
        new Date().toISOString(), 'LOGIN', 'auth', 'success'
      );

      const res = await adminRequest(app, 'get', '/api/admin/audit?event_type=LOGIN', sessionToken);
      expect(res.status).toBe(200);
      expect(res.body.data[0].event_type).toBe('LOGIN');
    });
  });

  describe('6. Settings', () => {
    let sessionToken: string;

    beforeEach(async () => {
      sessionToken = await loginAsAdmin(app, ADMIN_TOKEN);
    });

    it('GET /api/admin/settings — returns defaults', async () => {
      const res = await adminRequest(app, 'get', '/api/admin/settings', sessionToken);
      expect(res.status).toBe(200);
      expect(res.body.data.audit_retention_days).toBe('90');
    });

    it('PATCH /api/admin/settings — persists updates', async () => {
      await adminRequest(app, 'patch', '/api/admin/settings', sessionToken)
        .send({ audit_retention_days: '45' });
      
      const res = await adminRequest(app, 'get', '/api/admin/settings', sessionToken);
      expect(res.body.data.audit_retention_days).toBe('45');
    });
  });

  describe('7. Uptime History', () => {
    let sessionToken: string;

    beforeEach(async () => {
      sessionToken = await loginAsAdmin(app, ADMIN_TOKEN);
    });

    it('GET /api/admin/uptime — returns calculated sessions', async () => {
      const { auditDb } = await import('../../../src/server/database/index');
      const sid = crypto.randomUUID();
      auditDb.prepare(`INSERT INTO audit_logs (timestamp, event_type, action, outcome, details) VALUES (?, ?, ?, ?, ?)`).run(
        new Date(Date.now() - 5000).toISOString(), 'SYSTEM_START', 'startup', 'success', JSON.stringify({ session_id: sid })
      );

      const res = await adminRequest(app, 'get', '/api/admin/uptime', sessionToken);
      expect(res.status).toBe(200);
      expect(res.body.data.some((s: any) => s.id === sid)).toBe(true);
    });
  });
});
