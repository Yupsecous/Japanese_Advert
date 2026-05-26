// Thin client for the Vercel backend. Mirrors the route shapes from
// packages/backend/api/. All provider calls flow through here — there
// are NO direct provider API calls in the Android app (keys live only
// on the backend).

import Constants from 'expo-constants';
import type { ImageQualityTier } from '@advert/shared';

function backendBaseUrl(): string {
  const fromExtra = (Constants.expoConfig?.extra as { backendUrl?: string } | undefined)?.backendUrl;
  return fromExtra ?? 'http://10.0.2.2:3001';
}

export type ApiErrorBody = { code: string; detail?: string };

export class BackendError extends Error {
  code: string;
  detail?: string;
  status: number;
  constructor(status: number, code: string, detail?: string) {
    super(detail ? `${code}: ${detail}` : code);
    this.status = status;
    this.code = code;
    if (detail !== undefined) this.detail = detail;
  }
}

let bearerToken: string | null = null;

export function setToken(token: string | null): void {
  bearerToken = token;
}

export function hasToken(): boolean {
  return bearerToken !== null;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const url = `${backendBaseUrl()}${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(bearerToken ? { Authorization: `Bearer ${bearerToken}` } : {}),
      },
      body: JSON.stringify(body ?? {}),
    });
  } catch (err) {
    throw new BackendError(0, 'network', err instanceof Error ? err.message : 'fetch failed');
  }
  if (!res.ok) {
    let parsed: ApiErrorBody = { code: 'unknown' };
    try {
      parsed = (await res.json()) as ApiErrorBody;
    } catch {
      // ignore body parse failure
    }
    throw new BackendError(res.status, parsed.code, parsed.detail);
  }
  return (await res.json()) as T;
}

export type LoginResponse = { token: string; sid: string };

export async function login(username: string, password: string): Promise<LoginResponse> {
  return post<LoginResponse>('/api/auth/login', { username, password });
}

// OpenAI: forward the body as-is (chat completions shape).
export async function openaiChat<T>(body: unknown): Promise<T> {
  return post<T>('/api/openai/chat', body);
}

// Anthropic: forward the body as-is (messages shape).
export async function anthropicMessages<T>(body: unknown): Promise<T> {
  return post<T>('/api/anthropic/messages', body);
}

export type FluxResponse = { images: Array<{ url: string }> };

export async function fluxGenerate(args: {
  prompt: string;
  width: number;
  height: number;
  tier: ImageQualityTier;
}): Promise<FluxResponse> {
  return post<FluxResponse>('/api/fal/flux', args);
}

export type KlingSubmitResponse = { request_id: string };
export type KlingPollResponse =
  | { status: 'IN_QUEUE' | 'IN_PROGRESS' }
  | { status: 'COMPLETED'; video: { url: string } }
  | { status: 'FAILED'; detail?: string };

export async function klingSubmit(args: {
  prompt: string;
  imageUrl: string;
  aspect: '9x16' | '1x1';
}): Promise<KlingSubmitResponse> {
  return post<KlingSubmitResponse>('/api/fal/kling-submit', args);
}

export async function klingPoll(requestId: string): Promise<KlingPollResponse> {
  return post<KlingPollResponse>('/api/fal/kling-poll', { requestId });
}

export type TtsResponse = {
  audio_base64: string;
  alignment?: {
    characters: string[];
    character_start_times_seconds: number[];
    character_end_times_seconds: number[];
  };
};

export async function elevenLabsTts(args: {
  voiceId: string;
  text: string;
  modelId?: string;
  voiceSettings?: Record<string, number>;
}): Promise<TtsResponse> {
  return post<TtsResponse>('/api/elevenlabs/tts', args);
}

export type ElevenVoice = {
  voice_id: string;
  name: string;
  category?: string;
  labels?: Record<string, string>;
  description?: string;
};

export async function elevenLabsVoices(): Promise<{ voices: ElevenVoice[] }> {
  return post<{ voices: ElevenVoice[] }>('/api/elevenlabs/voices', {});
}
