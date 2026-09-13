import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import type { PoolClient } from 'pg';
import { z } from 'zod';
import { pool, query } from '../db/pool.js';
import { clearAuthCookie, setAuthCookie } from '../middleware/auth.js';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de tentatives. Réessayez dans 15 minutes.' },
});

router.use(authLimiter);

const authSchema = z.object({
  email: z.string().trim().email('Email invalide').max(254),
  password: z.string().min(8, 'Mot de passe : 8 caractères minimum').max(128),
}).strict();

router.post('/register', async (req, res) => {
  // Inscriptions ouvertes : passer DISABLE_REGISTRATION=true pour les fermer.
  if (process.env.DISABLE_REGISTRATION === 'true') {
    res.status(403).json({ error: 'Les inscriptions sont désactivées' });
    return;
  }

  let client: PoolClient | undefined;
  try {
    client = await pool.connect();
    const { email, password } = authSchema.parse(req.body);
    const hash = await bcrypt.hash(password, 12);
    await client.query('BEGIN');
    const result = await client.query(
      `INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email`,
      [email.trim().toLowerCase(), hash],
    );
    const user = result.rows[0];
    await client.query(`INSERT INTO user_accounts (user_id) VALUES ($1)`, [user.id]);
    await client.query('COMMIT');
    setAuthCookie(res, { id: user.id, email: user.email });
    res.status(201).json({ user: { id: user.id, email: user.email } });
  } catch (err) {
    await client?.query('ROLLBACK').catch(() => undefined);
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0].message });
      return;
    }
    if ((err as { code?: string }).code === '23505') {
      res.status(409).json({ error: 'Cet email est déjà utilisé' });
      return;
    }
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    client?.release();
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = authSchema.parse(req.body);
    const result = await query(`SELECT id, email, password_hash FROM users WHERE email = $1`, [email.trim().toLowerCase()]);
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      res.status(401).json({ error: 'Email ou mot de passe incorrect' });
      return;
    }
    setAuthCookie(res, { id: user.id, email: user.email });
    res.json({ user: { id: user.id, email: user.email } });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0].message });
      return;
    }
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/logout', (_req, res) => {
  clearAuthCookie(res);
  res.status(204).end();
});

export default router;
