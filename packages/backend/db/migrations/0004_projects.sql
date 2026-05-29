-- Saved ad "projects" = the durable, account-scoped history that powers the
-- sidebar (Grok-style). Each row is one ad, stored as a JSONB snapshot of the
-- app's working state (brief + steps + caches + audience) so reopening an ad
-- is just a store rehydrate. Created by the postgres superuser; advert_app
-- receives DML on it automatically via the default privileges granted to it.
CREATE TABLE IF NOT EXISTS projects (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       text NOT NULL DEFAULT 'Untitled ad',
  locale      text,
  state       jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Sidebar lists a user's ads newest-first.
CREATE INDEX IF NOT EXISTS projects_user_updated_idx ON projects (user_id, updated_at DESC);
