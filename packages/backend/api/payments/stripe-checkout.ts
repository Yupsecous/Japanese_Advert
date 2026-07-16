import type { VercelRequest, VercelResponse } from '@vercel/node';
import { authenticate } from '../../lib/auth.js';
import { sendError, requirePost } from '../../lib/respond.js';
import { allow } from '../../lib/ratelimit.js';
import { findUserById, setStripeCustomerId } from '../../lib/users.js';
import { getStripe, stripeEnabled, stripePriceId, type StripeTier, type StripePeriod } from '../../lib/payments/stripe-client.js';

// POST /api/payments/stripe/create-checkout
// Body: { tier: 'pro'|'ultra', period: 'monthly'|'annual' }
// Returns: { url: string } — redirect to Stripe Checkout

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requirePost(req, res)) return;

  if (!stripeEnabled()) return sendError(res, 503, 'payment/disabled');

  const session = await authenticate(req);
  if (!session) return sendError(res, 401, 'auth/unauthorized');
  if (!allow(`stripe-checkout:${session.sub}`, 5, 0.1)) return sendError(res, 429, 'auth/rate-limited');

  const body = req.body as Record<string, unknown> | undefined;
  const tier: StripeTier = body?.tier === 'ultra' ? 'ultra' : 'pro';
  const period: StripePeriod = body?.period === 'annual' ? 'annual' : 'monthly';

  const price = stripePriceId(tier, period);
  if (!price) return sendError(res, 503, 'payment/disabled', `No price configured for ${tier}/${period}`);

  const user = await findUserById(session.sub);
  if (!user) return sendError(res, 401, 'auth/unauthorized');

  const stripe = getStripe();
  const origin = process.env.PUBLIC_ORIGIN ?? 'http://localhost:3001';

  let customerId = user.stripeCustomerId ?? undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.displayName ?? undefined,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
    await setStripeCustomerId(user.id, customerId);
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price, quantity: 1 }],
    success_url: `${origin}/?stripe=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/?stripe=canceled`,
    metadata: { userId: user.id, tier, period },
    subscription_data: { metadata: { userId: user.id, tier, period } },
    allow_promotion_codes: true,
  });

  res.status(200).json({ url: checkoutSession.url });
}
