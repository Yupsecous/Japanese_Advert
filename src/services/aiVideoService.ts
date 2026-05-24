// AI video generation via fal.ai Kling v1.6 image-to-video. Takes one
// approved hero image and produces a short clip (~5s) with real camera
// motion + subtle subject movement — the kind of motion the Canvas
// slideshow can never produce.
//
// Architecture: fal.ai's video endpoints are asynchronous. We submit to
// the queue endpoint, poll status until "COMPLETED", then download the
// resulting MP4. Total wall-clock: ~60-90s per clip. Cost: ~$0.35 per
// 5-sec clip at the standard tier.
//
// This service is intentionally narrow — it produces a single PlatformVideo
// blob and lets the caller stitch it into the bundle. No audio overlay
// (Kling output is silent); if the campaign has voiceover, the slideshow
// path is still the right choice for that.

import { z } from 'zod';
import { AppError } from './errorMessages';
import type { PlatformVideo } from '../types';

const KLING_SUBMIT_URL = 'https://queue.fal.run/fal-ai/kling-video/v1.6/standard/image-to-video';

// Approximate cost — used for UI cost transparency on the toggle.
export const KLING_COST_USD_PER_CLIP = 0.35;
export const KLING_LATENCY_SECONDS = 75;

// Kling outputs 5s at 24fps in the standard tier. Aspect ratios it
// supports: 16:9, 9:16, 1:1. We map the same '9x16' / '1x1' tokens used
// by the slideshow path so the rest of the pipeline doesn't need to know.
const ASPECT_TO_KLING = {
  '9x16': '9:16',
  '1x1': '1:1',
} as const;

const ASPECT_TO_DIMS = {
  '9x16': { width: 720, height: 1280 },
  '1x1': { width: 720, height: 720 },
} as const;

export type AiVideoAspect = keyof typeof ASPECT_TO_KLING;

const SubmitResponseZ = z.object({
  request_id: z.string(),
  status_url: z.string().optional(),
  response_url: z.string().optional(),
});

const StatusResponseZ = z.object({
  status: z.string(),
  // queue position is informational only
  queue_position: z.number().optional(),
});

const ResultResponseZ = z.object({
  video: z.object({ url: z.string() }),
});

export type GenerateAiVideoArgs = {
  aspect: AiVideoAspect;
  imageUrl: string;
  prompt: string; // a short prose direction: "the subject leans forward, camera dollies in"
  falKey: string;
  signal?: AbortSignal;
};

function buildMotionPrompt(basePrompt: string): string {
  // Kling's image-to-video pipeline produces noticeably better motion when
  // the prompt explicitly directs the camera + subject. Take the user-
  // supplied prompt and append concrete motion cues if none are present.
  const looksLikeMotion = /(camera|dolly|pan|zoom|tilt|push|pull|orbit|tracking|hand-held|steadicam|move|drift)/i.test(
    basePrompt,
  );
  if (looksLikeMotion) return basePrompt;
  return `${basePrompt} Camera: slow push-in, subtle dolly forward. Subject: gentle, natural micro-movement — breathing, slight head turn, fabric motion. Cinematic, photographic motion.`;
}

async function submitJob(args: { aspect: AiVideoAspect; imageUrl: string; prompt: string; apiKey: string }): Promise<string> {
  let res: Response;
  try {
    res = await fetch(KLING_SUBMIT_URL, {
      method: 'POST',
      headers: {
        Authorization: `Key ${args.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: buildMotionPrompt(args.prompt),
        image_url: args.imageUrl,
        duration: '5',
        aspect_ratio: ASPECT_TO_KLING[args.aspect],
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
    throw new AppError('fal/bad-response', `kling submit ${res.status}: ${text.slice(0, 200)}`);
  }

  const body = (await res.json().catch(() => null)) as unknown;
  const parsed = SubmitResponseZ.safeParse(body);
  if (!parsed.success) {
    throw new AppError('fal/bad-response', `kling submit schema: ${parsed.error.message}`);
  }
  return parsed.data.request_id;
}

async function pollForResult(args: {
  requestId: string;
  apiKey: string;
  signal?: AbortSignal;
}): Promise<string> {
  // fal's response URL pattern is consistent: status & result both live
  // under /requests/<id>. Documentation: https://docs.fal.ai/queue/
  const base = `https://queue.fal.run/fal-ai/kling-video/requests/${args.requestId}`;
  const statusUrl = `${base}/status`;
  const resultUrl = base;

  // Poll for up to ~3 minutes. Kling typically returns in 60-90s.
  const maxAttempts = 90;
  const intervalMs = 2000;

  for (let i = 0; i < maxAttempts; i++) {
    if (args.signal?.aborted) throw new AppError('unknown', 'aborted');

    let statusRes: Response;
    try {
      statusRes = await fetch(statusUrl, {
        headers: { Authorization: `Key ${args.apiKey}` },
      });
    } catch (err) {
      throw new AppError('fal/network', err instanceof Error ? err.message : 'status fetch failed');
    }
    if (!statusRes.ok) {
      // 404 right after submit can happen briefly while the queue ingests
      // the request — tolerate the first couple of attempts.
      if (statusRes.status === 404 && i < 3) {
        await sleep(intervalMs);
        continue;
      }
      const text = await statusRes.text().catch(() => '');
      throw new AppError('fal/bad-response', `kling status ${statusRes.status}: ${text.slice(0, 200)}`);
    }
    const statusBody = (await statusRes.json().catch(() => null)) as unknown;
    const parsedStatus = StatusResponseZ.safeParse(statusBody);
    if (!parsedStatus.success) {
      throw new AppError('fal/bad-response', `kling status schema: ${parsedStatus.error.message}`);
    }

    const status = parsedStatus.data.status.toUpperCase();
    if (status === 'COMPLETED') {
      // Fetch the actual result payload.
      const resultRes = await fetch(resultUrl, {
        headers: { Authorization: `Key ${args.apiKey}` },
      });
      if (!resultRes.ok) {
        const text = await resultRes.text().catch(() => '');
        throw new AppError('fal/bad-response', `kling result ${resultRes.status}: ${text.slice(0, 200)}`);
      }
      const resultBody = (await resultRes.json().catch(() => null)) as unknown;
      const parsedResult = ResultResponseZ.safeParse(resultBody);
      if (!parsedResult.success) {
        throw new AppError('fal/bad-response', `kling result schema: ${parsedResult.error.message}`);
      }
      return parsedResult.data.video.url;
    }
    if (status === 'FAILED' || status === 'ERROR' || status === 'CANCELLED') {
      throw new AppError('fal/bad-response', `kling job ${status}`);
    }
    // IN_PROGRESS / IN_QUEUE — keep polling.
    await sleep(intervalMs);
  }
  throw new AppError('fal/bad-response', 'kling job timed out after 3 minutes');
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function generateAiVideo(args: GenerateAiVideoArgs): Promise<PlatformVideo> {
  const apiKey = args.falKey.trim();
  if (!apiKey) throw new AppError('fal/missing-key');

  const requestId = await submitJob({
    aspect: args.aspect,
    imageUrl: args.imageUrl,
    prompt: args.prompt,
    apiKey,
  });

  const videoUrl = await pollForResult({
    requestId,
    apiKey,
    ...(args.signal ? { signal: args.signal } : {}),
  });

  // Download the MP4 so the rest of the pipeline can treat it identically
  // to the slideshow Blob output (same PlatformVideo shape, same export
  // path, same preview component).
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
