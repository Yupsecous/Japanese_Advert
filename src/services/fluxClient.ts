// Single source of truth for fal.ai image-model calls. Routes by quality
// tier to different Flux endpoints. Higher tiers cost more but produce
// noticeably more photorealistic images — the difference between
// "obviously AI" and "could be a real product shot."

import { z } from 'zod';
import { AppError } from './errorMessages';
import type { ImageQualityTier } from '../types';

const FalImageZ = z.object({
  images: z.array(z.object({ url: z.string() })).min(1),
});

// Endpoint + inference-step config per tier. Schnell has a hard cap of 4
// steps (it's the distilled fast variant). Dev runs at 28 steps; Pro
// 1.1's quality is baked in at the model level.
type TierConfig = {
  url: string;
  bodyExtras: Record<string, unknown>;
};

const TIER_CONFIG: Record<ImageQualityTier, TierConfig> = {
  fast: {
    url: 'https://fal.run/fal-ai/flux/schnell',
    bodyExtras: { num_inference_steps: 4 },
  },
  balanced: {
    url: 'https://fal.run/fal-ai/flux/dev',
    bodyExtras: { num_inference_steps: 28, guidance_scale: 3.5 },
  },
  realistic: {
    url: 'https://fal.run/fal-ai/flux-pro/v1.1',
    bodyExtras: { safety_tolerance: '2', output_format: 'png' },
  },
};

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
  falKey: string;
  tier?: ImageQualityTier;
};

// One image request → one image URL on success. Throws AppError with a
// provider-specific code on failure (auth, credits, rate-limit, network).
export async function callFlux(args: CallFluxArgs): Promise<string> {
  const apiKey = args.falKey.trim();
  if (!apiKey) throw new AppError('fal/missing-key');

  const tier = args.tier ?? 'fast';
  const cfg = TIER_CONFIG[tier];

  let res: Response;
  try {
    res = await fetch(cfg.url, {
      method: 'POST',
      headers: {
        Authorization: `Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: args.prompt,
        image_size: { width: args.width, height: args.height },
        num_images: 1,
        enable_safety_checker: true,
        ...cfg.bodyExtras,
      }),
    });
  } catch (err) {
    throw new AppError('fal/network', err instanceof Error ? err.message : 'fetch failed');
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    if (res.status === 401) throw new AppError('fal/auth-failed', text.slice(0, 200));
    if (res.status === 402) throw new AppError('fal/no-credits', text.slice(0, 200));
    if (res.status === 403) throw new AppError('fal/forbidden', text.slice(0, 200));
    if (res.status === 429) throw new AppError('fal/rate-limit', text.slice(0, 200));
    throw new AppError('fal/bad-response', `status ${res.status}: ${text.slice(0, 200)}`);
  }

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    throw new AppError('fal/bad-response', 'response was not valid JSON');
  }
  const parsed = FalImageZ.safeParse(body);
  if (!parsed.success) {
    throw new AppError('fal/bad-response', `image schema mismatch: ${parsed.error.message}`);
  }
  return parsed.data.images[0]!.url;
}
