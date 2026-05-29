import type { VercelRequest, VercelResponse } from '@vercel/node';
import { authenticate } from '../../lib/auth.js';
import {
  relayUpstreamError,
  requirePost,
  sendError,
} from '../../lib/respond.js';
import { recordSpend, costForText, wouldExceedCap, recordUsageEvent } from '../../lib/cost.js';

// Pass-through proxy for Anthropic /v1/messages. Used by copy generation
// + critique. The dangerous-direct-browser-access header is unnecessary
// here because we're calling from the server.

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requirePost(req, res)) return;

  const session = await authenticate(req);
  if (!session) return sendError(res, 401, 'auth/unauthorized');

  const cost = costForText();
  if (wouldExceedCap(session.sub, cost)) {
    return sendError(res, 402, 'cost/cap-exceeded');
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return sendError(res, 500, 'config/missing-key', 'ANTHROPIC_API_KEY');

  let upstream: Response;
  try {
    upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
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
    return relayUpstreamError(res, upstream, 'anthropic/messages');
  }

  recordSpend(session.sub, cost);
  recordUsageEvent(session.sub, 'anthropic/messages', cost);
  const body = await upstream.json();
  res.status(200).json(body);
}
