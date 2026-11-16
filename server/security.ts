import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import type { Request, Response, NextFunction } from 'express';
import { db } from './db.ts';

const EPHEMERAL_JWT_SECRET = crypto.randomBytes(48).toString('hex');
const EPHEMERAL_CSRF_SECRET = crypto.randomBytes(48).toString('hex');

export function getJwtSecret(): string {
  const configured = process.env.JWT_SECRET?.trim();
  if (configured && configured !== 'long_random_string' && configured.length >= 16) {
    return configured;
  }
  return EPHEMERAL_JWT_SECRET;
}

export function getCsrfSecret(): string {
  const configured = process.env.CSRF_SECRET?.trim();
  if (configured && configured !== 'another_long_random_string' && configured.length >= 16) {
    return configured;
  }
  return EPHEMERAL_CSRF_SECRET;
}

export function isHttpsRequest(req: Request): boolean {
  if (req.secure) return true;
  const proto = req.headers['x-forwarded-proto'];
  if (typeof proto === 'string' && proto.split(',')[0].trim() === 'https') return true;
  return process.env.NODE_ENV === 'production';
}

export function hashIp(ip: string): string {
  return crypto.createHash('sha256').update(ip || 'unknown').digest('hex').slice(0, 16);
}

export function sanitizeText(value: string, maxLength: number): string {
  const withoutControls = value
    .replace(/\u0000/g, '')
    .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
  const withoutTags = withoutControls
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '');
  return withoutTags.trim().slice(0, maxLength);
}

export function sanitizeOptionalUrl(value: string | null | undefined, allowLocalAsset = false): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (
    allowLocalAsset &&
    /^\/(uploads|assets|assets\/aistudio)\/[a-zA-Z0-9_.-]+\.(png|jpg|jpeg|webp|mp4)$/.test(trimmed)
  ) {
    return trimmed;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

// --- CSRF Double-Submit Signed Token ---

export const CSRF_COOKIE_NAME = 'nk_csrf_token';
export const AUTH_COOKIE_NAME = 'nk_admin_session';

export function createSignedCsrfToken(): string {
  const nonce = crypto.randomBytes(24).toString('hex');
  const sig = crypto.createHmac('sha256', getCsrfSecret()).update(nonce).digest('hex');
  return `${nonce}.${sig}`;
}

export function verifySignedCsrfToken(token: string): boolean {
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [nonce, sig] = parts;
  if (!nonce || !sig || nonce.length !== 48 || sig.length !== 64) return false;
  const expected = crypto.createHmac('sha256', getCsrfSecret()).update(nonce).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'));
  } catch {
    return false;
  }
}

export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  const method = req.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    next();
    return;
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
  const headerToken = req.headers['x-csrf-token'];

  if (
    typeof cookieToken !== 'string' ||
    typeof headerToken !== 'string' ||
    !cookieToken ||
    cookieToken !== headerToken ||
    !verifySignedCsrfToken(cookieToken)
  ) {
    res.status(403).json({ error: 'Invalid or missing CSRF token. Please refresh and try again.' });
    return;
  }

  next();
}

// --- Admin Credentials, Override & Lockout ---

function fingerprintHash(hash: string): string {
  return crypto.createHash('sha256').update(hash).digest('hex');
}

export function isAdminConfigured(): boolean {
  const user = process.env.ADMIN_USERNAME?.trim();
  const hash = process.env.ADMIN_PASSWORD_HASH?.trim();
  return Boolean(
    user &&
      hash &&
      user !== 'your_username' &&
      hash !== 'generated_bcrypt_hash' &&
      hash.startsWith('$2'),
  );
}

export function getActiveAdminAuth(): { username: string; passwordHash: string; tokenVersion: number } | null {
  if (!isAdminConfigured()) return null;
  const envUser = process.env.ADMIN_USERNAME!.trim();
  const envHash = process.env.ADMIN_PASSWORD_HASH!.trim();
  const envFp = fingerprintHash(envHash);

  const override = db
    .prepare('SELECT env_hash_fingerprint, password_hash, token_version FROM admin_auth_override WHERE id = 1')
    .get() as { env_hash_fingerprint: string; password_hash: string; token_version: number } | undefined;

  if (override && override.env_hash_fingerprint === envFp) {
    return {
      username: envUser,
      passwordHash: override.password_hash,
      tokenVersion: override.token_version,
    };
  }

  return {
    username: envUser,
    passwordHash: envHash,
    tokenVersion: 1,
  };
}

export function updateAdminPasswordHash(newPlainPassword: string): { newHash: string; tokenVersion: number } {
  const envHash = process.env.ADMIN_PASSWORD_HASH?.trim();
  if (!envHash) {
    throw new Error('Admin credentials are not configured in server environment variables.');
  }
  const envFp = fingerprintHash(envHash);
  const newHash = bcrypt.hashSync(newPlainPassword, 12);
  const now = new Date().toISOString();

  const existing = db
    .prepare('SELECT token_version FROM admin_auth_override WHERE id = 1')
    .get() as { token_version: number } | undefined;
  const nextVersion = (existing?.token_version ?? 1) + 1;

  db.prepare(
    `INSERT INTO admin_auth_override (id, env_hash_fingerprint, password_hash, token_version, updated_at)
     VALUES (1, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       env_hash_fingerprint = excluded.env_hash_fingerprint,
       password_hash = excluded.password_hash,
       token_version = excluded.token_version,
       updated_at = excluded.updated_at`,
  ).run(envFp, newHash, nextVersion, now);

  return { newHash, tokenVersion: nextVersion };
}

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

