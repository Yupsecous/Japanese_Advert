// Builds a WebVTT subtitle file from ElevenLabs character-level alignment
// data (or from a fallback even-distribution over the script text).
// Both Meta and X accept .vtt subtitle uploads alongside a video creative.
//
// We chunk words into ~3-second / ~7-word caption cues for readability —
// kinetic captions in the rendered video show one word at a time, but
// downloadable subtitle files for accessibility tools and platform
// upload work better with phrase-length cues.

import type { AudioAlignment } from '../types';

type WordCue = { text: string; startSec: number; endSec: number };

function wordsFromAlignment(alignment: AudioAlignment): WordCue[] {
  const out: WordCue[] = [];
  let current = '';
  let start: number | null = null;
  let end: number | null = null;
  function flush() {
    if (current && start !== null && end !== null) {
      out.push({ text: current, startSec: start, endSec: end });
    }
    current = '';
    start = null;
    end = null;
  }
  for (let i = 0; i < alignment.characters.length; i++) {
    const ch = alignment.characters[i]!;
    const s = alignment.charStartSec[i]!;
    const e = alignment.charEndSec[i]!;
    if (/\s/.test(ch)) {
      flush();
      continue;
    }
    if (start === null) start = s;
    end = e;
    current += ch;
  }
  flush();
  return out;
}

function estimateWords(script: string, duration: number): WordCue[] {
  const tokens = script.split(/\s+/).filter((w) => w.length > 0);
  if (tokens.length === 0 || duration <= 0) return [];
  const headPadding = Math.min(0.15, duration * 0.02);
  const slice = (duration - headPadding) / tokens.length;
  return tokens.map((text, i) => ({
    text,
    startSec: headPadding + i * slice,
    endSec: headPadding + (i + 1) * slice,
  }));
}

// Chunks words into caption-line cues. Targets 5–8 words per cue with a
// soft cap on cue duration so long phrases break naturally.
function chunkIntoCues(words: WordCue[]): WordCue[] {
  const MAX_WORDS = 8;
  const MAX_DURATION = 3.5;
  const out: WordCue[] = [];
  let buffer: WordCue[] = [];
  for (const w of words) {
    if (buffer.length === 0) {
      buffer.push(w);
      continue;
    }
    const first = buffer[0]!;
    const wouldBeDuration = w.endSec - first.startSec;
    if (buffer.length >= MAX_WORDS || wouldBeDuration > MAX_DURATION) {
      out.push({
        text: buffer.map((b) => b.text).join(' '),
        startSec: first.startSec,
        endSec: buffer[buffer.length - 1]!.endSec,
      });
      buffer = [w];
    } else {
      buffer.push(w);
    }
  }
  if (buffer.length > 0) {
    const first = buffer[0]!;
    out.push({
      text: buffer.map((b) => b.text).join(' '),
      startSec: first.startSec,
      endSec: buffer[buffer.length - 1]!.endSec,
    });
  }
  return out;
}

function formatTimestamp(seconds: number): string {
  // WebVTT timestamp format: HH:MM:SS.mmm
  const total = Math.max(0, seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  const wholeSecs = Math.floor(secs);
  const ms = Math.floor((secs - wholeSecs) * 1000);
  const pad = (n: number, w = 2) => n.toString().padStart(w, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(wholeSecs)}.${pad(ms, 3)}`;
}

export type BuildVttArgs = {
  alignment?: AudioAlignment;
  scriptText: string;
  durationSeconds: number;
};

export function buildWebVtt(args: BuildVttArgs): string {
  const words = args.alignment
    ? wordsFromAlignment(args.alignment)
    : estimateWords(args.scriptText, args.durationSeconds);
  if (words.length === 0) {
    return 'WEBVTT\n\n';
  }
  const cues = chunkIntoCues(words);
  const lines: string[] = ['WEBVTT', ''];
  cues.forEach((cue, idx) => {
    lines.push(String(idx + 1));
    lines.push(`${formatTimestamp(cue.startSec)} --> ${formatTimestamp(cue.endSec)}`);
    lines.push(cue.text);
    lines.push('');
  });
  return lines.join('\n');
}
