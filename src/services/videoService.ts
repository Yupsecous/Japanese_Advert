// Browser-side video generation. Composes a slideshow MP4/WebM from one or
// more hero images plus the approved voiceover audio.
//
// What this generates (per call):
//   - up to 5 shots cycled through over the duration of the voiceover
//   - per-shot Ken Burns motion drawn from a 5-curve rotation so adjacent
//     shots feel distinct (zoom-in, zoom-out, lateral pan, vertical pan,
//     diagonal pan-zoom)
//   - 0.6s crossfades between adjacent shots
//   - headline text overlay fading in/out across the first half
//   - CTA overlay in a brand-colored bar across the bottom for the last
//     ~4 seconds
//   - optional brand-name watermark in the top-left, persistent
//   - radial vignette held throughout
//   - audio-reactive amplitude dot at the bottom-left, scaled by RMS
//   - voiceover audio routed through AudioContext, captured into the
//     output stream while also playing locally for UX feedback
//
// Output: WebM (universally accepted by Meta/X) or MP4 in Chrome 110+.
// Encoding runs in real-time — a 20-second voiceover takes ~20s.

import { AppError } from './errorMessages';
import type { AudioAlignment, PlatformVideo } from '../types';

const VIDEO_DIMENSIONS = {
  '9x16': { width: 1080, height: 1920 },
  '1x1': { width: 1080, height: 1080 },
} as const;

export type VideoAspect = keyof typeof VIDEO_DIMENSIONS;

export type GenerateVideoArgs = {
  aspect: VideoAspect;
  imageUrls: string[]; // 1+ images; up to 5 used as shots
  audioUrl: string;
  headline: string;
  cta: string;
  brandName?: string;
  // Brand-accent color for the CTA bar. Defaults to navy if not provided.
  ctaBarColor?: string;
  maxDurationSeconds?: number;
  // The script text (used for word-level captions). Optional — if omitted,
  // no caption layer is drawn.
  scriptText?: string;
  // Character-level alignment from ElevenLabs. When present, captions are
  // word-perfect synced to the audio. When absent, we estimate timing from
  // scriptText and duration.
  alignment?: AudioAlignment;
};

const MAX_SHOTS = 5;
const CROSSFADE_SECONDS = 0.6;
const HEADLINE_FADE_IN = 0.4;
const HEADLINE_FADE_OUT = 0.5;
const CTA_FADE_IN = 0.5;
const CTA_TAIL_SECONDS = 4.5;

// ---------------------------------------------------------------------------
// MIME-type detection
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Media loading
// ---------------------------------------------------------------------------

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () =>
      reject(new AppError('image/all-failed', `Failed to load image: ${url.slice(0, 120)}`));
    img.src = url;
  });
}

function loadAudio(url: string): Promise<HTMLAudioElement> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audio.preload = 'auto';
    audio.src = url;
    const onReady = () => resolve(audio);
    audio.addEventListener('canplaythrough', onReady, { once: true });
    audio.addEventListener('loadedmetadata', onReady, { once: true });
    audio.addEventListener(
      'error',
      () => reject(new AppError('eleven/bad-response', 'Failed to load voiceover')),
      { once: true },
    );
  });
}

// ---------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------

function computeSourceCrop(imgW: number, imgH: number, targetW: number, targetH: number) {
  const imgAspect = imgW / imgH;
  const tgtAspect = targetW / targetH;
  if (imgAspect > tgtAspect) {
    const sh = imgH;
    const sw = Math.round(imgH * tgtAspect);
    const sx = Math.round((imgW - sw) / 2);
    return { sx, sy: 0, sw, sh };
  }
  const sw = imgW;
  const sh = Math.round(imgW / tgtAspect);
  const sy = Math.round((imgH - sh) / 2);
  return { sx: 0, sy, sw, sh };
}

// ---------------------------------------------------------------------------
// Per-shot Ken Burns motion curves
// ---------------------------------------------------------------------------

type ShotCurve = {
  zoomStart: number;
  zoomEnd: number;
  panStartX: number;
  panStartY: number;
  panEndX: number;
  panEndY: number;
};

