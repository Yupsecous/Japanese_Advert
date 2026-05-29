-- The global daily spend cap sums usage_events by created_at on EVERY billed
-- generation. The existing indexes lead with (user_id|sub, created_at), so a
-- predicate on created_at alone seq-scans. Add a created_at-leading index.
CREATE INDEX IF NOT EXISTS usage_events_created_idx ON usage_events (created_at);
