# Niloy Kundu — Portfolio & Automation Showcase

Full-stack portfolio web application for **Niloy Kundu** (AI & Workflow Automation Developer, Gaibandha, Bangladesh). Built with React, Vite, Three.js (`@react-three/fiber`), GSAP `ScrollTrigger`, Express, and SQLite (`better-sqlite3`).

## Architecture Overview

- **Frontend (`/src`)**:
  - **Public Portfolio (`/`)**: Editorial off-white & charcoal layout (`Syne` + `Plus Jakarta Sans` + `IBM Plex Mono`), scroll-scrubbed 3D connected workflow node constellation (`WorkflowScene3D.tsx`), GSAP `ScrollTrigger` section choreography, magnetic hover controls, custom desktop reticle cursor, and a 2D SVG fallback (`WorkflowFallback2D.tsx`) for mobile, low-power devices, and `prefers-reduced-motion`.
  - **Admin Portal (`/admin-portal`)**: Code-split, lazy-loaded CMS & inbox console excluded from `sitemap.xml`, blocked in `robots.txt`, and served with `noindex, nofollow`. Never linked from the public UI.
- **Backend (`/server.ts`, `/server/*`)**:
  - Express server on port `3000` with Vite middleware in development and static `dist/` serving in production.
  - SQLite (`better-sqlite3`) persistence with automatic idempotent seeding on first run.
  - Security stack: `helmet` (CSP, HSTS in production), strict `cors`, `bcryptjs` password verification, `jsonwebtoken` sessions stored in `httpOnly` + `strict` `sameSite` + `secure` cookies, signed double-submit CSRF tokens, `express-rate-limit` + persistent account lockout after 5 failed logins, Zod schema validation, XSS tag stripping, contact form honeypot + timing guard, and magic-byte verified image uploads (`PNG`, `JPEG`, `WebP`).

## Project Structure

```text
├── server.ts                    # Express server, security middleware, API routes, Vite/static serving
├── server/
│   ├── db.ts                    # SQLite schema, prepared statements, and initial seed data
│   └── security.ts              # JWT, CSRF, bcrypt, lockout, Zod schemas, sanitization, magic-byte check
├── src/
│   ├── App.tsx                  # Route split (/ vs lazy /admin-portal)
│   ├── index.css                # Tailwind v4 + CSS theme tokens
│   ├── types/portfolio.ts       # Shared TypeScript interfaces
│   ├── lib/api.ts               # Typed API client with automatic CSRF handling
│   ├── components/
│   │   ├── Navbar.tsx           # 3-zone top navigation bar
│   │   ├── CustomCursor.tsx     # Desktop pointer reticle
│   │   ├── MagneticButton.tsx   # Magnetic hover control
│   │   ├── WorkflowScene3D.tsx  # Three.js / R3F connected workflow nodes
│   │   └── WorkflowFallback2D.tsx
│   └── pages/
│       ├── PublicPortfolio.tsx  # All 8 public sections + GSAP ScrollTrigger + Contact form
│       └── AdminPortal.tsx      # Protected admin login, CMS editor, project manager, inbox, security
├── .env.example
├── index.html
└── package.json
```

## Local Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Generate a bcrypt password hash for `ADMIN_PASSWORD_HASH`:
   ```bash
   node -e "const b=require('bcryptjs'); console.log(b.hashSync('REPLACE_WITH_STRONG_PASSWORD', 12));"
   ```
   Generate random secrets for `JWT_SECRET` and `CSRF_SECRET`:
   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```

3. **Run in development**:
   ```bash
   npm run dev
   ```
   Visit `http://localhost:3000` for the public portfolio and `http://localhost:3000/admin-portal` for the admin portal.

4. **Build and run in production**:
   ```bash
   npm run build
   NODE_ENV=production npm start
   ```

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `APP_URL` | Yes (prod) | Public canonical origin (e.g., `https://niloykundu.com`), used for CORS and `sitemap.xml` |
| `ADMIN_USERNAME` | Yes | Admin login username (never stored in code or client bundle) |
| `ADMIN_PASSWORD_HASH` | Yes | Bcrypt hash (`$2a$` or `$2b$`) of the admin password |
| `JWT_SECRET` | Yes | Long random string (at least 32+ chars) for signing admin session JWTs |
| `CSRF_SECRET` | Yes | Long random string for HMAC-signing CSRF double-submit cookies |
| `DATABASE_PATH` | Optional | Path to SQLite database file (defaults to `./data/portfolio.db`) |
| `ALLOWED_ORIGINS` | Optional | Comma-separated extra CORS origins |
| `GEMINI_API_KEY` | Optional | Server-only Gemini key if adding server-side AI endpoints later |
| `OPENAI_API_KEY` | Optional | Server-only OpenAI key |

## Deployment Guide

### Option A: Node.js Host with Persistent Volume (Render, Railway, Fly.io, VPS)
Because this application uses Express + SQLite + local image uploads (`uploads/`), deploying to a container/Node host with a persistent disk is the simplest single-service setup:
1. Set build command: `npm install && npm run build`
2. Set start command: `NODE_ENV=production npm start`
3. Attach a persistent volume mounted at `/app/data` (set `DATABASE_PATH=/app/data/portfolio.db`) and `/app/uploads`.
4. Add `APP_URL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, `JWT_SECRET`, and `CSRF_SECRET` in the host environment settings.
5. Enable automatic HTTPS/TLS on your custom domain.

### Option B: Vercel / Netlify (Serverless Functions + Managed Database)
To deploy on serverless platforms without a persistent local filesystem:
1. **Frontend**: Build the Vite SPA (`npm run build`) and deploy `dist/` to Netlify or Vercel.
2. **Database**: Provision a hosted database such as **Supabase (PostgreSQL)** or **Turso (libSQL/SQLite)** and replace the `better-sqlite3` calls in `server/db.ts` with your hosted database client.
3. **Media Storage**: Replace local disk writes in `/api/admin/upload` (`server.ts`) with **Supabase Storage**, **Cloudflare R2**, or **S3** so uploaded project images persist across serverless invocations.
4. **API Functions**: Wrap the Express app (`serverless-http`) inside a Netlify Function (`netlify/functions/api.ts`) or Vercel Serverless Function (`api/index.ts`) and configure rewrites for `/api/*`, `/sitemap.xml`, `/robots.txt`, and SPA fallback routing.
5. **Environment Variables**: Configure `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, `JWT_SECRET`, `CSRF_SECRET`, `APP_URL`, and your hosted database connection string in the Netlify/Vercel dashboard.