const SHOT_CURVES: ShotCurve[] = [
  // Zoom in, slight diagonal pan
  { zoomStart: 1.00, zoomEnd: 1.16, panStartX: -0.02, panStartY: -0.015, panEndX: 0.02, panEndY: 0.025 },
  // Zoom out from a corner — feels like a reveal
  { zoomStart: 1.22, zoomEnd: 1.02, panStartX: 0.03, panStartY: 0.025, panEndX: -0.02, panEndY: -0.02 },
  // Pure lateral pan with slight zoom
  { zoomStart: 1.06, zoomEnd: 1.18, panStartX: -0.04, panStartY: 0.0, panEndX: 0.04, panEndY: 0.0 },
  // Vertical pan with steady zoom
  { zoomStart: 1.10, zoomEnd: 1.10, panStartX: 0.0, panStartY: -0.04, panEndX: 0.0, panEndY: 0.04 },
  // Counter-diagonal — the inverse of curve 0 for variety after the cycle
  { zoomStart: 1.08, zoomEnd: 1.22, panStartX: 0.025, panStartY: -0.025, panEndX: -0.025, panEndY: 0.025 },
];

function shotCurve(index: number): ShotCurve {
  return SHOT_CURVES[index % SHOT_CURVES.length]!;
}

// ---------------------------------------------------------------------------
// Shot timing
// ---------------------------------------------------------------------------

type ShotPlan = {
  index: number;
  imageUrl: string;
  startSec: number;
  endSec: number;
  curve: ShotCurve;
};

function planShots(imageUrls: string[], duration: number): ShotPlan[] {
  const n = Math.max(1, Math.min(MAX_SHOTS, imageUrls.length));
  const chosen = imageUrls.slice(0, n);
  if (n === 1) {
    return [
      {
        index: 0,
        imageUrl: chosen[0]!,
        startSec: 0,
        endSec: duration,
        curve: shotCurve(0),
      },
    ];
  }
  // Each shot gets duration/n airtime, with crossfade overlap into the next.
  const slice = duration / n;
  const halfFade = CROSSFADE_SECONDS / 2;
  return chosen.map((url, i) => ({
    index: i,
    imageUrl: url,
    // First shot starts at 0; subsequent shots start half a crossfade early
    // so they overlap with the outgoing shot for a smooth dissolve.
    startSec: i === 0 ? 0 : i * slice - halfFade,
    endSec: i === n - 1 ? duration : (i + 1) * slice + halfFade,
    curve: shotCurve(i),
  }));
}

function shotAlpha(plan: ShotPlan, t: number): number {
  if (t < plan.startSec || t > plan.endSec) return 0;
  // Fade in window: the first crossfade region of this shot. For the first
  // shot, start fully visible; otherwise fade in over CROSSFADE_SECONDS.
  if (plan.index > 0 && t < plan.startSec + CROSSFADE_SECONDS) {
    return (t - plan.startSec) / CROSSFADE_SECONDS;
  }
  // Fade out window: the last crossfade region. Last shot stays at full
  // until its endSec — no fade out at the absolute end of the video.
  if (t > plan.endSec - CROSSFADE_SECONDS) {
    const isLast = plan.endSec >= shotsEndApprox(plan);
    if (!isLast) {
      return Math.max(0, (plan.endSec - t) / CROSSFADE_SECONDS);
    }
  }
  return 1;
}

// Sentinel to mark the "end of last shot" position. Set externally.
let shotsEndApprox = (_: ShotPlan): number => Infinity;

