// Subscription tier policy for the web UI. Mirrors packages/backend/lib/tiers.ts.
// The backend enforces the costly/abusable parts (cost cap, image clamp, Kling
// gate); this drives which steps/features the UI shows per tier.

import { STEP_ORDER, type StepId, type ImageQualityTier } from './types';

export type Tier = 'free' | 'pro' | 'ultra';

export const TIER_LABELS: Record<Tier, string> = { free: 'Free', pro: 'Pro', ultra: 'Ultra' };

export function isTier(v: unknown): v is Tier {
  return v === 'free' || v === 'pro' || v === 'ultra';
}

// Free: Copy → Image → Script → Audio (steps 2–5). Pro/Ultra: all six.
const FREE_STEPS: StepId[] = ['copy', 'image', 'script', 'audio'];

export function tierStepOrder(tier: Tier): StepId[] {
  if (tier === 'free') return STEP_ORDER.filter((id) => FREE_STEPS.includes(id));
  return [...STEP_ORDER];
}

export function allowedImageTiers(tier: Tier): ImageQualityTier[] {
  if (tier === 'free') return ['fast'];
  if (tier === 'pro') return ['fast', 'balanced'];
  return ['fast', 'balanced', 'realistic'];
}

// Kling AI video and Meta/X ad export are Ultra-only.
export function canKling(tier: Tier): boolean {
  return tier === 'ultra';
}
export function canMetaX(tier: Tier): boolean {
  return tier === 'ultra';
}

// The minimum tier that unlocks a given step, for "upgrade to X" prompts.
export function tierForStep(id: StepId): Tier {
  if (id === 'audience' || id === 'design') return 'pro';
  return 'free';
}
