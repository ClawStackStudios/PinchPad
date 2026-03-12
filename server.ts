import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { createServer as createViteServer } from 'vite';

import authRoutes from './src/server/routes/auth';
import notesRoutes from './src/server/routes/notes';
import agentsRoutes from './src/server/routes/agents';
import { purgeExpiredTokens } from './src/server/db';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize Reef: Purge expired tokens on startup
  purgeExpiredTokens();
  // Set interval to purge every hour
  setInterval(purgeExpiredTokens, 60 * 60 * 1000);

  // Security Middlewares
  app.use(helmet({
    contentSecurityPolicy: false, // Disabled for Vite HMR in dev
  }));
  
  app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
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
  app.use('/api/notes', notesRoutes);
  app.use('/api/agents', agentsRoutes);

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
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
