import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { Request, Response } from 'express';
import {
  initDatabase,
  getProfile,
  saveProfile,
  listProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  reorderProjects,
  createMessage,
  listMessages,
  setMessageReadStatus,
  deleteMessage,
} from './server/db.ts';
import {
  CSRF_COOKIE_NAME,
  createSignedCsrfToken,
  csrfProtection,
  isHttpsRequest,
  isAdminConfigured,
  getActiveAdminAuth,
  updateAdminPasswordHash,
  checkLoginLockout,
  recordFailedLogin,
  clearLoginAttempts,
  signAdminToken,
  setAuthCookie,
  clearAuthCookie,
  requireAdminAuth,
  detectImageExtension,
  isValidMp4Buffer,
  sanitizeText,
  sanitizeOptionalUrl,
  hashIp,
  contactSchema,
  loginSchema,
  changePasswordSchema,
  projectInputSchema,
  profileSchema,
} from './server/security.ts';
import type { AuthenticatedRequest } from './server/security.ts';

initDatabase();

const app = express();
const PORT = 3000;
const isProd = process.env.NODE_ENV === 'production';

const uploadsDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.set('trust proxy', 1);
app.disable('x-powered-by');

if (isProd) {
  app.use((req, res, next) => {
    const proto = req.headers['x-forwarded-proto'];
    if (typeof proto === 'string' && proto.split(',')[0].trim() === 'http') {
      res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
      return;
    }
    next();
  });
}

app.use(
  helmet({
    frameguard: false,
    crossOriginEmbedderPolicy: false,
    hsts: isProd
      ? {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true,
        }
      : false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: isProd ? ["'self'"] : ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        imgSrc: ["'self'", 'data:', 'blob:'],
        mediaSrc: ["'self'", 'blob:'],
        connectSrc: isProd ? ["'self'"] : ["'self'", 'ws:', 'wss:'],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'self'", 'https://aistudio.google.com', 'https://*.google.com'],
      },
    },
  }),
);

const allowedOrigins = new Set<string>(['http://localhost:3000', 'https://localhost:3000']);
if (process.env.APP_URL && process.env.APP_URL !== 'MY_APP_URL') {
  try {
    allowedOrigins.add(new URL(process.env.APP_URL).origin);
  } catch {
    // Ignore invalid APP_URL
  }
}
if (process.env.ALLOWED_ORIGINS) {
  for (const raw of process.env.ALLOWED_ORIGINS.split(',')) {
    const trimmed = raw.trim();
    if (trimmed) {
      try {
        allowedOrigins.add(new URL(trimmed).origin);
      } catch {
        // Ignore invalid origin entry
      }
    }
  }
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }
      if (allowedOrigins.has(origin) || /^https:\/\/[a-z0-9-]+\.run\.app$/.test(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('CORS policy blocked this origin.'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-CSRF-Token'],
  }),
);

app.use(cookieParser());
app.use(express.json({ limit: '160kb' }));

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 240,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please wait 15 minutes before trying again.' },
});

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Message limit reached. Please wait 15 minutes before sending another message.' },
});

app.use('/api', apiLimiter);

// Safe static serving for uploaded project images & MP4 showcase videos (supports range requests)
app.use(
  '/uploads',
  (_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    next();
  },
  express.static(uploadsDir, { fallthrough: false, acceptRanges: true }),
);

// --- SEO Routes (Admin strictly excluded) ---

app.get('/robots.txt', (_req: Request, res: Response) => {
  res.type('text/plain');
  res.send(
    [
      'User-agent: *',
      'Allow: /',
      'Disallow: /admin',
      'Disallow: /admin-portal',
      'Disallow: /api/admin',
    ].join('\n'),
  );
});

