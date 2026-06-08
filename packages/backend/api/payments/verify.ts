import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { sendError, requirePost } from '../../lib/respond.js';
import { allow, clientIp } from '../../lib/ratelimit.js';
import { getWebSessionUser } from '../../lib/auth.js';
import { verifyPayment } from '../../lib/payments/service.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const BodyZ = z.object({
  orderId: z.string().regex(UUID_RE),
  txHash: z.string().min(4).max(200),
});

// POST /api/payments/crypto/verify — the user pastes the transaction hash after
// paying; we read the chain and, if it genuinely paid the order's address for
// >= the quoted amount with enough confirmations, grant the tier. Idempotent:
// re-verifying an already-confirmed order just returns the (already-upgraded)
// user. The throttle is a bit looser since users may poll while confirmations
// accrue.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requirePost(req, res)) return;
  if (!allow(`pay-verify:${clientIp(req)}`, 15, 0.3)) return sendError(res, 429, 'auth/rate-limited');

  const found = await getWebSessionUser(req);
  if (!found) return sendError(res, 401, 'auth/unauthorized');
  if (!allow(`pay-verify-user:${found.user.id}`, 15, 0.2)) {
    return sendError(res, 429, 'auth/rate-limited');
  }

  const parsed = BodyZ.safeParse(req.body);
  if (!parsed.success) return sendError(res, 400, 'body/invalid');

  const result = await verifyPayment({
    userId: found.user.id,
    orderId: parsed.data.orderId,
    txHash: parsed.data.txHash,
  });
  if (!result.ok) return sendError(res, result.status, result.code);
  return res.status(200).json({ ok: true, user: result.user, tier: result.tier });
}
