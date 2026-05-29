// Plain Express server that mounts the existing Vercel-style handlers and,
// for the web build, also serves the static SPA from the same origin (so the
// httpOnly session cookie is first-party). `tsx server.ts` in dev,
// `node --import tsx server.ts` for 24/7. No Vercel runtime dependency.
//
// The handler files in api/ export the Vercel-shape signature
// `(req: VercelRequest, res: VercelResponse) => Promise<void>`. Both
// VercelRequest and Express.Request extend Node's IncomingMessage, and the
// methods the handlers use (req.method/headers/body/query, res.status/json/
// redirect/setHeader) exist on both. adapt() casts and forwards async errors.

import express, { type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import healthHandler from './api/health.js';
import authLoginHandler from './api/auth/login.js';
import openaiChatHandler from './api/openai/chat.js';
import anthropicMessagesHandler from './api/anthropic/messages.js';
import falFluxHandler from './api/fal/flux.js';
import falKlingSubmitHandler from './api/fal/kling-submit.js';
import falKlingPollHandler from './api/fal/kling-poll.js';
import elevenlabsTtsHandler from './api/elevenlabs/tts.js';
import elevenlabsVoicesHandler from './api/elevenlabs/voices.js';

// New account/auth routes.
import signupHandler from './api/auth/signup.js';
import loginEmailHandler from './api/auth/login-email.js';
import logoutHandler from './api/auth/logout.js';
import verifyEmailHandler from './api/auth/verify-email.js';
import resendVerificationHandler from './api/auth/resend-verification.js';
import meHandler from './api/auth/me.js';
import redeemHandler from './api/auth/redeem.js';
import forgotPasswordHandler from './api/auth/forgot-password.js';
import resetPasswordHandler from './api/auth/reset-password.js';
import googleStartHandler from './api/auth/google/start.js';
import googleCallbackHandler from './api/auth/google/callback.js';

// Saved ad projects (history).
import projectsCollectionHandler from './api/projects/collection.js';
import projectItemHandler from './api/projects/item.js';

import { sql } from 'drizzle-orm';
import { getDb, getPool } from './lib/db.js';
import { sessions, emailVerificationTokens, passwordResetTokens } from './lib/schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local from this package's directory regardless of where the
// process was started from.
dotenv.config({ path: path.join(__dirname, '.env.local') });

const app = express();

// Only trust X-Forwarded-For when actually behind a reverse proxy (set
// TRUST_PROXY=1 once Caddy/Cloudflare terminates in front). Default OFF: with
// no proxy, req.ip is the real socket address and CANNOT be spoofed via XFF —
// which the rate limiter relies on.
app.set('trust proxy', process.env.TRUST_PROXY === '1' ? 1 : false);

// Baseline security headers on every response. (No strict CSP yet — the Design
// step renders generated code in an iframe via @babel/standalone; a CSP needs
// to be scoped to that and is tracked separately.)
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
});

// CORS: in production lock to the public origin and allow credentials (the
// session cookie). In dev (no PUBLIC_ORIGIN) reflect the request origin so a
// separately-served Vite app can talk to the API with cookies. The APK is not
// a browser origin, so CORS never gates it — Bearer auth works regardless.
const publicOrigin = process.env.PUBLIC_ORIGIN;
app.use(
  cors(
    publicOrigin
      ? { origin: publicOrigin, credentials: true }
      : { origin: true, credentials: true },
  ),
);

// Bodies are small JSON (prompts + schemas). 1MB is generous and bounds the
// parse/allocate cost of a hostile oversized payload (was 10MB).
app.use(express.json({ limit: '1mb' }));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type VercelLikeHandler = (req: any, res: any) => unknown | Promise<unknown>;

function adapt(handler: VercelLikeHandler) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req, res)).catch(next);
  };
}

// --- API routes (same paths Vercel would have served) ---
app.get('/api/health', adapt(healthHandler));

// Auth: legacy shared-cred (Android, Bearer) — unchanged.
app.post('/api/auth/login', adapt(authLoginHandler));

