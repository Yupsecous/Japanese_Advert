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

// Proxy for LLM chat completions via OpenRouter (openrouter.ai).
// OpenRouter is API-compatible with OpenAI's chat/completions endpoint,
// so we just swap the base URL and key. Model is clamped to the tier
// allow-list and max_tokens is bounded to prevent key abuse.

const MAX_BODY_BYTES = 512_000;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requirePost(req, res)) return;

  const session = await authenticate(req);
  if (!session) return sendError(res, 401, 'auth/unauthorized');
  if (!allow(`openai:${session.sub}`, 20, 0.5)) return sendError(res, 429, 'auth/rate-limited');

  const body = req.body as Record<string, unknown> | undefined;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return sendError(res, 400, 'body/invalid', 'expected a JSON object');
  }
  if (JSON.stringify(body).length > MAX_BODY_BYTES) {
    return sendError(res, 400, 'body/invalid', 'request too large');
  }

  const model = clampTextModel(
    session.tier,
    'openai',
    typeof body.model === 'string' ? body.model : undefined,
  );
  const reqMax = typeof body.max_tokens === 'number' ? body.max_tokens : 1000;
  const maxTokens = Math.min(Math.max(1, Math.floor(reqMax)), maxTokensCeiling(session.tier));

  const cost = costForText(model, maxTokens);
  if (
    wouldExceedCap(session.sub, cost, costCapForTier(session.tier)) ||
    (await wouldExceedGlobalDailyCap(cost))
  ) {
    return sendError(res, 402, 'cost/cap-exceeded');
  }

  const apiKey = process.env.OPENROUTER_API_KEY ?? process.env.OPENAI_API_KEY;
  if (!apiKey) return sendError(res, 500, 'config/missing-key', 'OPENROUTER_API_KEY');

  recordSpend(session.sub, cost);

  let upstream: Response;
  try {
    upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://personifyads.online',
        'X-Title': 'Personify Ads',
      },
      body: JSON.stringify({ ...body, model, max_tokens: maxTokens }),
    });
  } catch (err) {
    refundSpend(session.sub, cost);
    // eslint-disable-next-line no-console
    console.error('[openai/chat] fetch failed:', err);
    return sendError(res, 502, 'upstream/error');
  }

  if (!upstream.ok) {
    refundSpend(session.sub, cost);
    return relayUpstreamError(res, upstream, 'openai/chat');
  }

  recordUsageEvent(session.sub, 'openai/chat', cost);
  const respBody = await upstream.json();
  res.status(200).json(respBody);
}
