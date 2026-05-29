import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { authenticate } from '../../lib/auth.js';
import { canKling } from '../../lib/tiers.js';
import { allow } from '../../lib/ratelimit.js';
import {
  relayUpstreamError,
  requirePost,
  sendError,
} from '../../lib/respond.js';

// Polls a Kling job by request_id. Returns one of:
//   { status: 'IN_QUEUE' | 'IN_PROGRESS' }
//   { status: 'COMPLETED', video: { url } }
//   { status: 'FAILED', detail? }
//
// The client polls this every ~2 seconds. Stateless on our side; fal.ai
// is the source of truth for status.

const BodyZ = z.object({
  requestId: z.string().min(1),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requirePost(req, res)) return;

  const session = await authenticate(req);
  if (!session) return sendError(res, 401, 'auth/unauthorized');
  // Kling video is Ultra-only; polling is part of that feature.
  if (!canKling(session.tier)) return sendError(res, 403, 'tier/forbidden');
  // Generous bucket — the client legitimately polls every ~2s.
  if (!allow(`kling-poll:${session.sub}`, 60, 1)) return sendError(res, 429, 'auth/rate-limited');

  const parsed = BodyZ.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 400, 'body/invalid', parsed.error.message);
  }

  const apiKey = process.env.FAL_API_KEY;
  if (!apiKey) return sendError(res, 500, 'config/missing-key', 'FAL_API_KEY');

  const base = `https://queue.fal.run/fal-ai/kling-video/requests/${encodeURIComponent(parsed.data.requestId)}`;
  let statusRes: Response;
  try {
    statusRes = await fetch(`${base}/status`, {
      headers: { Authorization: `Key ${apiKey}` },
    });
  } catch (err) {
    return sendError(
      res,
      502,
      'upstream/error',
      err instanceof Error ? err.message : 'fetch failed',
    );
  }
  if (!statusRes.ok) {
    return relayUpstreamError(res, statusRes, 'fal/kling-poll-status');
  }
  const statusBody = (await statusRes.json()) as { status?: string };
  const status = (statusBody.status ?? '').toUpperCase();

  if (status === 'COMPLETED') {
    let resultRes: Response;
    try {
      resultRes = await fetch(base, {
        headers: { Authorization: `Key ${apiKey}` },
      });
    } catch (err) {
      return sendError(
        res,
        502,
        'upstream/error',
        err instanceof Error ? err.message : 'fetch failed',
      );
    }
    if (!resultRes.ok) return relayUpstreamError(res, resultRes, 'fal/kling-poll-result');
    const resultBody = (await resultRes.json()) as { video?: { url?: string } };
    if (!resultBody.video?.url) {
      return sendError(res, 502, 'upstream/error', 'kling result missing video.url');
    }
    res.status(200).json({ status: 'COMPLETED', video: { url: resultBody.video.url } });
    return;
  }

  if (status === 'FAILED' || status === 'ERROR' || status === 'CANCELLED') {
    res.status(200).json({ status: 'FAILED', detail: status });
    return;
  }

  res.status(200).json({ status: status || 'IN_PROGRESS' });
}