export function checkLoginLockout(key: string): { locked: boolean; retryAfterSeconds: number } {
  const row = db
    .prepare('SELECT attempts, locked_until, last_attempt FROM login_attempts WHERE key = ?')
    .get(key) as { attempts: number; locked_until: number | null; last_attempt: number } | undefined;

  if (!row) return { locked: false, retryAfterSeconds: 0 };

  const now = Date.now();
  if (row.locked_until && row.locked_until > now) {
    return {
      locked: true,
      retryAfterSeconds: Math.ceil((row.locked_until - now) / 1000),
    };
  }

  if (now - row.last_attempt > LOCKOUT_MS) {
    db.prepare('DELETE FROM login_attempts WHERE key = ?').run(key);
    return { locked: false, retryAfterSeconds: 0 };
  }

  return { locked: false, retryAfterSeconds: 0 };
}

export function recordFailedLogin(key: string): { locked: boolean; attemptsRemaining: number; retryAfterSeconds: number } {
  const now = Date.now();
  const row = db
    .prepare('SELECT attempts, last_attempt FROM login_attempts WHERE key = ?')
    .get(key) as { attempts: number; last_attempt: number } | undefined;

  const baseAttempts = row && now - row.last_attempt <= LOCKOUT_MS ? row.attempts : 0;
  const nextAttempts = baseAttempts + 1;
  const shouldLock = nextAttempts >= MAX_FAILED_ATTEMPTS;
  const lockedUntil = shouldLock ? now + LOCKOUT_MS : null;

  db.prepare(
    `INSERT INTO login_attempts (key, attempts, locked_until, last_attempt)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET
       attempts = excluded.attempts,
       locked_until = excluded.locked_until,
       last_attempt = excluded.last_attempt`,
  ).run(key, nextAttempts, lockedUntil, now);

  return {
    locked: shouldLock,
    attemptsRemaining: Math.max(0, MAX_FAILED_ATTEMPTS - nextAttempts),
    retryAfterSeconds: shouldLock ? Math.ceil(LOCKOUT_MS / 1000) : 0,
  };
}

export function clearLoginAttempts(key: string): void {
  db.prepare('DELETE FROM login_attempts WHERE key = ?').run(key);
}

// --- JWT Authentication ---

export interface AdminTokenPayload {
  sub: string;
  tv: number;
  role: 'admin';
}

export function signAdminToken(username: string, tokenVersion: number): string {
  const payload: AdminTokenPayload = {
    sub: username,
    tv: tokenVersion,
    role: 'admin',
  };
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: '2h',
    issuer: 'nk-portfolio-auth',
  });
}

export function setAuthCookie(res: Response, req: Request, token: string): void {
  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isHttpsRequest(req),
    sameSite: 'strict',
    maxAge: 2 * 60 * 60 * 1000,
    path: '/',
  });
}

export function clearAuthCookie(res: Response, req: Request): void {
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    secure: isHttpsRequest(req),
    sameSite: 'strict',
    path: '/',
  });
}

export interface AuthenticatedRequest extends Request {
  adminUser?: string;
}

export function requireAdminAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const token = req.cookies?.[AUTH_COOKIE_NAME];
  if (typeof token !== 'string' || !token) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }

  const activeAuth = getActiveAdminAuth();
  if (!activeAuth) {
    res.status(503).json({ error: 'Admin authentication is not configured.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret(), {
      issuer: 'nk-portfolio-auth',
    }) as AdminTokenPayload;

    if (
      decoded.role !== 'admin' ||
      decoded.sub !== activeAuth.username ||
      decoded.tv !== activeAuth.tokenVersion
    ) {
      res.status(401).json({ error: 'Session expired or invalid.' });
      return;
    }

    req.adminUser = decoded.sub;
    next();
  } catch {
    res.status(401).json({ error: 'Session expired or invalid.' });
  }
}

// --- Magic Byte Media Validation ---

export function detectImageExtension(buffer: Buffer): 'png' | 'jpg' | 'webp' | null {
  if (buffer.length < 12) return null;
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'png';
  }
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'jpg';
  }
  if (
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'webp';
  }
  return null;
}

export function isValidMp4Buffer(buffer: Buffer): boolean {
  if (buffer.length < 12) return false;
  return buffer.subarray(4, 8).toString('ascii') === 'ftyp';
}

// --- Zod Schemas ---

export const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.').max(120),
  email: z.string().email('Please provide a valid email address.').max(160),
  subject: z.string().min(2, 'Subject must be at least 2 characters.').max(180),
  message: z.string().min(10, 'Message must be at least 10 characters.').max(4000),
  website: z.string().max(200).optional(),
  formLoadedAt: z.number().optional(),
});

