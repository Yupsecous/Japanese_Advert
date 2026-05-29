// AI video generation via fal.ai Kling v1.6 image-to-video, routed through
// the backend (/api/fal/kling-submit + /api/fal/kling-poll) which holds the
// server API key. Submit returns a request_id; we poll until COMPLETED, then
// download the resulting MP4 so the rest of the pipeline treats it like the
// slideshow Blob output. `falKey` is retained in args for compatibility but
// is ignored.

import { z } from 'zod';
import { AppError } from './errorMessages';
import { backendPost } from './backendClient';
import type { PlatformVideo } from '../types';

// Approximate cost — used for UI cost transparency on the toggle.
export const KLING_COST_USD_PER_CLIP = 0.35;
export const KLING_LATENCY_SECONDS = 75;

const ASPECT_TO_DIMS = {
  '9x16': { width: 720, height: 1280 },
  '1x1': { width: 720, height: 720 },
} as const;

export type AiVideoAspect = keyof typeof ASPECT_TO_DIMS;

const SubmitResponseZ = z.object({ request_id: z.string() });
const PollResponseZ = z.object({
  status: z.string(),
  video: z.object({ url: z.string() }).optional(),
  detail: z.string().optional(),
});

export type GenerateAiVideoArgs = {
  aspect: AiVideoAspect;
  imageUrl: string;
  prompt: string;
  falKey?: string;
  signal?: AbortSignal;
};

function buildMotionPrompt(basePrompt: string): string {
  const looksLikeMotion = /(camera|dolly|pan|zoom|tilt|push|pull|orbit|tracking|hand-held|steadicam|move|drift)/i.test(
    basePrompt,
  );
  if (looksLikeMotion) return basePrompt;
  return `${basePrompt} Camera: slow push-in, subtle dolly forward. Subject: gentle, natural micro-movement — breathing, slight head turn, fabric motion. Cinematic, photographic motion.`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function generateAiVideo(args: GenerateAiVideoArgs): Promise<PlatformVideo> {
  const submit = await backendPost<unknown>(
    '/api/fal/kling-submit',
    { prompt: buildMotionPrompt(args.prompt), imageUrl: args.imageUrl, aspect: args.aspect },
    'fal',
  );
  const parsedSubmit = SubmitResponseZ.safeParse(submit);
  if (!parsedSubmit.success) {
    throw new AppError('fal/bad-response', `kling submit schema: ${parsedSubmit.error.message}`);
  }
  const requestId = parsedSubmit.data.request_id;

  // Poll for up to ~3 minutes. Kling typically returns in 60-90s.
  const maxAttempts = 90;
  const intervalMs = 2000;
  let videoUrl = '';
  for (let i = 0; i < maxAttempts; i++) {
    if (args.signal?.aborted) throw new AppError('unknown', 'aborted');
    const pollRaw = await backendPost<unknown>('/api/fal/kling-poll', { requestId }, 'fal');
    const parsed = PollResponseZ.safeParse(pollRaw);
    if (!parsed.success) {
      throw new AppError('fal/bad-response', `kling poll schema: ${parsed.error.message}`);
    }
    const status = parsed.data.status.toUpperCase();
    if (status === 'COMPLETED') {
      if (!parsed.data.video?.url) {
        throw new AppError('fal/bad-response', 'kling completed without a video url');
      }
      videoUrl = parsed.data.video.url;
      break;
    }
    if (status === 'FAILED' || status === 'ERROR' || status === 'CANCELLED') {
      throw new AppError('fal/bad-response', `kling job ${parsed.data.detail ?? status}`);
    }
    await sleep(intervalMs);
  }
  if (!videoUrl) {
    throw new AppError('fal/bad-response', 'kling job timed out after 3 minutes');
  }

  // Download the MP4 (fal.media CDN) so the bundle treats it like slideshow output.
  let dlRes: Response;
  try {
    dlRes = await fetch(videoUrl);
  } catch (err) {
    throw new AppError('fal/network', err instanceof Error ? err.message : 'video download failed');
  }
  if (!dlRes.ok) {
    throw new AppError('fal/bad-response', `kling video download ${dlRes.status}`);
  }
  const blob = await dlRes.blob();
  const dims = ASPECT_TO_DIMS[args.aspect];

  return {
    aspect: args.aspect,
    blob,
    durationSeconds: 5,
    mimeType: blob.type || 'video/mp4',
    width: dims.width,
    height: dims.height,
    provider: 'ai_kling',
  };
}
