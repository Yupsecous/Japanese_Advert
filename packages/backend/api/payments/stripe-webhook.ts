import type { VercelRequest, VercelResponse } from '@vercel/node';
import type Stripe from 'stripe';
import { getStripe, stripeWebhookSecret } from '../../lib/payments/stripe-client.js';
import { upsertStripeSubscription, userIdForCustomer } from '../../lib/payments/stripe-service.js';
import type { StripeTier, StripePeriod } from '../../lib/payments/stripe-client.js';

// POST /api/payments/stripe/webhook
// Raw body required — mounted with express.raw() BEFORE express.json().
// Verifies the Stripe-Signature header before processing any event.

function toTier(v: unknown): StripeTier {
  return v === 'ultra' ? 'ultra' : 'pro';
}
function toPeriod(v: unknown): StripePeriod {
  return v === 'annual' ? 'annual' : 'monthly';
}

// In Stripe API 2026-06-24.dahlia, current_period_end was removed from the
// top-level Subscription object and moved into billing_schedules[0].bill_until.
// Fall back to billing_cycle_anchor + 31 days if schedules are empty.
function getPeriodEnd(sub: Stripe.Subscription): Date {
  const schedule = sub.billing_schedules?.[0];
  if (schedule?.bill_until?.computed_timestamp) {
    return new Date(schedule.bill_until.computed_timestamp * 1000);
  }
  return new Date((sub.billing_cycle_anchor + 31 * 24 * 3600) * 1000);
}

async function handleSubscription(sub: Stripe.Subscription): Promise<void> {
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
  const userId = await userIdForCustomer(customerId);
  if (!userId) {
    // eslint-disable-next-line no-console
    console.warn('[stripe/webhook] no user found for customer', customerId);
    return;
  }

  const meta = sub.metadata ?? {};
  const tier = toTier(meta.tier);
  const period = toPeriod(meta.period);

  await upsertStripeSubscription({
    userId,
    stripeSubId: sub.id,
    stripeCustomer: customerId,
    tier,
    period,
    status: sub.status,
    currentPeriodEnd: getPeriodEnd(sub),
    cancelAtPeriodEnd: sub.cancel_at_period_end,
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ code: 'method/not-allowed' });
    return;
  }

  const secret = stripeWebhookSecret();
  if (!secret) {
    // eslint-disable-next-line no-console
    console.error('[stripe/webhook] STRIPE_WEBHOOK_SECRET not set');
    res.status(500).json({ code: 'config/missing-key' });
    return;
  }

  const sig = req.headers['stripe-signature'];
  if (!sig || typeof sig !== 'string') {
    res.status(400).json({ code: 'body/invalid', detail: 'missing stripe-signature' });
    return;
  }

  let event: Stripe.Event;
  try {
    // req.body is a Buffer because this route uses express.raw() middleware.
    event = getStripe().webhooks.constructEvent(req.body as Buffer, sig, secret);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[stripe/webhook] signature verification failed:', err);
    res.status(400).json({ code: 'body/invalid', detail: 'signature mismatch' });
    return;
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await handleSubscription(event.data.object as Stripe.Subscription);
        break;
      // Log other event types we might add later without error-ing.
      default:
        break;
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[stripe/webhook] handler error:', event.type, err);
    res.status(500).json({ code: 'unknown' });
    return;
  }

  res.status(200).json({ received: true });
}