export const loginSchema = z.object({
  username: z.string().min(1).max(100),
  password: z.string().min(1).max(200),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: z.string().min(10, 'New password must be at least 10 characters.').max(200),
});

export const projectInputSchema = z.object({
  title: z.string().min(2).max(160),
  type: z.string().min(2).max(100),
  technologies: z.array(z.string().min(1).max(60)).min(1).max(20),
  description: z.string().min(10).max(2000),
  goal: z.string().min(5).max(1500),
  approach: z.string().min(5).max(2000),
  results: z.array(z.string().min(2).max(400)).min(1).max(10),
  resultMetrics: z
    .array(
      z.object({
        label: z.string().min(1).max(80),
        value: z.number().min(0).max(1000000),
        suffix: z.string().max(12),
      }),
    )
    .max(8)
    .default([]),
  mockupDevice: z.enum(['phone', 'laptop']).default('laptop'),
  demoUrl: z.string().max(500).nullable().optional(),
  imageUrl: z.string().max(500).nullable().optional(),
  published: z.boolean().default(true),
});

export const profileSchema = z.object({
  name: z.string().min(2).max(100),
  display3DName: z.string().min(1).max(24),
  title: z.string().min(2).max(140),
  location: z.string().min(2).max(120),
  heroLines: z.array(z.string().min(1).max(60)).min(1).max(4),
  heroIntro: z.string().min(10).max(400),
  scrollPrompt: z.string().min(2).max(100),
  marqueeStatement: z.string().min(4).max(200),
  aboutSummary: z.string().min(20).max(2500),
  careerObjective: z.string().min(20).max(1500),
  portraitUrl: z.string().max(500).nullable().optional(),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Accent color must be a valid 6-digit hex color.'),
  showcaseVideoUrl: z.string().min(1).max(500),
  showcasePosterUrl: z.string().max(500).nullable().optional(),
  showcaseTitle: z.string().min(2).max(140),
  showcaseCaption: z.string().min(5).max(500),
  contactEmail: z.string().email().max(160),
  githubUrl: z.string().url().max(300),
  socialLinks: z
    .array(
      z.object({
        id: z.string().min(1).max(60),
        label: z.string().min(1).max(60),
        url: z.string().url().max(300),
      }),
    )
    .max(10),
  services: z
    .array(
      z.object({
        id: z.string().min(1).max(60),
        title: z.string().min(2).max(100),
        summary: z.string().min(10).max(600),
        deliverables: z.array(z.string().min(1).max(60)).min(1).max(10),
      }),
    )
    .min(1)
    .max(10),
  skillGroups: z
    .array(
      z.object({
        id: z.string().min(1).max(60),
        title: z.string().min(1).max(80),
        items: z
          .array(
            z.object({
              name: z.string().min(1).max(80),
              level: z.number().min(10).max(100),
            }),
          )
          .min(1)
          .max(30),
      }),
    )
    .min(1)
    .max(10),
  stats: z
    .array(
      z.object({
        id: z.string().min(1).max(60),
        value: z.number().min(0).max(999999),
        suffix: z.string().max(12),
        label: z.string().min(2).max(100),
        useOdometer: z.boolean().default(true),
      }),
    )
    .min(1)
    .max(8),
  experience: z
    .array(
      z.object({
        id: z.string().min(1).max(60),
        role: z.string().min(2).max(140),
        context: z.string().min(2).max(140),
        duration: z.string().min(2).max(100),
        location: z.string().min(2).max(120),
        bullets: z.array(z.string().min(5).max(500)).min(1).max(15),
      }),
    )
    .max(15),
  certifications: z
    .array(
      z.object({
        id: z.string().min(1).max(60),
        title: z.string().min(2).max(140),
        issuer: z.string().min(2).max(140),
        year: z.string().min(2).max(40),
        credentialNote: z.string().min(2).max(300),
      }),
    )
    .max(20),
  testimonials: z
    .array(
      z.object({
        id: z.string().min(1).max(60),
        name: z.string().min(2).max(100),
        role: z.string().min(2).max(100),
        organization: z.string().min(2).max(120),
        quote: z.string().min(10).max(1000),
        outcome: z.string().min(5).max(300),
      }),
    )
    .max(15),
  education: z
    .array(
      z.object({
        id: z.string().min(1).max(60),
        degree: z.string().min(2).max(140),
        institution: z.string().min(2).max(180),
        year: z.string().min(2).max(40),
        grade: z.string().min(1).max(60),
      }),
    )
    .max(15),
  training: z
    .array(
      z.object({
        id: z.string().min(1).max(60),
        title: z.string().min(2).max(140),
        focus: z.string().min(2).max(300),
      }),
    )
    .max(20),
  languages: z
    .array(
      z.object({
        id: z.string().min(1).max(60),
        name: z.string().min(2).max(80),
        proficiency: z.string().min(2).max(60),
      }),
    )
    .max(15),
});
