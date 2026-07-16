// Stripe subscription lifecycle helpers. Called from webhook handler and API routes.
// Uses raw SQL for stripe_subscriptions (migration 0006) so the server starts
// cleanly before that migration has been applied.

import { sql } from 'drizzle-orm';
import { getDb } from '../db.js';
import { findUserByStripeCustomerId, setUserTier } from '../users.js';
import type { StripeTier, StripePeriod } from './stripe-client.js';

export type StripeSubRow = {
  userId: string;
  stripeSubId: string;
  stripeCustomer: string;
  tier: StripeTier;
  period: StripePeriod;
  status: string;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
};

// Upsert a subscription row and sync the user's tier.
export async function upsertStripeSubscription(row: StripeSubRow): Promise<void> {
  const db = getDb();
  await db.execute(sql`
    INSERT INTO stripe_subscriptions
      (user_id, stripe_sub_id, stripe_customer, tier, period, status, current_period_end, cancel_at_period_end, updated_at)
    VALUES
      (${row.userId}, ${row.stripeSubId}, ${row.stripeCustomer}, ${row.tier}, ${row.period},
       ${row.status}, ${row.currentPeriodEnd}, ${row.cancelAtPeriodEnd}, now())
    ON CONFLICT (stripe_sub_id) DO UPDATE SET
      status               = EXCLUDED.status,
      tier                 = EXCLUDED.tier,
      period               = EXCLUDED.period,
      current_period_end   = EXCLUDED.current_period_end,
      cancel_at_period_end = EXCLUDED.cancel_at_period_end,
      updated_at           = now()
  `);

  const active = row.status === 'active' || row.status === 'trialing';
  await setUserTier(row.userId, active ? row.tier : 'free');
}

// Resolve a Stripe customer ID to a user ID (via users.stripe_customer_id).
export async function userIdForCustomer(customerId: string): Promise<string | undefined> {
  const user = await findUserByStripeCustomerId(customerId);
  return user?.id;
}

// Return the most-recent subscription row for a user (for portal / UI info).
export async function activeSubscription(userId: string): Promise<StripeSubRow | undefined> {
  type Row = {
    user_id: string; stripe_sub_id: string; stripe_customer: string;
    tier: string; period: string; status: string;
    current_period_end: Date; cancel_at_period_end: boolean;
  };
  const result = await getDb().execute<Row>(sql`
    SELECT user_id, stripe_sub_id, stripe_customer, tier, period, status,
           current_period_end, cancel_at_period_end
    FROM stripe_subscriptions
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT 1
  `);
  const r = result.rows[0];
  if (!r) return undefined;
  return {
    userId: r.user_id,
    stripeSubId: r.stripe_sub_id,
    stripeCustomer: r.stripe_customer,
    tier: r.tier as StripeTier,
    period: r.period as StripePeriod,
    status: r.status,
    currentPeriodEnd: r.current_period_end,
    cancelAtPeriodEnd: r.cancel_at_period_end,
  };
}
