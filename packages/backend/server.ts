// Plain Express server that mounts the existing Vercel-style handlers.
// Lets the backend run as a regular Node process — `tsx server.ts` in
// dev, `node --import tsx server.ts` for 24/7. No Vercel runtime
// dependency. Same routes, same handlers, same env vars.
//
// The handler files in api/ still export the Vercel-shape signature
// `(req: VercelRequest, res: VercelResponse) => Promise<void>`. Both
// VercelRequest and Express.Request extend Node's IncomingMessage, and
// the methods the handlers actually use (req.method, req.headers,
// req.body, res.status, res.json) exist on both. The adapt() helper
// just casts and forwards async errors to Express's error middleware.

import express, { type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'node:path';
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local from this package's directory regardless of where the
// process was started from. Same file Vercel CLI would have read.
dotenv.config({ path: path.join(__dirname, '.env.local') });

const app = express();

// Permissive CORS — the APK calls from a different origin, and there's
// nothing browser-visible behind this server worth same-origin-locking.
app.use(cors());

// 10 MB so ElevenLabs base64 audio responses don't get cut off if we
// ever proxy them as request bodies (currently we don't, but keeps the
// margin generous).
app.use(express.json({ limit: '10mb' }));

// Helper: Vercel-shaped handler → Express handler.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type VercelLikeHandler = (req: any, res: any) => unknown | Promise<unknown>;

function adapt(handler: VercelLikeHandler) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req, res)).catch(next);
  };
}

// Routes — same paths Vercel would have served.
app.get('/api/health', adapt(healthHandler));
app.post('/api/auth/login', adapt(authLoginHandler));
app.post('/api/openai/chat', adapt(openaiChatHandler));
app.post('/api/anthropic/messages', adapt(anthropicMessagesHandler));
app.post('/api/fal/flux', adapt(falFluxHandler));
app.post('/api/fal/kling-submit', adapt(falKlingSubmitHandler));
app.post('/api/fal/kling-poll', adapt(falKlingPollHandler));
app.post('/api/elevenlabs/tts', adapt(elevenlabsTtsHandler));
app.post('/api/elevenlabs/voices', adapt(elevenlabsVoicesHandler));

// Catch-all 404 for any unknown API path.
app.use('/api', (_req, res) => {
  res.status(404).json({ code: 'route/not-found' });
});

// Last-resort error handler — surfaces unhandled exceptions as JSON 500
// so the client gets a clean shape instead of an HTML stack trace.
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
