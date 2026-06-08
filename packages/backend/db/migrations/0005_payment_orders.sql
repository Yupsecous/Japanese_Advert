-- Crypto payment orders. A logged-in user creates an order to buy a tier
-- (pro/ultra), pays the quoted amount ON-CHAIN to a configured receiving
-- address from their own wallet, then submits the transaction hash. The backend
-- verifies that transaction on the relevant chain (correct address, amount >=
-- quoted, enough confirmations, hash not already used) and, on success, grants
-- the tier. Non-custodial: funds go straight to the operator's wallet — there is
-- no third-party processor and the server never holds keys or funds.
--
-- Created by the postgres superuser; advert_app receives DML on it automatically
-- via the default privileges granted to that role at DB setup time.
CREATE TABLE IF NOT EXISTS payment_orders (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tier          text NOT NULL CHECK (tier IN ('pro', 'ultra')),   -- granted on success
  chain         text NOT NULL,                   -- 'ethereum' | 'arbitrum' | 'bnb' | 'bitcoin' | 'solana'
  asset         text NOT NULL,                   -- 'ETH' | 'BNB' | 'BTC' | 'SOL' | 'USDT' | 'USDC'
  address       text NOT NULL,                   -- receiving address LOCKED at order-creation time
  amount_atomic text NOT NULL,                   -- required amount in the asset's smallest unit (decimal string)
  decimals      integer NOT NULL,                -- token decimals (atomic = display * 10^decimals)
  amount_usd    numeric(12, 2) NOT NULL,         -- USD price quoted at order time
  status        text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'confirmed', 'expired')),
  tx_hash       text,                            -- the settling transaction (set on confirm)
  created_at    timestamptz NOT NULL DEFAULT now(),
  expires_at    timestamptz NOT NULL,
  confirmed_at  timestamptz
);

-- A given on-chain transaction can settle AT MOST ONE order. Partial+lower() so
-- the guard is case-insensitive (EVM hashes) and ignores still-pending orders.
CREATE UNIQUE INDEX IF NOT EXISTS payment_orders_tx_hash_key
  ON payment_orders (lower(tx_hash)) WHERE tx_hash IS NOT NULL;

-- Look up a user's recent / pending orders quickly.
CREATE INDEX IF NOT EXISTS payment_orders_user_created_idx
  ON payment_orders (user_id, created_at DESC);
