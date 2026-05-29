// Soft per-principal cost cap. In-memory — resets on restart, which is fine
// for a soft cap. The `key` is session.sub: a user id for web/real accounts,
// or the shared-cred username for the legacy Android flow.
//
// A durable per-call ledger is also written to usage_events (recordUsageEvent)
// so the cap can later be enforced from the database without a migration.
//
// Rough cost model: only the fal.ai endpoints and Kling are billed at
// per-call rates worth tracking. OpenAI/Anthropic/ElevenLabs costs are
// rolled into a flat "text-call" estimate. Numbers match
// packages/shared/src/pricing.ts.

import { TIER_COST_USD, KLING_COST_USD_PER_CLIP } from '@advert/shared';
import type { ImageQualityTier } from '@advert/shared';
import { getDb } from './db.js';
import { usageEvents } from './schema.js';

const TEXT_CALL_USD = 0.005;

const spend = new Map<string, number>();

export function recordSpend(key: string, amount: number): void {
  spend.set(key, (spend.get(key) ?? 0) + amount);
}

export function sessionTotalUsd(key: string): number {
  return spend.get(key) ?? 0;
}

// Returns true if charging `amount` would exceed `capUsd`. Cap of 0 = unlimited.
// Callers pass the per-tier cap (lib/tiers.ts costCapForTier).
export function wouldExceedCap(key: string, amount: number, capUsd: number): boolean {
  if (capUsd <= 0) return false;
  return sessionTotalUsd(key) + amount > capUsd;
}

export function costForText(): number {
  return TEXT_CALL_USD;
}

export function costForFlux(tier: ImageQualityTier): number {
  return TIER_COST_USD[tier];
}

export function costForKling(): number {
  return KLING_COST_USD_PER_CLIP;
}

// Best-effort durable usage row. Fire-and-forget — never blocks or throws
// into the request path; a no-op when the DB isn't configured (Android-only
// deploys without DATABASE_URL).
export function recordUsageEvent(sub: string, route: string, costUsd: number): void {
  try {
    void getDb()
      .insert(usageEvents)
      .values({ sub, route, costUsd: costUsd.toFixed(5) })
      .then(
        () => undefined,
        () => undefined,
      );
  } catch {
    // DATABASE_URL not set — skip durable logging.
  }
}
