// Browser-side video generation. Composes a slideshow MP4/WebM from a still
// hero image plus the approved voiceover audio. Output sized for Reels (9:16)
// and X Feed (1:1). No external provider — pure Canvas + MediaRecorder.
//
// The animation is a Ken Burns effect: slow zoom from 1.00x to 1.12x with a
// gentle pan, framed to keep the subject in view. Subtle vignette near the
// edges, no text overlay (keep the user's headline visible in the post copy,
// not burned into the video — better for translation, accessibility, and ad
// approval).
//
// Audio is the approved voiceover, mixed in via AudioContext. Recording runs
// in real-time (so a 20-second voiceover takes 20 seconds to encode). For a
// demo this is acceptable; production would offload to a worker.

import { AppError } from './errorMessages';
import type { PlatformVideo } from '../types';

const VIDEO_DIMENSIONS = {
  '9x16': { width: 1080, height: 1920 },
  '1x1': { width: 1080, height: 1080 },
} as const;

export type VideoAspect = keyof typeof VIDEO_DIMENSIONS;

export type GenerateVideoArgs = {
  aspect: VideoAspect;
  heroImageUrl: string;
  audioUrl: string;
  // Optional cap on duration — we record as long as the audio plays, capped
  // here. ElevenLabs reads are usually 18-30s; 30 is a safe ceiling.
  maxDurationSeconds?: number;
};

// Picks the best supported mimeType for MediaRecorder. Chrome supports MP4
// (H.264) in recent versions; Firefox is WebM-only. WebM is universally
// accepted by Meta and X for upload, so it's a safe default.
function pickMimeType(): string {
  const candidates = [
    'video/mp4; codecs=avc1.42E01E,mp4a.40.2', // Chrome 110+
    'video/webm; codecs=vp9,opus',
    'video/webm; codecs=vp8,opus',
    'video/webm',
  ];
  for (const t of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) return t;
  }
  return 'video/webm';
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new AppError('image/all-failed', `Failed to load hero image: ${url}`));
    img.src = url;
  });
}

function loadAudio(url: string): Promise<HTMLAudioElement> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audio.preload = 'auto';
    audio.src = url;
    const onReady = () => {
      audio.removeEventListener('canplaythrough', onReady);
      audio.removeEventListener('loadedmetadata', onMeta);
      resolve(audio);
    };
    const onMeta = () => {
      // `loadedmetadata` fires earlier than `canplaythrough`. Either is fine.
      audio.removeEventListener('canplaythrough', onReady);
      audio.removeEventListener('loadedmetadata', onMeta);
      resolve(audio);
    };
    audio.addEventListener('canplaythrough', onReady, { once: true });
    audio.addEventListener('loadedmetadata', onMeta, { once: true });
    audio.addEventListener(
      'error',
      () => reject(new AppError('eleven/bad-response', `Failed to load voiceover: ${url}`)),
      { once: true },
    );
  });
}

// Computes a centered source-rect from the hero image at the target aspect,
// so we always crop-fit without stretching. Returns the rectangle in image
// pixels to draw from.
function computeSourceCrop(
  imgW: number,
  imgH: number,
  targetW: number,
  targetH: number,
): { sx: number; sy: number; sw: number; sh: number } {
  const imgAspect = imgW / imgH;
  const tgtAspect = targetW / targetH;
  if (imgAspect > tgtAspect) {
    // image is wider — crop horizontally
    const sh = imgH;
    const sw = Math.round(imgH * tgtAspect);
    const sx = Math.round((imgW - sw) / 2);
    return { sx, sy: 0, sw, sh };
  }
  // image is taller — crop vertically
  const sw = imgW;
  const sh = Math.round(imgW / tgtAspect);
  const sy = Math.round((imgH - sh) / 2);
  return { sx: 0, sy, sw, sh };
}

