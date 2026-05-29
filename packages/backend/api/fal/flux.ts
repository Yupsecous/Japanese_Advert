import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { TIER_FAL_URL, TIER_EXTRAS, type ImageQualityTier } from '@advert/shared';
import { authenticate } from '../../lib/auth.js';
import { relayUpstreamError, requirePost, sendError } from '../../lib/respond.js';
import {
  recordSpend,
  refundSpend,
  costForFlux,
  wouldExceedCap,
  wouldExceedGlobalDailyCap,
  recordUsageEvent,
} from '../../lib/cost.js';
import { clampImageTier, costCapForTier } from '../../lib/tiers.js';
import { allow } from '../../lib/ratelimit.js';

// Tier-aware Flux proxy. The quality tier is clamped to the caller's plan, the
// requested dimensions are bounded, and cost is computed per-megapixel for the
// realistic tier (which fal.ai bills that way).

const BodyZ = z.object({
  prompt: z.string().min(1).max(4000),
  width: z.number().int().min(64).max(2048),
  height: z.number().int().min(64).max(2048),
  tier: z.enum(['fast', 'balanced', 'realistic']).default('fast'),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requirePost(req, res)) return;

  const session = await authenticate(req);
  if (!session) return sendError(res, 401, 'auth/unauthorized');
  // Image generation is comparatively expensive — a tighter bucket.
  if (!allow(`flux:${session.sub}`, 10, 0.2)) return sendError(res, 429, 'auth/rate-limited');

  const parsed = BodyZ.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 400, 'body/invalid', parsed.error.message);
  }
  const { prompt, width, height } = parsed.data;
  const tier = clampImageTier(session.tier, parsed.data.tier as ImageQualityTier);

  const cost = costForFlux(tier, width, height);
  if (
    wouldExceedCap(session.sub, cost, costCapForTier(session.tier)) ||
    (await wouldExceedGlobalDailyCap(cost))
  ) {
    return sendError(res, 402, 'cost/cap-exceeded');
  }

  const apiKey = process.env.FAL_API_KEY;
  if (!apiKey) return sendError(res, 500, 'config/missing-key', 'FAL_API_KEY');

  recordSpend(session.sub, cost);

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
    refundSpend(session.sub, cost);
    // eslint-disable-next-line no-console
    console.error('[fal/flux] fetch failed:', err);
    return sendError(res, 502, 'upstream/error');
  }

  if (!upstream.ok) {
    refundSpend(session.sub, cost);
    return relayUpstreamError(res, upstream, 'fal/flux');
  }

  recordUsageEvent(session.sub, 'fal/flux', cost);
  const body = await upstream.json();
  res.status(200).json(body);
}
