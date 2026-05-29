-- Initial schema: users, oauth links, sessions, single-use tokens, usage ledger.
-- Idempotent (IF NOT EXISTS) so a re-run is harmless. Applied by migrate.ts
-- inside a transaction and recorded in the _migrations table.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email             text NOT NULL UNIQUE,            -- stored lower-cased
  email_verified_at timestamptz,                     -- NULL = unverified
  password_hash     text,                            -- NULL for OAuth-only
  display_name      text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS oauth_accounts (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider          text NOT NULL,                   -- 'google'
  provider_user_id  text NOT NULL,                   -- Google `sub`
  email_at_provider text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_user_id)
);
CREATE INDEX IF NOT EXISTS oauth_accounts_user_idx ON oauth_accounts (user_id);

CREATE TABLE IF NOT EXISTS sessions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  char(64) NOT NULL UNIQUE,              -- sha256(raw) hex
  user_agent  text,
  ip          text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz NOT NULL,
  revoked_at  timestamptz                            -- NULL = active
);
CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions (user_id);
CREATE INDEX IF NOT EXISTS sessions_expires_idx ON sessions (expires_at);

CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  char(64) NOT NULL UNIQUE,
  expires_at  timestamptz NOT NULL,                  -- now() + 24h
  consumed_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS evt_user_idx ON email_verification_tokens (user_id);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  char(64) NOT NULL UNIQUE,
  expires_at  timestamptz NOT NULL,                  -- now() + 1h
  consumed_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS prt_user_idx ON password_reset_tokens (user_id);

CREATE TABLE IF NOT EXISTS usage_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES users(id) ON DELETE SET NULL,
  sub         text NOT NULL,                         -- covers legacy shared-cred
  route       text NOT NULL,
  cost_usd    numeric(10,5) NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS usage_user_time_idx ON usage_events (user_id, created_at);
CREATE INDEX IF NOT EXISTS usage_sub_time_idx  ON usage_events (sub, created_at);
