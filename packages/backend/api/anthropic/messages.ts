import type { VercelRequest, VercelResponse } from '@vercel/node';
import { authenticate } from '../../lib/auth.js';
import { relayUpstreamError, requirePost, sendError } from '../../lib/respond.js';
import {
  recordSpend,
  refundSpend,
  costForText,
  wouldExceedCap,
  wouldExceedGlobalDailyCap,
  recordUsageEvent,
} from '../../lib/cost.js';
import { costCapForTier, clampTextModel, maxTokensCeiling } from '../../lib/tiers.js';
import { allow } from '../../lib/ratelimit.js';

// Proxy for Anthropic /v1/messages (copy generation + critique + design).
// The body is NO LONGER forwarded opaquely: the model is clamped to the
// caller's tier (Opus → Pro/Ultra only, which is how the Design paywall is
// enforced) and max_tokens is bounded, then cost is billed by model so the
// per-user/global caps reflect real spend.

const MAX_BODY_BYTES = 512_000;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requirePost(req, res)) return;

  const session = await authenticate(req);
  if (!session) return sendError(res, 401, 'auth/unauthorized');
  if (!allow(`anthropic:${session.sub}`, 20, 0.5)) return sendError(res, 429, 'auth/rate-limited');

  const body = req.body as Record<string, unknown> | undefined;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return sendError(res, 400, 'body/invalid', 'expected a JSON object');
  }
  if (JSON.stringify(body).length > MAX_BODY_BYTES) {
    return sendError(res, 400, 'body/invalid', 'request too large');
  }

  const model = clampTextModel(
    session.tier,
    'anthropic',
    typeof body.model === 'string' ? body.model : undefined,
  );
  const reqMax = typeof body.max_tokens === 'number' ? body.max_tokens : 2000;
  const maxTokens = Math.min(Math.max(1, Math.floor(reqMax)), maxTokensCeiling(session.tier));

  const cost = costForText(model, maxTokens);
  if (
    wouldExceedCap(session.sub, cost, costCapForTier(session.tier)) ||
    (await wouldExceedGlobalDailyCap(cost))
  ) {
    return sendError(res, 402, 'cost/cap-exceeded');
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return sendError(res, 500, 'config/missing-key', 'ANTHROPIC_API_KEY');

  // Reserve before the call so concurrent requests can't all pass the cap.
  recordSpend(session.sub, cost);

  let upstream: Response;
  try {
    upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...body, model, max_tokens: maxTokens }),
    });
  } catch (err) {
    refundSpend(session.sub, cost);
    // eslint-disable-next-line no-console
    console.error('[anthropic/messages] fetch failed:', err);
    return sendError(res, 502, 'upstream/error');
  }

  if (!upstream.ok) {
    refundSpend(session.sub, cost);
    return relayUpstreamError(res, upstream, 'anthropic/messages');
  }

  recordUsageEvent(session.sub, 'anthropic/messages', cost);
  const respBody = await upstream.json();
  res.status(200).json(respBody);
}
