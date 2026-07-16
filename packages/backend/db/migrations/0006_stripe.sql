-- Stripe subscription billing. Users who pay by card get a Stripe Subscription;
-- we mirror the state here so the tier grant survives a process restart and can
-- be enforced without hitting Stripe on every request.
--
-- Run as the postgres superuser (same as 0005) because advert_app needs
-- REFERENCES to create the FK. After creation, advert_app gets DML via the
-- default privileges already in place.

-- One Stripe customer per user (created lazily on first checkout).
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id text;
CREATE INDEX IF NOT EXISTS users_stripe_customer_id_idx
  ON users (stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

-- Mirror of the Stripe Subscription object. One active row per user at most
-- (the most-recent subscription wins; old ones stay for the audit trail).
-- status mirrors Stripe's lifecycle: active, canceled, past_due, unpaid,
-- incomplete, trialing, paused. We grant tier when status = 'active' | 'trialing'
-- and downgrade to 'free' when status = 'canceled' | 'unpaid'.
CREATE TABLE IF NOT EXISTS stripe_subscriptions (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_sub_id        text NOT NULL UNIQUE,   -- sub_...
  stripe_customer      text NOT NULL,           -- cus_...
  tier                 text NOT NULL CHECK (tier IN ('pro', 'ultra')),
  period               text NOT NULL CHECK (period IN ('monthly', 'annual')),
  status               text NOT NULL,           -- Stripe subscription status
  current_period_end   timestamptz NOT NULL,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS stripe_subscriptions_user_id_idx
  ON stripe_subscriptions (user_id);
CREATE INDEX IF NOT EXISTS stripe_subscriptions_customer_idx
  ON stripe_subscriptions (stripe_customer);

-- Grant DML on new table and new column to advert_app.
GRANT SELECT, INSERT, UPDATE, DELETE ON stripe_subscriptions TO advert_app;
