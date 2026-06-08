import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sendError } from '../../lib/respond.js';
import { getWebSessionUser } from '../../lib/auth.js';
import { paymentOptions } from '../../lib/payments/service.js';

// GET /api/payments/crypto/options — the chains/coins currently payable (those
// with a configured receiving address) plus the tier prices. Login required so
// only real accounts see the payment surface.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const found = await getWebSessionUser(req);
  if (!found) return sendError(res, 401, 'auth/unauthorized');
  return res.status(200).json(paymentOptions());
}
