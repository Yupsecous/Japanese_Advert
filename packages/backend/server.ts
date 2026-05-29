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
import forgotPasswordHandler from './api/auth/forgot-password.js';
import resetPasswordHandler from './api/auth/reset-password.js';
import googleStartHandler from './api/auth/google/start.js';
import googleCallbackHandler from './api/auth/google/callback.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local from this package's directory regardless of where the
// process was started from.
dotenv.config({ path: path.join(__dirname, '.env.local') });

const app = express();

// Behind Caddy (and/or a Cloudflare tunnel): trust the first proxy hop so
// Secure cookies are sent and req.ip / X-Forwarded-For are honored.
app.set('trust proxy', 1);

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

app.use(express.json({ limit: '10mb' }));

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

// Catch-all 404 for any unknown API path (before the SPA fallback so API
// 404s return JSON rather than index.html).
app.use('/api', (_req, res) => {
  res.status(404).json({ code: 'route/not-found' });
});

// --- Static web build + SPA fallback (production same-origin serving) ---
// Only mounted when dist/ exists (it won't in API-only/dev-via-Vite setups).
const distDir = path.join(__dirname, '..', '..', 'dist');
if (existsSync(distDir)) {
  app.use(express.static(distDir));
  // Client-side routing fallback: any non-/api GET serves index.html.
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

// Last-resort error handler — surfaces unhandled exceptions as JSON 500.
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  // eslint-disable-next-line no-console
  console.error('[server] unhandled error:', err);
  res.status(500).json({
    code: 'unknown',
    detail: err instanceof Error ? err.message : String(err),
  });
});

const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`@advert/backend listening on http://localhost:${port}`);
});