export async function generateSlideshowVideo(args: GenerateVideoArgs): Promise<PlatformVideo> {
  if (typeof MediaRecorder === 'undefined') {
    throw new AppError(
      'unknown',
      'MediaRecorder is not available in this browser. Video generation requires Chrome, Edge, or Firefox 90+.',
    );
  }

  const dims = VIDEO_DIMENSIONS[args.aspect];
  const maxDuration = args.maxDurationSeconds ?? 30;

  const [img, audio] = await Promise.all([
    loadImage(args.heroImageUrl),
    loadAudio(args.audioUrl),
  ]);

  // If we still don't know the duration after metadata, fall back to maxDuration.
  const audioDuration = isFinite(audio.duration) && audio.duration > 0 ? audio.duration : maxDuration;
  const duration = Math.min(audioDuration, maxDuration);

  const canvas = document.createElement('canvas');
  canvas.width = dims.width;
  canvas.height = dims.height;
  const rawCtx = canvas.getContext('2d');
  if (!rawCtx) throw new AppError('unknown', '2D canvas context unavailable.');
  // Capture as a non-null local so TS narrows it across the closure used in
  // the animation loop below.
  const ctx: CanvasRenderingContext2D = rawCtx;

  // Compute a base source crop that fits the target aspect from the hero.
  // The Ken Burns animation will zoom into a smaller sub-rect of this base.
  const baseCrop = computeSourceCrop(img.naturalWidth, img.naturalHeight, dims.width, dims.height);

  // Animation parameters. Pan from a slight upper-left offset to a slight
  // lower-right one as we zoom from 1.00x to 1.12x. Subtle — the goal is
  // life, not motion sickness.
  const startZoom = 1.0;
  const endZoom = 1.12;
  const startPanX = -0.02; // fraction of crop width
  const endPanX = 0.02;
  const startPanY = -0.015;
  const endPanY = 0.025;

  const fps = 30;
  const frameMs = 1000 / fps;

  // Build the combined MediaStream: video from the canvas, audio from the
  // approved voiceover. We route the audio through an AudioContext so the
  // recorder can capture it while it also plays through speakers (so the
  // user gets immediate feedback).
  const videoStream = canvas.captureStream(fps);
  const audioCtx = new AudioContext();
  const source = audioCtx.createMediaElementSource(audio);
  const dest = audioCtx.createMediaStreamDestination();
  source.connect(dest);
  source.connect(audioCtx.destination); // also audible during recording

  const combined = new MediaStream([
    ...videoStream.getVideoTracks(),
    ...dest.stream.getAudioTracks(),
  ]);

  const mimeType = pickMimeType();
  const recorder = new MediaRecorder(combined, { mimeType, videoBitsPerSecond: 5_000_000 });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  return new Promise<PlatformVideo>((resolve, reject) => {
    let rafId = 0;
    let startedAt = 0;
    let cleanedUp = false;

    function cleanup() {
      if (cleanedUp) return;
      cleanedUp = true;
      cancelAnimationFrame(rafId);
      try { source.disconnect(); } catch { /* noop */ }
      try { dest.disconnect(); } catch { /* noop */ }
      try { audio.pause(); audio.currentTime = 0; } catch { /* noop */ }
      try { audioCtx.close(); } catch { /* noop */ }
      try {
        for (const t of videoStream.getTracks()) t.stop();
      } catch { /* noop */ }
    }

    recorder.onerror = (e) => {
      cleanup();
      reject(new AppError('unknown', `Video recording failed: ${String(e)}`));
    };

    recorder.onstop = () => {
      cleanup();
      const blob = new Blob(chunks, { type: mimeType });
      resolve({
        aspect: args.aspect,
        blob,
        durationSeconds: duration,
        mimeType,
        width: dims.width,
        height: dims.height,
      });
    };

    function tick(now: number) {
      if (!startedAt) startedAt = now;
      const elapsedMs = now - startedAt;
      const t = Math.min(1, elapsedMs / (duration * 1000));

      // Interpolate zoom + pan
      const zoom = startZoom + (endZoom - startZoom) * t;
      const panX = startPanX + (endPanX - startPanX) * t;
      const panY = startPanY + (endPanY - startPanY) * t;

      // Compute the zoomed source rect inside baseCrop
      const zw = baseCrop.sw / zoom;
      const zh = baseCrop.sh / zoom;
      const cx = baseCrop.sx + baseCrop.sw / 2 + panX * baseCrop.sw;
      const cy = baseCrop.sy + baseCrop.sh / 2 + panY * baseCrop.sh;
      const sx = cx - zw / 2;
      const sy = cy - zh / 2;

      // Draw — single-pass, no extra effects (keep encoding cheap).
      ctx.drawImage(img, sx, sy, zw, zh, 0, 0, dims.width, dims.height);

      // Subtle vignette: a radial gradient darkening the edges.
      const grad = ctx.createRadialGradient(
        dims.width / 2,
        dims.height / 2,
        Math.min(dims.width, dims.height) * 0.4,
        dims.width / 2,
        dims.height / 2,
        Math.max(dims.width, dims.height) * 0.7,
      );
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, 'rgba(0,0,0,0.25)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, dims.width, dims.height);

      if (t >= 1) {
        // Animation done — stop the recorder (will fire onstop).
        try {
          recorder.stop();
        } catch {
          /* already stopped */
        }
        return;
      }
      rafId = requestAnimationFrame(tick);
    }

    // Hard timeout — protect against recorder hanging if audio ended event
    // never fired (some browsers/preset paths). 5s padding above duration.
    const timeoutMs = (duration + 5) * 1000;
    const timeout = setTimeout(() => {
      try {
        recorder.stop();
      } catch {
        /* noop */
      }
    }, timeoutMs);
    const clearOnStop = () => clearTimeout(timeout);
    recorder.addEventListener('stop', clearOnStop, { once: true });

    // Sequence: kick off recording → start audio → start animation. We rely
    // on the timeline-driven Ken Burns animation (not audio.ended) to stop
    // the recorder, because audio.ended can race the last few frames.
    recorder.start(frameMs * 5); // request chunks every ~5 frames
    audio.currentTime = 0;
    void audio
      .play()
      .then(() => {
        rafId = requestAnimationFrame(tick);
      })
      .catch((err) => {
        cleanup();
        try { recorder.stop(); } catch { /* noop */ }
        reject(new AppError('unknown', `Audio playback failed: ${err instanceof Error ? err.message : String(err)}`));
      });
  });
}
