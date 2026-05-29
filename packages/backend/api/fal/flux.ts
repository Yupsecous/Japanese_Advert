import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import {
  TIER_FAL_URL,
  TIER_EXTRAS,
  type ImageQualityTier,
} from '@advert/shared';
import { authenticate } from '../../lib/auth.js';
import {
  relayUpstreamError,
  requirePost,
  sendError,
} from '../../lib/respond.js';
import { recordSpend, costForFlux, wouldExceedCap, wouldExceedGlobalDailyCap, recordUsageEvent } from '../../lib/cost.js';
import { clampImageTier, costCapForTier } from '../../lib/tiers.js';

// Tier-aware Flux proxy. Client provides prompt + dimensions + tier; we
// pick the right fal.ai endpoint and inject the per-tier inference params.
//
// Why tier on the server side: the per-tier cost numbers live in shared,
// so the server can rate-limit + cap correctly without trusting the
// client to report the tier it actually paid for.

const BodyZ = z.object({
  prompt: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  tier: z.enum(['fast', 'balanced', 'realistic']).default('fast'),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requirePost(req, res)) return;

  const session = await authenticate(req);
  if (!session) return sendError(res, 401, 'auth/unauthorized');

  const parsed = BodyZ.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 400, 'body/invalid', parsed.error.message);
  }
  const { prompt, width, height } = parsed.data;
  // Clamp the requested quality to what the caller's tier allows (server
  // backstop; the UI already restricts the picker per tier).
  const tier = clampImageTier(session.tier, parsed.data.tier as ImageQualityTier);

  const cost = costForFlux(tier);
  if (
    wouldExceedCap(session.sub, cost, costCapForTier(session.tier)) ||
    (await wouldExceedGlobalDailyCap(cost))
  ) {
    return sendError(res, 402, 'cost/cap-exceeded');
  }

  const apiKey = process.env.FAL_API_KEY;
  if (!apiKey) return sendError(res, 500, 'config/missing-key', 'FAL_API_KEY');

  let upstream: Response;
  try {
    upstream = await fetch(TIER_FAL_URL[tier], {
      method: 'POST',
      headers: {
        Authorization: `Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        image_size: { width, height },
        num_images: 1,
        enable_safety_checker: true,
        ...TIER_EXTRAS[tier],
      }),
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
    return relayUpstreamError(res, upstream, 'fal/flux');
  }

  recordSpend(session.sub, cost);
  recordUsageEvent(session.sub, 'fal/flux', cost);
  const body = await upstream.json();
  res.status(200).json(body);
}
