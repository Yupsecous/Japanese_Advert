import type { VercelRequest, VercelResponse } from '@vercel/node';
import { authenticate } from '../../lib/auth.js';
import {
  relayUpstreamError,
  requirePost,
  sendError,
} from '../../lib/respond.js';
import { recordSpend, costForText, wouldExceedCap, wouldExceedGlobalDailyCap, recordUsageEvent } from '../../lib/cost.js';
import { costCapForTier } from '../../lib/tiers.js';

// Pass-through proxy for OpenAI chat completions. The client sends the
// exact body it would send to the OpenAI endpoint; we forward it with
// the server-side API key. Strict mode JSON schema responses are
// supported because the body is opaque to us.

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requirePost(req, res)) return;

  const session = await authenticate(req);
  if (!session) return sendError(res, 401, 'auth/unauthorized');

  const cost = costForText();
  if (
    wouldExceedCap(session.sub, cost, costCapForTier(session.tier)) ||
    (await wouldExceedGlobalDailyCap(cost))
  ) {
    return sendError(res, 402, 'cost/cap-exceeded');
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return sendError(res, 500, 'config/missing-key', 'OPENAI_API_KEY');

  let upstream: Response;
  try {
    upstream = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
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
    return relayUpstreamError(res, upstream, 'openai/chat');
  }

  recordSpend(session.sub, cost);
  recordUsageEvent(session.sub, 'openai/chat', cost);
  const body = await upstream.json();
  res.status(200).json(body);
}
