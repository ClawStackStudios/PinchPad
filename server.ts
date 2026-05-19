import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { existsSync } from 'fs';
import cookieParser from 'cookie-parser';


import { getCorsConfig } from './src/shared/config/corsConfig';
import { errorHandler } from './src/server/middleware/errorHandler';
import { scheduleMoltCleanup } from './src/server/utils/tokenExpiry';
import { db, auditDb, audit } from './src/server/database';

import authRoutes from './src/server/routes/auth';
import notesRoutes from './src/server/routes/notes';
import agentsRoutes from './src/server/routes/agents';
import lobsterSessionRoutes from './src/server/routes/lobsterSession';
import photosRoutes from './src/server/routes/photos';
import potsRoutes from './src/server/routes/pots';
import sharesRoutes from './src/server/routes/shares';
import shellProxyRoutes from './src/server/routes/shellproxy';
import { apiLimiter, shellProxyLimiter } from './src/server/middleware/rateLimiter';

// ─── AUDIT LOGGING (Segregated) ───────────────────────────────────────────
function performCleanup() {
  try {
    const auditSetting = db.prepare('SELECT value FROM system_settings WHERE key = ?').get('audit_retention_days') as any;
    const uptimeSetting = db.prepare('SELECT value FROM system_settings WHERE key = ?').get('uptime_retention_days') as any;
    
    const auditRetention = auditSetting ? Number(auditSetting.value) : 90;
    const uptimeRetention = uptimeSetting ? Number(uptimeSetting.value) : 30;
    
    audit.cleanup(auditRetention, 10000);
    // Add specific cleanup for uptime events if necessary, or just rely on global cleanup if we don't strictly separate them.
    // Wait, audit.cleanup deletes EVERYTHING older than X.
    // We should modify auditLogger.ts to accept different retentions per event type!
  } catch (err) {
    console.error('[Server] Cleanup failed:', err);
  }
}

performCleanup(); // ⚡ Initial cleanup
setInterval(performCleanup, 12 * 60 * 60 * 1000); // Twice daily




const PORT = parseInt(process.env.PORT ?? '8282', 10);
const app = express();

// ─── Startup tasks ───────────────────────────────────────────────────────────
scheduleMoltCleanup(db);

// ─── Trust proxy ─────────────────────────────────────────────────────────────
if (process.env.TRUST_PROXY === 'true') app.set('trust proxy', 1);

// ─── Security Middleware ──────────────────────────────────────────────────────
const isProduction = process.env.NODE_ENV === 'production';

app.use(helmet({
  strictTransportSecurity: process.env.ENFORCE_HTTPS === 'true' ? undefined : false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'wss:', 'ws:'],
      frameAncestors: isProduction ? ["'self'"] : ["'self'", "*"],
      upgradeInsecureRequests: process.env.ENFORCE_HTTPS === 'true' ? [] : null,
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy: false,
  originAgentCluster: false,
  frameguard: isProduction ? { action: 'sameorigin' } : false,
}));

app.use(cors(getCorsConfig()));
app.use(express.json({ limit: '5mb' }));
app.use(cookieParser());
app.use('/api', apiLimiter);


// Request logger
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/pots', potsRoutes);
app.use('/api/agents', agentsRoutes);
app.use('/api/lobster-session', lobsterSessionRoutes);
app.use('/api/shares', sharesRoutes);
app.use('/api/photos', photosRoutes);

// ─── ShellProxy Membrane ──────────────────────────────────────────────────────
if (process.env.ENABLE_SHELL_PROXY === 'true') {
  app.use('/shellproxy', shellProxyLimiter, shellProxyRoutes);
  console.log('[ShellProxy] 🛡️  Public Membrane is ACTIVE (rate-limited: 30 req/min per IP).');
} else {
  console.log('[ShellProxy] 🔒 Public Membrane is DISABLED.');
}

// ─── SuperAdmin Routes ───────────────────────────────────────────────────────
if (process.env.ADMIN_TOKEN) {
  const { default: adminRoutes } = await import('./src/server/routes/admin');
  const { adminApiLimiter } = await import('./src/server/middleware/rateLimiter');
  app.use('/api/admin', adminApiLimiter, adminRoutes);
  console.log('🔑 Admin panel enabled at /admin');
}
// ─── Health ───────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    status: 'ok', 
    service: 'PinchPad API',
    mode: 'sqlite'
  });
});

// ─── Skill Document (public, no auth) ──────────────────────────────────────────
app.get(['/skill.md', '/SKILL.md'], (_req, res) => {
  const skillPath = path.resolve(process.cwd(), 'skills/pinchpad/SKILL.md');
  if (!existsSync(skillPath)) return res.status(404).send('Skill document not found.');
  res.sendFile(skillPath);
});

// ─── Static Files (Production) ────────────────────────────────────────────────
const distPath = path.join(process.cwd(), 'dist');
app.use(express.static(distPath, {
  maxAge: '1y',  // Default cache header for hashed assets
  immutable: true, // Tells browsers hashed assets never change
  setHeaders(res, filePath) {
    if (filePath.endsWith('index.html')) {
      // Bypass cache for index.html — always fetch fresh on new releases
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    } else {
      // Hashed assets (JS/CSS chunks) can be cached indefinitely
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  },
}));

// SPA catch-all: serve index.html for any non-API, non-asset route
// ⚠️ Do NOT change this regex — it prevents CSS/JS from being served as index.html
app.get(/^(?!\/api\/)(?!\/assets\/).*/, (_req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.sendFile(path.join(distPath, 'index.html'));
});

// ─── 404 + Error Handler ─────────────────────────────────────────────────────
app.use('/api', (_req, res) => res.status(404).json({ success: false, error: 'Route not found' }));
app.use(errorHandler);

// ─── Start ────────────────────────────────────────────────────────────────────
import crypto from 'crypto';

const HOST = process.env.HOST ?? (isProduction ? '0.0.0.0' : '127.0.0.1');
const SESSION_ID = crypto.randomUUID();

const server = app.listen(PORT, HOST, () => {
  console.log(`\n🦞 PinchPad API running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health\n`);

  audit.log('SYSTEM_START', {
    action: 'startup',
    outcome: 'success',
    details: { session_id: SESSION_ID }
  });
});

// ─── Graceful Shutdown Hooks ──────────────────────────────────────────────────
function handleShutdown(signal: string) {
  console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
  
  audit.log('SYSTEM_SHUTDOWN', {
    action: 'shutdown',
    outcome: 'success',
    details: { session_id: SESSION_ID, signal }
  });

  server.close(() => {
    console.log('[Server] Closed out remaining connections.');
    process.exit(0);
  });
  
  // Failsafe if connections don't close
  setTimeout(() => process.exit(1), 5000);
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

