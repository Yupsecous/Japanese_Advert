import type { VercelRequest, VercelResponse } from '@vercel/node';
import { authenticate } from '../../lib/auth.js';
import { sendError, requirePost } from '../../lib/respond.js';
import { allow } from '../../lib/ratelimit.js';
import { findUserById } from '../../lib/users.js';
import { getStripe, stripeEnabled } from '../../lib/payments/stripe-client.js';

// POST /api/payments/stripe/portal
// Returns: { url: string } — redirect to Stripe Customer Portal
// where users can cancel, change plan, update payment method, etc.

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requirePost(req, res)) return;

  if (!stripeEnabled()) return sendError(res, 503, 'payment/disabled');

  const session = await authenticate(req);
  if (!session) return sendError(res, 401, 'auth/unauthorized');
  if (!allow(`stripe-portal:${session.sub}`, 3, 0.05)) return sendError(res, 429, 'auth/rate-limited');

  const user = await findUserById(session.sub);
  if (!user?.stripeCustomerId) {
    return sendError(res, 404, 'payment/not-found', 'No Stripe subscription found');
  }

  const stripe = getStripe();
  const origin = process.env.PUBLIC_ORIGIN ?? 'http://localhost:3001';

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${origin}/`,
  });

  res.status(200).json({ url: portalSession.url });
}
