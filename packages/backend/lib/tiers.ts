// Subscription tier policy — the single source of truth for server-side
// enforcement. Free/Pro/Ultra. Steps are gated in the web UI; the costly,
// abusable bits are enforced here: per-tier cumulative cost cap, image-quality
// clamp, and the Kling (paid video) gate.

import type { ImageQualityTier } from '@advert/shared';

export type Tier = 'free' | 'pro' | 'ultra';

export function isTier(v: unknown): v is Tier {
  return v === 'free' || v === 'pro' || v === 'ultra';
}

// Image quality tiers each plan may use. Free: cheapest only. Pro: + balanced.
// Ultra: all (incl. the priciest realistic/Pro model).
export function allowedImageTiers(tier: Tier): ImageQualityTier[] {
  if (tier === 'free') return ['fast'];
  if (tier === 'pro') return ['fast', 'balanced'];
  return ['fast', 'balanced', 'realistic'];
}

// Server backstop: if a caller requests a tier they're not entitled to, fall
// back to the highest one they ARE entitled to (never error the generation).
export function clampImageTier(tier: Tier, requested: ImageQualityTier): ImageQualityTier {
  const allowed = allowedImageTiers(tier);
  if (allowed.includes(requested)) return requested;
  return allowed[allowed.length - 1]!;
}

// Kling AI video — Ultra only (it's the priciest per-call operation).
export function canKling(tier: Tier): boolean {
  return tier === 'ultra';
}

// Meta/X platform ad export — Ultra only.
export function canMetaX(tier: Tier): boolean {
  return tier === 'ultra';
}

// Cumulative API-cost cap (USD) per user. 0 = unlimited. Env-overridable.
export function costCapForTier(tier: Tier): number {
  if (tier === 'free') return Number(process.env.TIER_FREE_CAP_USD ?? 0.5);
  if (tier === 'pro') return Number(process.env.TIER_PRO_CAP_USD ?? 10);
  return Number(process.env.TIER_ULTRA_CAP_USD ?? 0);
}
