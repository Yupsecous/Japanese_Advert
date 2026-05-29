// fal.ai Flux image generation. Routes through the backend proxy
// (/api/fal/flux), which selects the right endpoint per tier and holds the
// server API key. `falKey` is retained in the args type for call-site
// compatibility but is ignored.

import { z } from 'zod';
import { AppError } from './errorMessages';
import type { ImageQualityTier } from '../types';
import { backendPost } from './backendClient';

const FalImageZ = z.object({
  images: z.array(z.object({ url: z.string() })).min(1),
});

// Approximate cost per image, used for UI cost transparency.
export const TIER_COST_USD: Record<ImageQualityTier, number> = {
  fast: 0.003,
  balanced: 0.025,
  realistic: 0.04,
};

// Approximate wall-clock per call, for UI honesty about why a tier
// generates slower.
export const TIER_LATENCY_SECONDS: Record<ImageQualityTier, number> = {
  fast: 3,
  balanced: 12,
  realistic: 20,
};

export type CallFluxArgs = {
  prompt: string;
  width: number;
  height: number;
  falKey?: string;
  tier?: ImageQualityTier;
};

// One image request → one image URL on success. Throws AppError (fal-scoped)
// on failure; the backend maps provider/cost/auth errors.
export async function callFlux(args: CallFluxArgs): Promise<string> {
  const tier = args.tier ?? 'fast';
  const body = await backendPost<unknown>(
    '/api/fal/flux',
    { prompt: args.prompt, width: args.width, height: args.height, tier },
    'fal',
  );
  const parsed = FalImageZ.safeParse(body);
  if (!parsed.success) {
    throw new AppError('fal/bad-response', `image schema mismatch: ${parsed.error.message}`);
  }
  return parsed.data.images[0]!.url;
}
