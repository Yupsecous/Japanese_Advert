import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { sendError, requirePost } from '../../lib/respond.js';
import { allow, clientIp } from '../../lib/ratelimit.js';
import { getWebSessionUser } from '../../lib/auth.js';
import { createPaymentOrder } from '../../lib/payments/service.js';

const BodyZ = z.object({
  tier: z.enum(['pro', 'ultra']),
  chain: z.string().min(1).max(32),
  asset: z.string().min(1).max(16),
});

// POST /api/payments/crypto/create-order — quote a tier purchase in a chosen
// coin: locks the token amount at the current price and returns the receiving
// address + amount + expiry. Non-custodial; no funds move through the server.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requirePost(req, res)) return;
  if (!allow(`pay-order:${clientIp(req)}`, 10, 0.2)) return sendError(res, 429, 'auth/rate-limited');

  const found = await getWebSessionUser(req);
  if (!found) return sendError(res, 401, 'auth/unauthorized');
  if (!allow(`pay-order-user:${found.user.id}`, 10, 0.1)) {
    return sendError(res, 429, 'auth/rate-limited');
  }

  const parsed = BodyZ.safeParse(req.body);
  if (!parsed.success) return sendError(res, 400, 'body/invalid');

  const result = await createPaymentOrder({ userId: found.user.id, ...parsed.data });
  if (!result.ok) return sendError(res, result.status, result.code);
  return res.status(200).json({ order: result.order });
}
