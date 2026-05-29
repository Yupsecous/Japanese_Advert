import { AppError } from './errorMessages';
import { backendPost } from './backendClient';
import type { AudioAlignment } from '../types';

// Routes through the backend proxy (/api/elevenlabs/tts). `apiKey` is retained
// in the args type for call-site compatibility but is ignored.
export type GenerateAudioArgs = {
  script: string;
  voiceId: string;
  apiKey?: string;
};

export type GenerateAudioResult = {
  blob: Blob;
  url: string;
  alignment?: AudioAlignment;
};

const MODEL = 'eleven_turbo_v2_5';

// Decode a base64 string into a Uint8Array. We use this rather than
// fetch(`data:audio/mpeg;base64,${b64}`) → blob because the with-timestamps
// endpoint can return multi-megabyte audio_base64 and Safari's data-URL
// fetch path is slow for large strings.
function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

type WithTimestampsResponse = {
  audio_base64?: string;
  alignment?: {
    characters?: string[];
    character_start_times_seconds?: number[];
    character_end_times_seconds?: number[];
  };
  normalized_alignment?: {
    characters?: string[];
    character_start_times_seconds?: number[];
    character_end_times_seconds?: number[];
  };
};

export async function generateAudio(args: GenerateAudioArgs): Promise<GenerateAudioResult> {
  if (!args.voiceId) {
    throw new AppError('eleven/voice-not-found', 'empty voiceId');
  }
  if (!args.script.trim()) {
    throw new AppError('eleven/bad-response', 'empty script');
  }

  // The /with-timestamps variant returns the same audio (base64) plus
  // per-character alignment used for kinetic captions + WebVTT export.
  const body = await backendPost<WithTimestampsResponse>(
    '/api/elevenlabs/tts',
    {
      voiceId: args.voiceId,
      text: args.script,
      modelId: MODEL,
      voiceSettings: { stability: 0.5, similarity_boost: 0.75 },
    },
    'eleven',
  );

  const audioB64 = body.audio_base64;
  if (!audioB64) {
    throw new AppError('eleven/bad-response', 'with-timestamps response missing audio_base64');
  }

  let bytes: Uint8Array;
  try {
    bytes = base64ToBytes(audioB64);
  } catch (err) {
    throw new AppError('eleven/bad-response', `base64 decode failed: ${err instanceof Error ? err.message : 'unknown'}`);
  }
  if (bytes.length === 0) {
    throw new AppError('eleven/bad-response', 'decoded audio is empty');
  }

  // Prefer the normalized_alignment (Unicode-normalized, easier to map to
  // the source script) when present; fall back to raw alignment.
  const rawAlign = body.normalized_alignment ?? body.alignment;
  let alignment: AudioAlignment | undefined;
  if (
    rawAlign &&
    Array.isArray(rawAlign.characters) &&
    Array.isArray(rawAlign.character_start_times_seconds) &&
    Array.isArray(rawAlign.character_end_times_seconds) &&
    rawAlign.characters.length === rawAlign.character_start_times_seconds.length &&
    rawAlign.characters.length === rawAlign.character_end_times_seconds.length
  ) {
    alignment = {
      characters: rawAlign.characters,
      charStartSec: rawAlign.character_start_times_seconds,
      charEndSec: rawAlign.character_end_times_seconds,
    };
  }

  // TypeScript 5+ tightened Blob's BlobPart to require ArrayBuffer (not
  // SharedArrayBuffer). Uint8Array#buffer is ArrayBufferLike — we cast
  // explicitly. The bytes came from atob() in this realm so this is safe.
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'audio/mpeg' });
  const url = URL.createObjectURL(blob);
  return { blob, url, ...(alignment ? { alignment } : {}) };
}
