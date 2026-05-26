// Soft per-session cost cap. In-memory only — restarts of the Vercel
// function reset the counter, which is fine for an internal tool. For
// stricter enforcement, swap the Map for Upstash Redis (free tier covers
// this use case).
//
// Rough cost model: only the fal.ai endpoints and Kling are billed at
// per-call rates worth tracking. OpenAI/Anthropic/ElevenLabs costs are
// rolled into a flat "text-call" estimate. Numbers match
// packages/shared/src/pricing.ts.

import { TIER_COST_USD, KLING_COST_USD_PER_CLIP } from '@advert/shared';
import type { ImageQualityTier } from '@advert/shared';

const TEXT_CALL_USD = 0.005;

const sessionSpend = new Map<string, number>();

export function recordSpend(sid: string, amount: number): void {
  sessionSpend.set(sid, (sessionSpend.get(sid) ?? 0) + amount);
}

export function sessionTotalUsd(sid: string): number {
  return sessionSpend.get(sid) ?? 0;
}

// Returns true if charging `amount` would exceed the cap. Cap of 0 disables.
export function wouldExceedCap(sid: string, amount: number): boolean {
  const cap = Number(process.env.SESSION_COST_CAP_USD ?? 20);
  if (cap <= 0) return false;
  return sessionTotalUsd(sid) + amount > cap;
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
