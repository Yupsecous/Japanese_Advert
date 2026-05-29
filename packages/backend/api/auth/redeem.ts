import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { sendError, requirePost } from '../../lib/respond.js';
import { allow, clientIp } from '../../lib/ratelimit.js';
import { getWebSessionUser } from '../../lib/auth.js';
import { setUserTier, findUserById, toPublicUser } from '../../lib/users.js';
import type { Tier } from '../../lib/tiers.js';

const BodyZ = z.object({ key: z.string().min(1).max(200) });

// Redeem a fixed tier key (stand-in for real subscriptions). A logged-in user
// pastes the Pro or Ultra key; their account tier is upgraded. Unknown key →
// 400. The keys are set server-side: TIER_PRO_KEY / TIER_ULTRA_KEY.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requirePost(req, res)) return;
  if (!allow(`redeem:${clientIp(req)}`, 8, 0.1)) return sendError(res, 429, 'auth/rate-limited');

  const found = await getWebSessionUser(req);
  if (!found) return sendError(res, 401, 'auth/unauthorized');

  const parsed = BodyZ.safeParse(req.body);
  if (!parsed.success) return sendError(res, 400, 'body/invalid', parsed.error.message);
  const key = parsed.data.key.trim();

  const proKey = process.env.TIER_PRO_KEY?.trim();
  const ultraKey = process.env.TIER_ULTRA_KEY?.trim();

  let tier: Tier | null = null;
  if (ultraKey && key === ultraKey) tier = 'ultra';
  else if (proKey && key === proKey) tier = 'pro';

  if (!tier) return sendError(res, 400, 'auth/token-invalid', 'unknown tier key');

  await setUserTier(found.user.id, tier);
  const updated = await findUserById(found.user.id);
  return res.status(200).json({ ok: true, user: updated ? toPublicUser(updated) : null, tier });
}
