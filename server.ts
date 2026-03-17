import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';

import authRoutes from './src/server/routes/auth';
import notesRoutes from './src/server/routes/notes';
import agentsRoutes from './src/server/routes/agents';
import { purgeExpiredTokens } from './src/server/db';
import { lobsterRateLimiter } from './src/server/middleware/rateLimiter';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8383;

  // Initialize Reef: Purge expired tokens on startup
  purgeExpiredTokens();
  // Set interval to purge every hour
  setInterval(purgeExpiredTokens, 60 * 60 * 1000);

  // Security Middlewares
  app.use(helmet({
    contentSecurityPolicy: false, // Disabled for Vite HMR in dev
    crossOriginEmbedderPolicy: false, // Don't restrict cross-origin resources
    crossOriginResourcePolicy: false, // Don't restrict cross-origin resource loading
    crossOriginOpenerPolicy: false, // Don't isolate — let crypto.subtle use JS fallback
    originAgentCluster: false, // Don't force origin-keyed clusters (fixes console warning)
  }));

  app.use(cors({
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
      : true, // 'true' = mirror request origin — allows any LAN IP without configuration
    credentials: true,
  }));
  
  app.use(express.json());

  // Rate limiting for auth
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
  });

  // API Routes
  app.use('/api/auth', authLimiter, authRoutes);
  app.use('/api/notes', lobsterRateLimiter, notesRoutes);
  app.use('/api/agents', agentsRoutes);

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // In production (or when decoupling frontend/backend), serve static files if dist exists
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
