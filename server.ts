import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';

import { getCorsConfig } from './src/shared/config/corsConfig';
import { errorHandler } from './src/server/middleware/errorHandler';
import { scheduleMoltCleanup } from './src/server/utils/tokenExpiry';
import { createAuditLogger } from './src/server/utils/auditLogger';
import db from './src/server/database/index';

const audit = createAuditLogger(db);

import authRoutes from './src/server/routes/auth';
import notesRoutes from './src/server/routes/notes';
import agentsRoutes from './src/server/routes/agents';
import lobsterSessionRoutes from './src/server/routes/lobsterSession';
import photosRoutes from './src/server/routes/photos';
import potsRoutes from './src/server/routes/pots';
import { apiLimiter } from './src/server/middleware/rateLimiter';

const PORT = parseInt(process.env.PORT ?? '8282', 10);
const app = express();

// ─── Startup tasks ───────────────────────────────────────────────────────────
scheduleMoltCleanup(db);
audit.cleanup(90); // ⚡ Clean expired audit logs on startup
setInterval(() => audit.cleanup(90), 24 * 60 * 60 * 1000); // Daily cleanup

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
app.use(express.json());
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
app.use('/api/photos', photosRoutes);

// ─── Health ───────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    status: 'ok', 
    service: 'PinchPad API',
    mode: 'sqlite',
    uptime: process.uptime() 
  });
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
const HOST = process.env.HOST ?? (isProduction ? '0.0.0.0' : '127.0.0.1');

app.listen(PORT, HOST, () => {
  console.log(`\n🦞 PinchPad API running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health\n`);
});