// ---------------------------------------------------------------------------
// Text rendering
// ---------------------------------------------------------------------------

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  const words = trimmed.split(/\s+/);
  // Char-wrap path for languages without spaces (Japanese, Chinese) when a
  // single token wouldn't fit on a line.
  if (words.length === 1 && ctx.measureText(trimmed).width > maxWidth) {
    const lines: string[] = [];
    let current = '';
    for (const c of trimmed) {
      if (ctx.measureText(current + c).width > maxWidth) {
        if (current) lines.push(current);
        current = c;
      } else {
        current += c;
      }
    }
    if (current) lines.push(current);
    return lines;
  }
  const lines: string[] = [];
  let current = '';
  for (const w of words) {
    const test = current ? current + ' ' + w : w;
    if (ctx.measureText(test).width > maxWidth) {
      if (current) lines.push(current);
      current = w;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function drawHeadlineOverlay(
  ctx: CanvasRenderingContext2D,
  text: string,
  alpha: number,
  width: number,
  height: number,
  is916: boolean,
): void {
  if (alpha <= 0.001 || !text.trim()) return;

  const padding = is916 ? 80 : 60;
  const maxWidth = width - padding * 2;
  const fontSize = is916 ? 76 : 64;
  const lineHeight = fontSize * 1.15;

  ctx.font = `700 ${fontSize}px "Helvetica Neue", "Hiragino Sans", "Yu Gothic", "Noto Sans JP", system-ui, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  const lines = wrapText(ctx, text, maxWidth).slice(0, 4); // cap at 4 lines
  if (lines.length === 0) return;

  const blockHeight = lines.length * lineHeight;
  // Vertically positioned in the upper-middle (around 35% of the frame) so
  // the headline doesn't fight the CTA bar at the bottom.
  const blockTop = is916 ? Math.round(height * 0.32) : Math.round(height * 0.36);
  const gradientTop = blockTop - 60;
  const gradientBottom = blockTop + blockHeight + 60;

  ctx.save();
  ctx.globalAlpha = alpha;

  // Translucent gradient backing so text stays legible over any image.
  const grad = ctx.createLinearGradient(0, gradientTop, 0, gradientBottom);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(0.25, 'rgba(0,0,0,0.45)');
  grad.addColorStop(0.75, 'rgba(0,0,0,0.45)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, gradientTop, width, gradientBottom - gradientTop);

  // Text itself with subtle drop shadow.
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 2;
  ctx.fillStyle = '#ffffff';

  let y = blockTop + fontSize;
  for (const line of lines) {
    ctx.fillText(line, padding, y);
    y += lineHeight;
  }

  ctx.restore();
}

function drawCtaBar(
  ctx: CanvasRenderingContext2D,
  text: string,
  alpha: number,
  width: number,
  height: number,
  ctaBarColor: string,
  is916: boolean,
): void {
  if (alpha <= 0.001 || !text.trim()) return;

  const barHeight = is916 ? 160 : 130;
  const fontSize = is916 ? 44 : 38;
  const barTop = height - barHeight;

  ctx.save();
  ctx.globalAlpha = alpha;

  // Solid brand-colored bar across the bottom edge.
  ctx.fillStyle = ctaBarColor;
  ctx.fillRect(0, barTop, width, barHeight);

  // Inset subtle highlight at the top of the bar.
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fillRect(0, barTop, width, 1);

  // CTA text + arrow, centered.
  ctx.font = `600 ${fontSize}px "Helvetica Neue", "Hiragino Sans", "Yu Gothic", "Noto Sans JP", system-ui, sans-serif`;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const arrow = '  →';
  const display = text.trim() + arrow;
  const measured = ctx.measureText(display);
  const maxLineWidth = width - 80;
  if (measured.width > maxLineWidth) {
    // Drop the arrow if the line gets too long.
    ctx.fillText(text.trim(), width / 2, barTop + barHeight / 2);
  } else {
    ctx.fillText(display, width / 2, barTop + barHeight / 2);
  }

  ctx.restore();
}

function drawBrandWatermark(
  ctx: CanvasRenderingContext2D,
  name: string | undefined,
  width: number,
  _height: number,
  is916: boolean,
): void {
  if (!name || !name.trim()) return;

  const text = name.trim().toUpperCase();
  const fontSize = is916 ? 22 : 20;
  const padding = is916 ? 56 : 40;

  ctx.save();
  ctx.font = `600 ${fontSize}px "Helvetica Neue", system-ui, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  // Pill background.
  const m = ctx.measureText(text);
  const pillW = m.width + 24;
  const pillH = fontSize + 14;
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath();
  // Older browsers don't have roundRect on all paths; fall back to rect.
  if (typeof (ctx as unknown as { roundRect?: unknown }).roundRect === 'function') {
    (ctx as unknown as { roundRect: (x: number, y: number, w: number, h: number, r: number) => void }).roundRect(
      padding,
      padding,
      pillW,
      pillH,
      pillH / 2,
    );
    ctx.fill();
  } else {
    ctx.fillRect(padding, padding, pillW, pillH);
  }

  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.fillText(text, padding + 12, padding + 7);
  // Suppress unused-var warning while keeping the width param for symmetry.
  void width;
  ctx.restore();
}

function drawAudioPulse(
  ctx: CanvasRenderingContext2D,
  rms: number,
  width: number,
  height: number,
  is916: boolean,
): void {
  // Bottom-left circle that scales with audio amplitude — small but proves
  // the voiceover is alive throughout the video.
  const baseRadius = is916 ? 7 : 6;
  const peakRadius = is916 ? 22 : 18;
  const x = is916 ? 60 : 44;
  // Sit above the CTA bar — at ~85% of the frame height for 9:16, slightly
  // higher for 1:1.
  const y = is916 ? height * 0.82 : height * 0.78;
  const r = baseRadius + rms * (peakRadius - baseRadius);

  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x, y, baseRadius, 0, Math.PI * 2);
  ctx.fill();
  void width;
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Captions — word-level windows from char-level alignment (or estimated)
// ---------------------------------------------------------------------------

type WordWindow = {
  text: string;
  startSec: number;
  endSec: number;
};

// Groups characters from ElevenLabs alignment into words by whitespace
// boundaries. Punctuation stays attached to the preceding word.
function wordsFromAlignment(alignment: AudioAlignment): WordWindow[] {
  const out: WordWindow[] = [];
  let current = '';
  let currentStart: number | null = null;
  let currentEnd: number | null = null;

  function flush() {
    if (current && currentStart !== null && currentEnd !== null) {
      out.push({ text: current, startSec: currentStart, endSec: currentEnd });
    }
    current = '';
    currentStart = null;
    currentEnd = null;
  }

  for (let i = 0; i < alignment.characters.length; i++) {
    const ch = alignment.characters[i]!;
    const s = alignment.charStartSec[i]!;
    const e = alignment.charEndSec[i]!;
    if (/\s/.test(ch)) {
      flush();
      continue;
    }
    if (currentStart === null) currentStart = s;
    currentEnd = e;
    current += ch;
  }
  flush();
  return out;
}

// Fallback when alignment data is unavailable (sample preset, legacy audio).
// Distributes words evenly across the duration. Coarse but usable.
function estimateWordWindows(scriptText: string, duration: number): WordWindow[] {
  const tokens = scriptText.split(/\s+/).filter((w) => w.length > 0);
  if (tokens.length === 0 || duration <= 0) return [];
  // Assume a small head-padding (the model usually has 80-200ms before the
  // first phoneme) and equal slice afterward.
  const headPadding = Math.min(0.15, duration * 0.02);
  const speakable = duration - headPadding;
  const slice = speakable / tokens.length;
  return tokens.map((text, i) => ({
    text,
    startSec: headPadding + i * slice,
    endSec: headPadding + (i + 1) * slice,
  }));
}

// Picks the words to display at time t. Strategy: show the currently
// spoken word + up to 2 preceding words for visual context. Returns null
// when nothing should be on screen.
function pickActivePhrase(words: WordWindow[], t: number): {
  prev: string;
  current: string;
  fadeAlpha: number;
} | null {
  // Find current word: where t is in [start, end].
  let activeIdx = -1;
  for (let i = 0; i < words.length; i++) {
    if (t >= words[i]!.startSec && t <= words[i]!.endSec) {
      activeIdx = i;
      break;
    }
  }
  // If we missed it (t past a word's end but before next start — typical
  // inter-word gap), find the most recent word that ended <0.18s ago.
  if (activeIdx === -1) {
    for (let i = words.length - 1; i >= 0; i--) {
      if (words[i]!.endSec <= t && t - words[i]!.endSec < 0.18) {
        activeIdx = i;
        break;
      }
    }
  }
  if (activeIdx === -1) return null;

  const w = words[activeIdx]!;
  const wDuration = w.endSec - w.startSec;
  const fadeIn = Math.min(0.08, wDuration * 0.3);
  const fadeOut = 0.12;
  let fadeAlpha = 1;
  if (t < w.startSec + fadeIn) fadeAlpha = (t - w.startSec) / fadeIn;
  else if (t > w.endSec) fadeAlpha = Math.max(0, 1 - (t - w.endSec) / fadeOut);

  // Up to 2 prior words for the context line.
  const prevWords: string[] = [];
  for (let i = Math.max(0, activeIdx - 2); i < activeIdx; i++) {
    prevWords.push(words[i]!.text);
  }
  return {
    prev: prevWords.join(' '),
    current: w.text,
    fadeAlpha,
  };
}

function drawCaptionLayer(
  ctx: CanvasRenderingContext2D,
  active: { prev: string; current: string; fadeAlpha: number } | null,
  width: number,
  height: number,
  ctaBarVisible: boolean,
  is916: boolean,
): void {
  if (!active) return;

  // Layout: position varies by aspect, and lifts when the CTA bar is
  // visible so they don't collide.
  const ctaBarHeight = is916 ? 160 : 130;
  const baseY = ctaBarVisible
    ? height - ctaBarHeight - (is916 ? 80 : 60)
    : height - (is916 ? 200 : 170);

  const currentFontSize = is916 ? 88 : 72;
  const prevFontSize = is916 ? 36 : 30;
  const maxWidth = width - (is916 ? 100 : 80);

  ctx.save();
  ctx.globalAlpha = active.fadeAlpha;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  // Prior-context line (lighter, smaller, above the current word).
  if (active.prev) {
    ctx.font = `500 ${prevFontSize}px "Helvetica Neue", "Hiragino Sans", "Yu Gothic", "Noto Sans JP", system-ui, sans-serif`;
    ctx.shadowColor = 'rgba(0,0,0,0.75)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 2;
    // Trim very long prior context to maxWidth.
    let prev = active.prev;
    while (ctx.measureText(prev).width > maxWidth && prev.length > 4) {
      prev = '…' + prev.slice(prev.indexOf(' ') + 1);
    }
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.fillText(prev, width / 2, baseY - currentFontSize - 8);
  }

  // The active word — large, high contrast, with subtle outline.
  ctx.font = `800 ${currentFontSize}px "Helvetica Neue", "Hiragino Sans", "Yu Gothic", "Noto Sans JP", system-ui, sans-serif`;
  // Outline for legibility over busy frames.
  ctx.lineWidth = is916 ? 8 : 6;
  ctx.strokeStyle = 'rgba(0,0,0,0.85)';
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 4;
  // Wrap if a single word is somehow too wide (unusual).
  ctx.strokeText(active.current, width / 2, baseY);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(active.current, width / 2, baseY);

  ctx.restore();
}

function drawVignette(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  const grad = ctx.createRadialGradient(
    width / 2,
    height / 2,
    Math.min(width, height) * 0.4,
    width / 2,
    height / 2,
    Math.max(width, height) * 0.7,
  );
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.28)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
}

// ---------------------------------------------------------------------------
// Main pipeline
// ---------------------------------------------------------------------------

export async function generateSlideshowVideo(
  args: GenerateVideoArgs,
): Promise<PlatformVideo> {
  if (typeof MediaRecorder === 'undefined') {
    throw new AppError(
      'unknown',
      'MediaRecorder is not available in this browser. Video generation requires Chrome, Edge, or Firefox 90+.',
    );
  }

  const dims = VIDEO_DIMENSIONS[args.aspect];
  const is916 = args.aspect === '9x16';
  const maxDuration = args.maxDurationSeconds ?? 30;
  const ctaBarColor = args.ctaBarColor ?? '#15314b'; // navy from the editorial palette

  if (args.imageUrls.length === 0) {
    throw new AppError('image/all-failed', 'No images supplied to video generator');
  }

  // Load images and audio in parallel.
  const usedImageUrls = args.imageUrls.slice(0, MAX_SHOTS);
  const imageLoads = await Promise.allSettled(usedImageUrls.map((u) => loadImage(u)));
  const images: HTMLImageElement[] = [];
  for (let i = 0; i < imageLoads.length; i++) {
    const r = imageLoads[i]!;
    if (r.status === 'fulfilled') images.push(r.value);
  }
  if (images.length === 0) {
    throw new AppError('image/all-failed', 'All images failed to load for video generation');
  }
  const audio = await loadAudio(args.audioUrl);

  const audioDuration = isFinite(audio.duration) && audio.duration > 0 ? audio.duration : maxDuration;
  const duration = Math.min(audioDuration, maxDuration);

  // Plan shots over the duration.
  const plans = planShots(
    images.map((img) => img.src),
    duration,
  );
  // Re-wire shotsEndApprox so "is this the last shot?" returns the actual
  // last end-second (used by shotAlpha's tail-fade logic).
  const lastEnd = plans[plans.length - 1]!.endSec;
  shotsEndApprox = () => lastEnd;

  // Pre-compute per-image base crops so we don't recompute every frame.
  const baseCrops = plans.map((_plan, i) => {
    const img = images[i] ?? images[images.length - 1]!;
    return computeSourceCrop(img.naturalWidth, img.naturalHeight, dims.width, dims.height);
  });

  // Canvas + context.
  const canvas = document.createElement('canvas');
  canvas.width = dims.width;
  canvas.height = dims.height;
  const rawCtx = canvas.getContext('2d');
  if (!rawCtx) throw new AppError('unknown', '2D canvas context unavailable.');
  const ctx: CanvasRenderingContext2D = rawCtx;

  // Audio routing: src → MediaStreamDestination (for recorder) AND
  // src → audioCtx.destination (for live playback) AND src → analyser
  // (for amplitude). All three taps are off the same source.
  const fps = 30;
  const frameMs = 1000 / fps;
  const videoStream = canvas.captureStream(fps);
  const audioCtx = new AudioContext();
  const source = audioCtx.createMediaElementSource(audio);
  const dest = audioCtx.createMediaStreamDestination();
  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 256;
  source.connect(dest);
  source.connect(audioCtx.destination);
  source.connect(analyser);
  const amplitudeBuffer = new Uint8Array(analyser.frequencyBinCount);

  function readAmplitude(): number {
    analyser.getByteTimeDomainData(amplitudeBuffer);
    let sum = 0;
    for (let i = 0; i < amplitudeBuffer.length; i++) {
      const v = (amplitudeBuffer[i]! - 128) / 128;
      sum += v * v;
    }
    return Math.sqrt(sum / amplitudeBuffer.length);
  }

  const combined = new MediaStream([
    ...videoStream.getVideoTracks(),
    ...dest.stream.getAudioTracks(),
  ]);

  const mimeType = pickMimeType();
  const recorder = new MediaRecorder(combined, { mimeType, videoBitsPerSecond: 5_500_000 });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  // Headline and CTA timing windows.
  // Headline: visible from 0.4s to ~45% through, then fades out.
  const headlineStart = 0.4;
  const headlineEnd = Math.min(duration * 0.45, Math.max(headlineStart + 2.5, duration - CTA_TAIL_SECONDS - 1.5));
  // CTA: visible the last CTA_TAIL_SECONDS, including the very end.
  const ctaStart = Math.max(0, duration - CTA_TAIL_SECONDS);

  // Word-level caption windows. Prefer the precise alignment from
  // ElevenLabs; fall back to even-distribution estimation from scriptText.
  let captionWords: WordWindow[] = [];
  if (args.alignment && args.alignment.characters.length > 0) {
    captionWords = wordsFromAlignment(args.alignment);
  } else if (args.scriptText) {
    captionWords = estimateWordWindows(args.scriptText, duration);
  }

  function headlineAlpha(t: number): number {
    if (t < headlineStart) return 0;
    if (t < headlineStart + HEADLINE_FADE_IN)
      return (t - headlineStart) / HEADLINE_FADE_IN;
    if (t > headlineEnd) return 0;
    if (t > headlineEnd - HEADLINE_FADE_OUT)
      return Math.max(0, (headlineEnd - t) / HEADLINE_FADE_OUT);
    return 1;
  }
  function ctaAlpha(t: number): number {
    if (t < ctaStart) return 0;
    if (t < ctaStart + CTA_FADE_IN) return (t - ctaStart) / CTA_FADE_IN;
    return 1;
  }

  function drawShot(plan: ShotPlan, t: number, alpha: number): void {
    if (alpha <= 0.001) return;
    const local = (t - plan.startSec) / (plan.endSec - plan.startSec);
    const lerp = (a: number, b: number) => a + (b - a) * local;
    const zoom = lerp(plan.curve.zoomStart, plan.curve.zoomEnd);
    const panX = lerp(plan.curve.panStartX, plan.curve.panEndX);
    const panY = lerp(plan.curve.panStartY, plan.curve.panEndY);

    const base = baseCrops[plan.index]!;
    const img = images[plan.index] ?? images[images.length - 1]!;
    const zw = base.sw / zoom;
    const zh = base.sh / zoom;
    const cx = base.sx + base.sw / 2 + panX * base.sw;
    const cy = base.sy + base.sh / 2 + panY * base.sh;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.drawImage(img, cx - zw / 2, cy - zh / 2, zw, zh, 0, 0, dims.width, dims.height);
    ctx.restore();
  }

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
      try { analyser.disconnect(); } catch { /* noop */ }
      try { audio.pause(); audio.currentTime = 0; } catch { /* noop */ }
      try { audioCtx.close(); } catch { /* noop */ }
      try {
        for (const tr of videoStream.getTracks()) tr.stop();
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
        provider: 'slideshow',
      });
    };

    function tick(now: number) {
      if (!startedAt) startedAt = now;
      const t = (now - startedAt) / 1000;

      // Black background under everything for transparency-safe compositing.
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, dims.width, dims.height);

      // Draw all active shots in order; alpha controls crossfade.
      for (const plan of plans) {
        const a = shotAlpha(plan, t);
        if (a > 0) drawShot(plan, t, a);
      }

      // Vignette over the image stack.
      drawVignette(ctx, dims.width, dims.height);

      // Brand-name watermark (persistent through whole video).
      drawBrandWatermark(ctx, args.brandName, dims.width, dims.height, is916);

      // Audio-reactive pulse dot.
      const rms = readAmplitude();
      drawAudioPulse(ctx, rms, dims.width, dims.height, is916);

      // Text overlays.
      drawHeadlineOverlay(ctx, args.headline, headlineAlpha(t), dims.width, dims.height, is916);

      // Kinetic captions — synced to the voiceover. Drawn between the
      // headline window (top half) and the CTA bar (bottom), automatically
      // lifting when the CTA bar appears so they don't collide. We pause
      // captions during the headline's full-opacity window so the two
      // text layers don't fight for attention.
      const ctaBarVisible = ctaAlpha(t) > 0.05;
      const headlineFullyVisible = headlineAlpha(t) > 0.8;
      const active = headlineFullyVisible
        ? null
        : pickActivePhrase(captionWords, t);
      drawCaptionLayer(ctx, active, dims.width, dims.height, ctaBarVisible, is916);

      drawCtaBar(ctx, args.cta, ctaAlpha(t), dims.width, dims.height, ctaBarColor, is916);

      if (t >= duration) {
        try { recorder.stop(); } catch { /* already stopped */ }
        return;
      }
      rafId = requestAnimationFrame(tick);
    }

    const timeoutMs = (duration + 5) * 1000;
    const timeout = setTimeout(() => {
      try { recorder.stop(); } catch { /* noop */ }
    }, timeoutMs);
    recorder.addEventListener('stop', () => clearTimeout(timeout), { once: true });

    recorder.start(frameMs * 5);
    audio.currentTime = 0;
    void audio
      .play()
      .then(() => {
        rafId = requestAnimationFrame(tick);
      })
      .catch((err) => {
        cleanup();
        try { recorder.stop(); } catch { /* noop */ }
        reject(
          new AppError(
            'unknown',
            `Audio playback failed: ${err instanceof Error ? err.message : String(err)}`,
          ),
        );
      });
  });
}
