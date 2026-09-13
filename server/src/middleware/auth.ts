import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { query } from '../db/pool.js';
import type { AuthUser } from '../types.js';

const authUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
});
const AUTH_COOKIE = 'tresor_session';
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

function jwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32 || secret === 'change-me-in-production') {
    throw new Error('JWT_SECRET doit contenir au moins 32 caractères');
  }
  return secret;
}

export function validateJwtConfiguration(): void {
  jwtSecret();
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export function signToken(user: AuthUser): string {
  return jwt.sign({ id: user.id, email: user.email }, jwtSecret(), { expiresIn: '7d' });
}

export function setAuthCookie(res: Response, user: AuthUser): void {
  res.cookie(AUTH_COOKIE, signToken(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api',
    maxAge: SESSION_DURATION_MS,
  });
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(AUTH_COOKIE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api',
  });
}

function readCookie(req: Request, name: string): string | undefined {
  const cookies = req.headers.cookie?.split(';') ?? [];
  for (const cookie of cookies) {
    const [key, ...parts] = cookie.trim().split('=');
    if (key === name) return decodeURIComponent(parts.join('='));
  }
  return undefined;
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : readCookie(req, AUTH_COOKIE);
  if (!token) {
    res.status(401).json({ error: 'Non authentifié' });
    return;
  }
  try {
    const payload = jwt.verify(token, jwtSecret());
    const user = authUserSchema.parse(payload);
    const exists = await query(`SELECT 1 FROM users WHERE id = $1 AND email = $2`, [user.id, user.email]);
    if (!exists.rowCount) {
      res.status(401).json({ error: 'Compte introuvable' });
      return;
    }
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Token invalide ou expiré' });
  }
}
