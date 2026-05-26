// Centralized cost + latency constants for the image and video tiers.
// Single source of truth so backend rate-limiting + android UI + web UI
// all agree on what each call costs.

import type { ImageQualityTier } from './types';

export const TIER_COST_USD: Record<ImageQualityTier, number> = {
  fast: 0.003,
  balanced: 0.025,
  realistic: 0.04,
};

export const TIER_LATENCY_SECONDS: Record<ImageQualityTier, number> = {
  fast: 3,
  balanced: 12,
  realistic: 20,
};

export const TIER_FAL_URL: Record<ImageQualityTier, string> = {
  fast: 'https://fal.run/fal-ai/flux/schnell',
  balanced: 'https://fal.run/fal-ai/flux/dev',
  realistic: 'https://fal.run/fal-ai/flux-pro/v1.1',
};

export const TIER_EXTRAS: Record<ImageQualityTier, Record<string, unknown>> = {
  fast: { num_inference_steps: 4 },
  balanced: { num_inference_steps: 28, guidance_scale: 3.5 },
  realistic: { safety_tolerance: '2', output_format: 'png' },
};

export const KLING_COST_USD_PER_CLIP = 0.35;
export const KLING_LATENCY_SECONDS = 75;
export const KLING_SUBMIT_URL =
  'https://queue.fal.run/fal-ai/kling-video/v1.6/standard/image-to-video';

export function formatCostUsd(usd: number): string {
  if (usd < 0.01) return '<$0.01';
  return `$${usd.toFixed(2)}`;
}
