// Orchestrates image variant generation:
//   1. Optionally translate the director's plain-English direction into
//      structured Flux mods (only when a direction is provided).
//   2. Ask the prompt builder to weave brief + copy + mods into a Flux
//      prompt with photoreal cues baked in.
//   3. Call the tier-aware Flux endpoint via the backend proxy.
//
// All three calls flow through the @advert/backend proxy â€” keys live on
// the server, never on the device.

import type {
  Brief,
  CopyVariant,
  ImagePromptMods,
  ImageQualityTier,
  ImageVariant,
} from '../shared';
import { fluxGenerate, BackendError } from './backend';
import { buildImagePrompt } from './imagePromptBuilder';
import { translateImageDirection } from './imageTranslator';

export type GenerateImagesArgs = {
  brief: Brief;
  approvedCopy: CopyVariant;
  count?: number;
  refineDirection?: string;
  tier: ImageQualityTier;
};

function newId(): string {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

async function generateOne(args: {
  brief: Brief;
  approvedCopy: CopyVariant;
  mods?: ImagePromptMods;
  tier: ImageQualityTier;
}): Promise<ImageVariant> {
  const prompt = await buildImagePrompt({
    brief: args.brief,
    approvedCopy: args.approvedCopy,
    ...(args.mods ? { mods: args.mods } : {}),
  });
  const flux = await fluxGenerate({
    prompt,
    width: 768,
    height: 960,
    tier: args.tier,
  });
  const imageUrl = flux.images[0]?.url;
  if (!imageUrl) throw new BackendError(502, 'upstream/error', 'flux returned no images');
  const variant: ImageVariant = {
    kind: 'image',
    id: newId(),
    imageUrl,
    prompt,
    createdAt: Date.now(),
  };
  if (args.mods) variant.modsApplied = args.mods;
  return variant;
}

export async function generateImages(args: GenerateImagesArgs): Promise<ImageVariant[]> {
  const count = args.count ?? 2;
  let mods: ImagePromptMods | undefined;
  if (args.refineDirection && args.refineDirection.trim().length > 0) {
    mods = await translateImageDirection(args.refineDirection);
  }

  // Two-at-a-time generation. Parallel for speed; partial failures
  // collapse to the first AppError if all fail with the same code, else
  // surface as a summary.
  const tasks = Array.from({ length: count }).map(() =>
    generateOne({
      brief: args.brief,
      approvedCopy: args.approvedCopy,
      ...(mods ? { mods } : {}),
      tier: args.tier,
    }),
  );
  const settled = await Promise.allSettled(tasks);
  const successes: ImageVariant[] = [];
  const failures: unknown[] = [];
  for (const r of settled) {
    if (r.status === 'fulfilled') successes.push(r.value);
    else failures.push(r.reason);
  }
  if (successes.length === 0) {
    if (failures[0] instanceof BackendError) throw failures[0];
    const summary = failures
      .map((f) => (f instanceof Error ? f.message : String(f)))
      .join(' | ');
    throw new BackendError(502, 'upstream/error', summary || 'all image generations failed');
  }
  return successes;
}
