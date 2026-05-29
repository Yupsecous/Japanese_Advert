-- Subscription tier per user. 'free' default; upgraded by redeeming a fixed
-- tier key (see api/auth/redeem.ts). Enforcement is server-side (cost cap,
-- image-quality clamp, Kling gate) plus UI feature gating.
ALTER TABLE users ADD COLUMN IF NOT EXISTS tier text NOT NULL DEFAULT 'free';
