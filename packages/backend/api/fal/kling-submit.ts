import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { KLING_SUBMIT_URL } from '@advert/shared';
import { authenticate } from '../../lib/auth.js';
import { relayUpstreamError, requirePost, sendError } from '../../lib/respond.js';
import {
  recordSpend,
  refundSpend,
  costForKling,
  wouldExceedCap,
  wouldExceedGlobalDailyCap,
  recordUsageEvent,
} from '../../lib/cost.js';
import { canKling, costCapForTier } from '../../lib/tiers.js';
import { allow } from '../../lib/ratelimit.js';

// Submit a Kling v1.6 image-to-video job (Ultra-only, priciest per-call op).
// The image_url is forwarded to fal.ai, which fetches it — so we restrict it
// to fal's own media hosts to prevent using fal as an SSRF fetch proxy for
// arbitrary attacker URLs. Legitimate images always come from a prior Flux
// response on *.fal.media.

const BodyZ = z.object({
  prompt: z.string().min(1).max(4000),
  imageUrl: z.string().url(),
  aspect: z.enum(['9x16', '1x1']),
});

const ASPECT_RATIO = { '9x16': '9:16', '1x1': '1:1' } as const;

const ALLOWED_IMAGE_HOSTS = ['fal.media', 'fal.run', 'fal.ai'];

function isAllowedImageUrl(raw: string): boolean {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return false;
  }
  if (u.protocol !== 'https:') return false;
  const host = u.hostname.toLowerCase();
  return ALLOWED_IMAGE_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requirePost(req, res)) return;

  const session = await authenticate(req);
  if (!session) return sendError(res, 401, 'auth/unauthorized');
  if (!canKling(session.tier)) return sendError(res, 403, 'tier/forbidden');
  if (!allow(`kling:${session.sub}`, 5, 0.05)) return sendError(res, 429, 'auth/rate-limited');

  const parsed = BodyZ.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 400, 'body/invalid', parsed.error.message);
  }
  if (!isAllowedImageUrl(parsed.data.imageUrl)) {
    return sendError(res, 400, 'body/invalid', 'imageUrl host not allowed');
  }

  const cost = costForKling();
  if (
    wouldExceedCap(session.sub, cost, costCapForTier(session.tier)) ||
    (await wouldExceedGlobalDailyCap(cost))
  ) {
    return sendError(res, 402, 'cost/cap-exceeded');
  }

  const apiKey = process.env.FAL_API_KEY;
  if (!apiKey) return sendError(res, 500, 'config/missing-key', 'FAL_API_KEY');

  // Kling bills on submission; reserve the charge now and refund if submit fails.
  recordSpend(session.sub, cost);

  let upstream: Response;
  try {
    upstream = await fetch(KLING_SUBMIT_URL, {
      method: 'POST',
      headers: {
        Authorization: `Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: parsed.data.prompt,
        image_url: parsed.data.imageUrl,
        duration: '5',
        aspect_ratio: ASPECT_RATIO[parsed.data.aspect],
      }),
    });
  } catch (err) {
    refundSpend(session.sub, cost);
    // eslint-disable-next-line no-console
    console.error('[fal/kling-submit] fetch failed:', err);
    return sendError(res, 502, 'upstream/error');
  }

  if (!upstream.ok) {
    refundSpend(session.sub, cost);
    return relayUpstreamError(res, upstream, 'fal/kling-submit');
  }

  recordUsageEvent(session.sub, 'fal/kling-submit', cost);
  const body = await upstream.json();
  res.status(200).json(body);
}
