import Stripe from 'stripe';

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY not configured');
    _stripe = new Stripe(key);
  }
  return _stripe;
}

// Card payment is only "enabled" with a secret key AND at least one price.
// A key alone is not enough: create-checkout looks up STRIPE_PRICE_<TIER>_<PERIOD>
// and 503s with "No price configured" when it is missing, so reporting enabled
// on the key alone makes /api/config advertise a card-payment path in the UI
// that cannot complete. Better to hide it until the catalog is wired up.
export function stripeEnabled(): boolean {
  if (!process.env.STRIPE_SECRET_KEY) return false;
  return (
    !!stripePriceId('pro', 'monthly') ||
    !!stripePriceId('pro', 'annual') ||
    !!stripePriceId('ultra', 'monthly') ||
    !!stripePriceId('ultra', 'annual')
  );
}

export type StripeTier = 'pro' | 'ultra';
export type StripePeriod = 'monthly' | 'annual';

export function stripePriceId(tier: StripeTier, period: StripePeriod): string | undefined {
  const key = `STRIPE_PRICE_${tier.toUpperCase()}_${period.toUpperCase()}`;
  return process.env[key] || undefined;
}

export function stripePublishableKey(): string | undefined {
  return process.env.STRIPE_PUBLISHABLE_KEY || undefined;
}

export function stripeWebhookSecret(): string | undefined {
  return process.env.STRIPE_WEBHOOK_SECRET || undefined;
}
