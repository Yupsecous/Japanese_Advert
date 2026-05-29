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

import { sql } from 'drizzle-orm';
import { TIER_COST_USD, KLING_COST_USD_PER_CLIP } from '@advert/shared';
import type { ImageQualityTier } from '@advert/shared';
import { getDb } from './db.js';
import { usageEvents } from './schema.js';

const TEXT_CALL_USD = 0.005;

const spend = new Map<string, number>();

export function recordSpend(key: string, amount: number): void {
  spend.set(key, (spend.get(key) ?? 0) + amount);
}

// Refund a previously-reserved charge (on upstream failure). Never goes below 0.
export function refundSpend(key: string, amount: number): void {
  spend.set(key, Math.max(0, (spend.get(key) ?? 0) - amount));
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

// Model-aware text cost: estimate worst-case output cost so the cap reflects
// reality (Opus ~5x Sonnet, gpt-4o-mini negligible). Prevents a caller from
// running an expensive model/large max_tokens while being billed a flat rate.
// Rough USD per 1M output tokens.
function perMTokOut(model: string): number {
  const m = model.toLowerCase();
  if (m.includes('opus')) return 75;
  if (m.includes('sonnet')) return 15;
  if (m.includes('gpt-4o') && !m.includes('mini')) return 10;
  return 0.6; // gpt-4o-mini and other cheap models
}

export function costForText(model?: string, maxTokens?: number): number {
  const tokens = maxTokens && maxTokens > 0 ? maxTokens : 1000;
  return Math.max(TEXT_CALL_USD, (tokens / 1_000_000) * perMTokOut(model ?? ''));
}

// ElevenLabs bills per character; reflect that instead of a flat rate.
export function costForTts(chars: number): number {
  return Math.max(TEXT_CALL_USD, (Math.max(0, chars) / 1000) * 0.1);
}

// Realistic tier (flux-pro v1.1) is billed by fal.ai PER MEGAPIXEL (rounded up),
// so a >1MP image costs a multiple of the base. Account for that when known.
export function costForFlux(tier: ImageQualityTier, width?: number, height?: number): number {
  if (tier === 'realistic' && width && height) {
    const mp = Math.max(1, Math.ceil((width * height) / 1_000_000));
    return TIER_COST_USD.realistic * mp;
  }
  return TIER_COST_USD[tier];
}

export function costForKling(): number {
  return KLING_COST_USD_PER_CLIP;
}

// --- Global daily spend cap (across ALL users) ---
// Hard ceiling on total API spend per UTC day, computed from the durable
// usage_events ledger so it survives restarts. Protects against unbounded
// cost on the open-signup deployment (per-user caps alone don't bound the
// total when anyone can create accounts). 0 = disabled.
export function globalDailyCapUsd(): number {
  return Number(process.env.GLOBAL_DAILY_CAP_USD ?? 0);
}

export async function globalDailySpendUsd(): Promise<number> {
  const rows = await getDb()
    .select({ total: sql<string>`coalesce(sum(${usageEvents.costUsd}), 0)` })
    .from(usageEvents)
    .where(sql`${usageEvents.createdAt} >= date_trunc('day', now())`);
  return Number(rows[0]?.total ?? 0);
}

export async function wouldExceedGlobalDailyCap(amount: number): Promise<boolean> {
  const cap = globalDailyCapUsd();
  if (cap <= 0) return false; // cap disabled → nothing to enforce
  try {
    return (await globalDailySpendUsd()) + amount > cap;
  } catch (err) {
    // Fail CLOSED: if we can't read the ledger we must NOT spend money. (The
    // earlier fail-open behavior meant any DB hiccup unlocked unlimited spend.)
    // eslint-disable-next-line no-console
    console.error('[cost] global cap check failed — blocking (fail-closed):', err);
    return true;
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Durable per-call ledger row, written AFTER a successful billed call. Errors
// are logged (not swallowed) so silent under-counting — which would defeat the
// global cap — is visible. Populates user_id when sub is a real account id.
export function recordUsageEvent(sub: string, route: string, costUsd: number): void {
  try {
    const values: { sub: string; route: string; costUsd: string; userId?: string } = {
      sub,
      route,
      costUsd: costUsd.toFixed(5),
    };
    if (UUID_RE.test(sub)) values.userId = sub;
    void getDb()
      .insert(usageEvents)
      .values(values)
      .then(
        () => undefined,
        (err) => {
          // eslint-disable-next-line no-console
          console.error('[cost] usage_events insert failed (cap may under-count):', err);
        },
      );
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[cost] usage_events skipped (no DB?):', err);
  }
}