app.get('/sitemap.xml', (req: Request, res: Response) => {
  const baseUrl =
    process.env.APP_URL && process.env.APP_URL !== 'MY_APP_URL'
      ? process.env.APP_URL.replace(/\/$/, '')
      : `${isHttpsRequest(req) ? 'https' : 'http'}://${req.headers.host || 'localhost:3000'}`;

  const publishedProjects = listProjects(true);
  const projectUrls = publishedProjects
    .map(
      (p) => `  <url>
    <loc>${baseUrl}/projects/${p.id}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`,
    )
    .join('\n');

  res.type('application/xml');
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
${projectUrls}
</urlset>`);
});

// --- Public API Routes ---

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ ok: true });
});

app.get('/api/csrf-token', (req: Request, res: Response) => {
  const token = createSignedCsrfToken();
  res.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isHttpsRequest(req),
    sameSite: 'strict',
    maxAge: 4 * 60 * 60 * 1000,
    path: '/',
  });
  res.json({ csrfToken: token });
});

app.get('/api/portfolio', (_req: Request, res: Response) => {
  const profile = getProfile();
  const projects = listProjects(true);
  res.setHeader('Cache-Control', 'no-store');
  res.json({ profile, projects });
});

app.get('/api/projects/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: 'Invalid project ID.' });
    return;
  }
  const project = getProjectById(id, true);
  if (!project) {
    res.status(404).json({ error: 'Project not found.' });
    return;
  }
  res.setHeader('Cache-Control', 'no-store');
  res.json({ project });
});

app.post('/api/contact', contactLimiter, csrfProtection, (req: Request, res: Response) => {
  const parsed = contactSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid form input.' });
    return;
  }

  const { name, email, subject, message, website, formLoadedAt } = parsed.data;

  if (website && website.trim().length > 0) {
    res.status(200).json({ ok: true, message: 'Message received.' });
    return;
  }

  if (typeof formLoadedAt === 'number' && Date.now() - formLoadedAt < 1200) {
    res.status(400).json({ error: 'Submission was too fast. Please review your message and try again.' });
    return;
  }

  const cleanName = sanitizeText(name, 120);
  const cleanEmail = sanitizeText(email, 160).toLowerCase();
  const cleanSubject = sanitizeText(subject, 180);
  const cleanMessage = sanitizeText(message, 4000);

  if (cleanName.length < 2 || cleanSubject.length < 2 || cleanMessage.length < 10) {
    res.status(400).json({ error: 'Please complete all required fields with valid text.' });
    return;
  }

  const urlMatches = cleanMessage.match(/https?:\/\//gi) || [];
  if (urlMatches.length > 4) {
    res.status(400).json({ error: 'Message flagged for excessive links.' });
    return;
  }

  createMessage({
    name: cleanName,
    email: cleanEmail,
    subject: cleanSubject,
    message: cleanMessage,
    ipHash: hashIp(req.ip || 'unknown'),
  });

  res.status(201).json({ ok: true, message: 'Thank you. Your message has been delivered.' });
});

// --- Admin Auth & Protected Admin API Routes ---

app.use('/api/admin', (_req, res, next) => {
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.setHeader('Cache-Control', 'no-store');
  next();
});

app.post('/api/admin/login', loginLimiter, csrfProtection, (req: Request, res: Response) => {
  if (!isAdminConfigured()) {
    res.status(503).json({
      error:
        'Admin authentication is not configured on the server. Set ADMIN_USERNAME and ADMIN_PASSWORD_HASH environment variables.',
    });
    return;
  }

  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Username and password are required.' });
    return;
  }

  const activeAuth = getActiveAdminAuth();
  if (!activeAuth) {
    res.status(503).json({ error: 'Admin authentication is not configured.' });
    return;
  }

  const ipKey = `ip:${hashIp(req.ip || 'unknown')}`;
  const lockout = checkLoginLockout(ipKey);
  if (lockout.locked) {
    res.setHeader('Retry-After', String(lockout.retryAfterSeconds));
    res.status(429).json({
      error: `Account temporarily locked due to repeated failed attempts. Try again in ${Math.ceil(
        lockout.retryAfterSeconds / 60,
      )} minute(s).`,
    });
    return;
  }

  const submittedUser = parsed.data.username.trim();
  const submittedPass = parsed.data.password;

  const expectedBuf = Buffer.from(activeAuth.username, 'utf8');
  const actualBuf = Buffer.from(submittedUser, 'utf8');
  const usernameMatches =
    expectedBuf.length === actualBuf.length && crypto.timingSafeEqual(expectedBuf, actualBuf);
  const passwordMatches = bcrypt.compareSync(submittedPass, activeAuth.passwordHash);

  if (!usernameMatches || !passwordMatches) {
    const failState = recordFailedLogin(ipKey);
    if (failState.locked) {
      res.setHeader('Retry-After', String(failState.retryAfterSeconds));
      res.status(429).json({
        error: 'Too many failed login attempts. Login is temporarily locked for 15 minutes.',
      });
      return;
    }
    res.status(401).json({
      error: `Invalid credentials. ${failState.attemptsRemaining} attempt(s) remaining before temporary lockout.`,
    });
    return;
  }

  clearLoginAttempts(ipKey);
  const token = signAdminToken(activeAuth.username, activeAuth.tokenVersion);
  setAuthCookie(res, req, token);
  res.json({ ok: true, username: activeAuth.username });
});

app.post('/api/admin/logout', csrfProtection, (req: Request, res: Response) => {
  clearAuthCookie(res, req);
  res.json({ ok: true });
});

app.get('/api/admin/session', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
  res.json({ authenticated: true, username: req.adminUser });
});

app.post(
  '/api/admin/change-password',
  requireAdminAuth,
  csrfProtection,
  (req: AuthenticatedRequest, res: Response) => {
    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid password input.' });
      return;
    }

    const activeAuth = getActiveAdminAuth();
    if (!activeAuth) {
      res.status(503).json({ error: 'Admin authentication is not configured.' });
      return;
    }

    if (!bcrypt.compareSync(parsed.data.currentPassword, activeAuth.passwordHash)) {
      res.status(401).json({ error: 'Current password is incorrect.' });
      return;
    }

    const { newHash, tokenVersion } = updateAdminPasswordHash(parsed.data.newPassword);
    const refreshedToken = signAdminToken(activeAuth.username, tokenVersion);
    setAuthCookie(res, req, refreshedToken);

    res.json({
      ok: true,
      message: 'Password updated for active database session.',
      envHash: newHash,
    });
  },
);

app.get('/api/admin/profile', requireAdminAuth, (_req: Request, res: Response) => {
  res.json({ profile: getProfile() });
});

app.put('/api/admin/profile', requireAdminAuth, csrfProtection, (req: Request, res: Response) => {
  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: parsed.error.issues[0]?.message || 'Invalid profile data.',
    });
    return;
  }

  const d = parsed.data;
  const sanitizedProfile = {
    name: sanitizeText(d.name, 100),
    display3DName: sanitizeText(d.display3DName, 24),
    title: sanitizeText(d.title, 140),
    location: sanitizeText(d.location, 120),
    heroLines: d.heroLines.map((l) => sanitizeText(l, 60)).filter(Boolean),
    heroIntro: sanitizeText(d.heroIntro, 400),
    scrollPrompt: sanitizeText(d.scrollPrompt, 100),
    marqueeStatement: sanitizeText(d.marqueeStatement, 200),
    aboutSummary: sanitizeText(d.aboutSummary, 2500),
    careerObjective: sanitizeText(d.careerObjective, 1500),
    portraitUrl: sanitizeOptionalUrl(d.portraitUrl, true),
    accentColor: d.accentColor,
    showcaseVideoUrl: sanitizeOptionalUrl(d.showcaseVideoUrl, true) || '/assets/showcase-reel.mp4',
    showcasePosterUrl: sanitizeOptionalUrl(d.showcasePosterUrl, true),
    showcaseTitle: sanitizeText(d.showcaseTitle, 140),
    showcaseCaption: sanitizeText(d.showcaseCaption, 500),
    contactEmail: sanitizeText(d.contactEmail, 160),
    githubUrl: sanitizeOptionalUrl(d.githubUrl) || 'https://github.com/Nk099-niloy',
    socialLinks: d.socialLinks
      .map((link) => ({
        id: sanitizeText(link.id, 60),
        label: sanitizeText(link.label, 60),
        url: sanitizeOptionalUrl(link.url) || '',
      }))
      .filter((link) => link.url.length > 0),
    services: d.services.map((srv) => ({
      id: sanitizeText(srv.id, 60),
      title: sanitizeText(srv.title, 100),
      summary: sanitizeText(srv.summary, 600),
      deliverables: srv.deliverables.map((x) => sanitizeText(x, 60)).filter(Boolean),
    })),
    skillGroups: d.skillGroups.map((group) => ({
      id: sanitizeText(group.id, 60),
      title: sanitizeText(group.title, 80),
      items: group.items.map((item) => ({
        name: sanitizeText(item.name, 80),
        level: Math.min(100, Math.max(10, Math.round(item.level))),
      })),
    })),
    stats: d.stats.map((st) => ({
      id: sanitizeText(st.id, 60),
      value: Math.round(st.value),
      suffix: sanitizeText(st.suffix, 12),
      label: sanitizeText(st.label, 100),
      useOdometer: Boolean(st.useOdometer),
    })),
    experience: d.experience.map((exp) => ({
      id: sanitizeText(exp.id, 60),
      role: sanitizeText(exp.role, 140),
      context: sanitizeText(exp.context, 140),
      duration: sanitizeText(exp.duration, 100),
      location: sanitizeText(exp.location, 120),
      bullets: exp.bullets.map((b) => sanitizeText(b, 500)).filter(Boolean),
    })),
    certifications: d.certifications.map((cert) => ({
      id: sanitizeText(cert.id, 60),
      title: sanitizeText(cert.title, 140),
      issuer: sanitizeText(cert.issuer, 140),
      year: sanitizeText(cert.year, 40),
      credentialNote: sanitizeText(cert.credentialNote, 300),
    })),
    testimonials: d.testimonials.map((t) => ({
      id: sanitizeText(t.id, 60),
      name: sanitizeText(t.name, 100),
      role: sanitizeText(t.role, 100),
      organization: sanitizeText(t.organization, 120),
      quote: sanitizeText(t.quote, 1000),
      outcome: sanitizeText(t.outcome, 300),
    })),
    education: d.education.map((edu) => ({
      id: sanitizeText(edu.id, 60),
      degree: sanitizeText(edu.degree, 140),
      institution: sanitizeText(edu.institution, 180),
      year: sanitizeText(edu.year, 40),
      grade: sanitizeText(edu.grade, 60),
    })),
    training: d.training.map((t) => ({
      id: sanitizeText(t.id, 60),
      title: sanitizeText(t.title, 140),
      focus: sanitizeText(t.focus, 300),
    })),
    languages: d.languages.map((l) => ({
      id: sanitizeText(l.id, 60),
      name: sanitizeText(l.name, 80),
      proficiency: sanitizeText(l.proficiency, 60),
    })),
  };

  const saved = saveProfile(sanitizedProfile);
  res.json({ ok: true, profile: saved });
});

app.get('/api/admin/projects', requireAdminAuth, (_req: Request, res: Response) => {
  res.json({ projects: listProjects(false) });
});

app.post('/api/admin/projects', requireAdminAuth, csrfProtection, (req: Request, res: Response) => {
  const parsed = projectInputSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid project data.' });
    return;
  }

  const d = parsed.data;
  const project = createProject({
    title: sanitizeText(d.title, 160),
    type: sanitizeText(d.type, 100),
    technologies: d.technologies.map((t) => sanitizeText(t, 60)).filter(Boolean),
    description: sanitizeText(d.description, 2000),
    goal: sanitizeText(d.goal, 1500),
    approach: sanitizeText(d.approach, 2000),
    results: d.results.map((r) => sanitizeText(r, 400)).filter(Boolean),
    resultMetrics: d.resultMetrics.map((m) => ({
      label: sanitizeText(m.label, 80),
      value: Math.round(m.value),
      suffix: sanitizeText(m.suffix, 12),
    })),
    mockupDevice: d.mockupDevice,
    demoUrl: sanitizeOptionalUrl(d.demoUrl),
    imageUrl: sanitizeOptionalUrl(d.imageUrl, true),
    published: d.published,
  });

  res.status(201).json({ ok: true, project });
});

app.patch(
  '/api/admin/projects/reorder',
  requireAdminAuth,
  csrfProtection,
  (req: Request, res: Response) => {
    const ids = req.body?.orderedIds;
    if (!Array.isArray(ids) || !ids.every((n) => typeof n === 'number' && Number.isInteger(n) && n > 0)) {
      res.status(400).json({ error: 'orderedIds must be an array of valid project IDs.' });
      return;
    }
    const projects = reorderProjects(ids);
    res.json({ ok: true, projects });
  },
);

app.put('/api/admin/projects/:id', requireAdminAuth, csrfProtection, (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: 'Invalid project ID.' });
    return;
  }

  const parsed = projectInputSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid project data.' });
    return;
  }

  const d = parsed.data;
  const updated = updateProject(id, {
    title: sanitizeText(d.title, 160),
    type: sanitizeText(d.type, 100),
    technologies: d.technologies.map((t) => sanitizeText(t, 60)).filter(Boolean),
    description: sanitizeText(d.description, 2000),
    goal: sanitizeText(d.goal, 1500),
    approach: sanitizeText(d.approach, 2000),
    results: d.results.map((r) => sanitizeText(r, 400)).filter(Boolean),
    resultMetrics: d.resultMetrics.map((m) => ({
      label: sanitizeText(m.label, 80),
      value: Math.round(m.value),
      suffix: sanitizeText(m.suffix, 12),
    })),
    mockupDevice: d.mockupDevice,
    demoUrl: sanitizeOptionalUrl(d.demoUrl),
    imageUrl: sanitizeOptionalUrl(d.imageUrl, true),
    published: d.published,
  });

  if (!updated) {
    res.status(404).json({ error: 'Project not found.' });
    return;
  }
  res.json({ ok: true, project: updated });
});

app.delete('/api/admin/projects/:id', requireAdminAuth, csrfProtection, (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: 'Invalid project ID.' });
    return;
  }
  const deleted = deleteProject(id);
  if (!deleted) {
    res.status(404).json({ error: 'Project not found.' });
    return;
  }
  res.json({ ok: true });
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
});

const uploadVideo = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

app.post(
  '/api/admin/upload',
  requireAdminAuth,
  csrfProtection,
  upload.single('image'),
  (req: Request, res: Response) => {
    if (!req.file) {
      res.status(400).json({ error: 'No image file provided.' });
      return;
    }

    const ext = detectImageExtension(req.file.buffer);
    if (!ext) {
      res.status(400).json({ error: 'Only PNG, JPEG, or WebP images are permitted.' });
      return;
    }

    const filename = `project_${crypto.randomUUID()}.${ext}`;
    const dest = path.join(uploadsDir, filename);
    fs.writeFileSync(dest, req.file.buffer);

    res.status(201).json({ ok: true, imageUrl: `/uploads/${filename}` });
  },
);

app.post(
  '/api/admin/upload-video',
  requireAdminAuth,
  csrfProtection,
  uploadVideo.single('video'),
  (req: Request, res: Response) => {
    if (!req.file) {
      res.status(400).json({ error: 'No video file provided.' });
      return;
    }
    if (!isValidMp4Buffer(req.file.buffer)) {
      res.status(400).json({ error: 'Only valid MP4 video files are permitted.' });
      return;
    }

    const filename = `showcase_${crypto.randomUUID()}.mp4`;
    const dest = path.join(uploadsDir, filename);
    fs.writeFileSync(dest, req.file.buffer);

    res.status(201).json({ ok: true, videoUrl: `/uploads/${filename}` });
  },
);

app.get('/api/admin/messages', requireAdminAuth, (req: Request, res: Response) => {
  const query = typeof req.query.q === 'string' ? sanitizeText(req.query.q, 100) : '';
  const filterRaw = typeof req.query.filter === 'string' ? req.query.filter : 'all';
  const filter = filterRaw === 'unread' || filterRaw === 'read' ? filterRaw : 'all';

  const messages = listMessages({ query, filter });
  res.json({ messages });
});

app.patch(
  '/api/admin/messages/:id/read',
  requireAdminAuth,
  csrfProtection,
  (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: 'Invalid message ID.' });
      return;
    }
    const isRead = Boolean(req.body?.isRead);
    const updated = setMessageReadStatus(id, isRead);
    if (!updated) {
      res.status(404).json({ error: 'Message not found.' });
      return;
    }
    res.json({ ok: true });
  },
);

app.delete('/api/admin/messages/:id', requireAdminAuth, csrfProtection, (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: 'Invalid message ID.' });
    return;
  }
  const deleted = deleteMessage(id);
  if (!deleted) {
    res.status(404).json({ error: 'Message not found.' });
    return;
  }
  res.json({ ok: true });
});

app.use('/api', (_req: Request, res: Response) => {
  res.status(404).json({ error: 'API endpoint not found.' });
});

async function attachFrontend(): Promise<void> {
  app.use(['/admin', '/admin-portal'], (_req, res, next) => {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    res.setHeader('Cache-Control', 'no-store');
    next();
  });

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir, { index: false }));
    app.get('*', (req: Request, res: Response) => {
      if (req.path.startsWith('/admin')) {
        res.setHeader('X-Robots-Tag', 'noindex, nofollow');
        res.setHeader('Cache-Control', 'no-store');
      }
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

attachFrontend().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
