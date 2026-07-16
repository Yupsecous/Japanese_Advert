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

export function stripeEnabled(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
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
