import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { pool } from './db/pool.js';
import { validateJwtConfiguration } from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import apiRoutes from './routes/api.js';
import { startAutoPaymentScheduler, stopAutoPaymentScheduler } from './services/autoPaymentScheduler.js';

const app = express();
const PORT = Number(process.env.PORT ?? 3001);
const isProduction = process.env.NODE_ENV === 'production';
const corsOrigin = process.env.CORS_ORIGIN;
const __dirname = dirname(fileURLToPath(import.meta.url));
const webRoot = join(__dirname, '../web');

validateJwtConfiguration();
if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) throw new Error('PORT invalide');
if (isProduction && !corsOrigin) throw new Error('CORS_ORIGIN est requis en production');

app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(cors({
  origin: corsOrigin ? corsOrigin.split(',').map((origin) => origin.trim()) : true,
  credentials: true,
}));
app.use(express.json({ limit: '64kb' }));

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
  );
  if (req.secure) res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok' });
  } catch (err) {
    console.error('Healthcheck PostgreSQL:', err);
    res.status(503).json({ status: 'error' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);

if (existsSync(webRoot)) {
  app.use(express.static(webRoot));
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(join(webRoot, 'index.html'));
  });
}

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Trésor API écoute sur le port ${PORT}`);
  startAutoPaymentScheduler();
});

let shuttingDown = false;
const shutdown = (signal: string) => {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`${signal} reçu, arrêt propre…`);
  stopAutoPaymentScheduler();
  server.close(() => {
    void pool.end().finally(() => process.exit(0));
  });
  setTimeout(() => process.exit(1), 10_000).unref();
};

process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT'));
