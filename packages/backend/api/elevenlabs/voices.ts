import type { VercelRequest, VercelResponse } from '@vercel/node';
import { authenticate } from '../../lib/auth.js';
import { allow } from '../../lib/ratelimit.js';
import {
  relayUpstreamError,
  requirePost,
  sendError,
} from '../../lib/respond.js';

// Lists the voices available on the ElevenLabs account. Read-only,
// uncharged — no cost-cap accounting. POST (not GET) for consistency
// with every other authenticated route in this backend.

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requirePost(req, res)) return;

  const session = await authenticate(req);
  if (!session) return sendError(res, 401, 'auth/unauthorized');
  if (!allow(`voices:${session.sub}`, 10, 0.1)) return sendError(res, 429, 'auth/rate-limited');

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return sendError(res, 500, 'config/missing-key', 'ELEVENLABS_API_KEY');

  let upstream: Response;
  try {
    upstream = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: { 'xi-api-key': apiKey },
    });
  } catch (err) {
    return sendError(
      res,
      502,
      'upstream/error',
      err instanceof Error ? err.message : 'fetch failed',
    );
  }

  if (!upstream.ok) {
    return relayUpstreamError(res, upstream, 'elevenlabs/voices');
  }

  const body = await upstream.json();
  res.status(200).json(body);
}