// Auth: real accounts (web).
app.post('/api/auth/signup', adapt(signupHandler));
app.post('/api/auth/login-email', adapt(loginEmailHandler));
app.post('/api/auth/logout', adapt(logoutHandler));
app.get('/api/auth/verify-email', adapt(verifyEmailHandler));
app.post('/api/auth/resend-verification', adapt(resendVerificationHandler));
app.get('/api/auth/me', adapt(meHandler));
app.post('/api/auth/redeem', adapt(redeemHandler));
app.post('/api/auth/forgot-password', adapt(forgotPasswordHandler));
app.post('/api/auth/reset-password', adapt(resetPasswordHandler));
app.get('/api/auth/google/start', adapt(googleStartHandler));
app.get('/api/auth/google/callback', adapt(googleCallbackHandler));

// Provider proxies.
app.post('/api/openai/chat', adapt(openaiChatHandler));
app.post('/api/anthropic/messages', adapt(anthropicMessagesHandler));
app.post('/api/fal/flux', adapt(falFluxHandler));
app.post('/api/fal/kling-submit', adapt(falKlingSubmitHandler));
app.post('/api/fal/kling-poll', adapt(falKlingPollHandler));
app.post('/api/elevenlabs/tts', adapt(elevenlabsTtsHandler));
app.post('/api/elevenlabs/voices', adapt(elevenlabsVoicesHandler));

// Saved ad projects (account-scoped history).
app.get('/api/projects', adapt(projectsCollectionHandler));
app.post('/api/projects', adapt(projectsCollectionHandler));
app.get('/api/projects/:id', adapt(projectItemHandler));
app.put('/api/projects/:id', adapt(projectItemHandler));
app.delete('/api/projects/:id', adapt(projectItemHandler));

// Catch-all 404 for any unknown API path (before the SPA fallback so API
// 404s return JSON rather than index.html).
app.use('/api', (_req, res) => {
  res.status(404).json({ code: 'route/not-found' });
});

// --- Static web build + SPA fallback (production same-origin serving) ---
// Only mounted when dist/ exists (it won't in API-only/dev-via-Vite setups).
const distDir = path.join(__dirname, '..', '..', 'dist');
if (existsSync(distDir)) {
  app.use(express.static(distDir, { dotfiles: 'deny' }));
  // Client-side routing fallback: any non-/api GET serves index.html.
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

// Last-resort error handler. Logs the real error server-side but returns ONLY
// a stable code to the client — exception messages can leak config/internals
// (missing-secret states, DB driver text, file paths).
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  // eslint-disable-next-line no-console
  console.error('[server] unhandled error:', err);
  res.status(500).json({ code: 'unknown' });
});

// Periodic GC of expired/consumed auth rows so open signup can't grow these
// tables without bound. Best-effort; logs on failure.
async function purgeExpiredAuthRows(): Promise<void> {
  try {
    const db = getDb();
    await db
      .delete(sessions)
      .where(sql`expires_at < now() - interval '7 days' OR revoked_at < now() - interval '7 days'`);
    await db
      .delete(emailVerificationTokens)
      .where(sql`expires_at < now() - interval '1 day' OR consumed_at IS NOT NULL`);
    await db
      .delete(passwordResetTokens)
      .where(sql`expires_at < now() - interval '1 day' OR consumed_at IS NOT NULL`);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[gc] purge of expired auth rows failed:', err);
  }
}
setTimeout(() => void purgeExpiredAuthRows(), 60_000).unref();
setInterval(() => void purgeExpiredAuthRows(), 6 * 60 * 60 * 1000).unref();

const port = Number(process.env.PORT ?? 3001);
const server = app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`@advert/backend listening on http://localhost:${port}`);
});

// Graceful shutdown: stop accepting, drain in-flight requests, close the pool.
function shutdown(signal: string): void {
  // eslint-disable-next-line no-console
  console.log(`[server] ${signal} received — draining`);
  server.close(() => {
    try {
      void getPool().end();
    } catch {
      /* pool never created */
    }
    process.exit(0);
  });
  // Hard cap so a stuck connection can't block the restart forever.
  setTimeout(() => process.exit(0), 10_000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
// Don't let a stray rejection/exception flap the crash-restart loop; log it.
process.on('unhandledRejection', (reason) => {
  // eslint-disable-next-line no-console
  console.error('[server] unhandledRejection:', reason);
});
process.on('uncaughtException', (err) => {
  // eslint-disable-next-line no-console
  console.error('[server] uncaughtException:', err);
});
