import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { readFileSync } from 'fs';
import { createServer as createHttpsServer } from 'https';

import { getCorsConfig } from './src/config/corsConfig';
import { generateSelfSignedCert, getCertPaths } from './src/server/ssl/generateCert';
import { errorHandler } from './src/server/middleware/errorHandler';
import { httpsRedirect } from './src/server/middleware/httpsRedirect';
import { scheduleMoltCleanup } from './src/server/utils/tokenExpiry';
import db from './src/server/database/index';

import authRoutes from './src/server/routes/auth';
import notesRoutes from './src/server/routes/notes';
import agentsRoutes from './src/server/routes/agents';
import lobsterSessionRoutes from './src/server/routes/lobsterSession';
import photosRoutes from './src/server/routes/photos';
import potsRoutes from './src/server/routes/pots';
import { apiLimiter } from './src/server/middleware/rateLimiter';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8383;

  // ─── Startup tasks ───────────────────────────────────────────────────────────
  scheduleMoltCleanup(db);

  // ─── Trust proxy ─────────────────────────────────────────────────────────────
  if (process.env.TRUST_PROXY === 'true') app.set('trust proxy', 1);

  // ─── Security Middleware ──────────────────────────────────────────────────────
  app.use(httpsRedirect);

  const isProduction = process.env.NODE_ENV === 'production';

  app.use(helmet({
    strictTransportSecurity: process.env.ENFORCE_HTTPS === 'true' ? undefined : false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'wss:', 'ws:', 'http://localhost:8383', 'http://localhost:8282'],
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

  // ─── API Routes ───────────────────────────────────────────────────────────────
  app.use('/api/auth', authRoutes);
  app.use('/api/notes', notesRoutes);
  app.use('/api/pots', potsRoutes);
  app.use('/api/agents', agentsRoutes);
  app.use('/api/lobster-session', lobsterSessionRoutes);
  app.use('/api/photos', photosRoutes);

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
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, {
      maxAge: '1y',
      immutable: true,
      setHeaders(res, filePath) {
        if (filePath.endsWith('index.html')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        }
      },
    }));
    
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // ─── Error Handling ───────────────────────────────────────────────────────────
  app.use(errorHandler);

  // ─── Start ────────────────────────────────────────────────────────────────────
  const ENABLE_HTTPS = process.env.ENABLE_HTTPS === 'true';

  if (ENABLE_HTTPS) {
    generateSelfSignedCert();
    const certs = getCertPaths();

    if (certs) {
      try {
        const options = {
          cert: readFileSync(certs.cert),
          key: readFileSync(certs.key),
        };

        createHttpsServer(options, app).listen(PORT, '0.0.0.0', () => {
          console.log(`\n🔒 PinchPad API running securely (HTTPS) on port ${PORT}`);
          console.log(`   Health: https://localhost:${PORT}/api/health\n`);
        });
      } catch (err: any) {
        console.error('❌ Failed to start HTTPS server:', err.message);
        console.log('🔗 Falling back to HTTP...');
        startHttp(app, PORT);
      }
    } else {
      console.error('❌ HTTPS requested but no certificates found. Falling back to HTTP.');
      startHttp(app, PORT);
    }
  } else {
    startHttp(app, PORT);
  }
}

function startHttp(app: express.Express, port: number) {
  app.listen(port, '0.0.0.0', () => {
    console.log(`\n🦞 PinchPad API running on port ${port} (HTTP)`);
    console.log(`   Health: http://localhost:${port}/api/health\n`);
  });
}

startServer();
