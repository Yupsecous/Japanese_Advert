// Lists voices, generates TTS via the backend proxy, and writes the
// returned base64 audio to a local file so expo-av can play it.
// Alignment data is preserved on the resulting AudioVariant for the
// kinetic-caption layer (which lands in a follow-up session).

import * as FileSystem from 'expo-file-system';
import type {
  AudioAlignment,
  AudioVariant,
  ScriptVariant,
} from '../shared';
import {
  elevenLabsTts,
  elevenLabsVoices,
  type ElevenVoice,
} from './backend';

export type VoiceSample = {
  id: string;
  displayName: string;
  toneLabel: string;
};

function toneLabel(v: ElevenVoice): string {
  const parts: string[] = [];
  if (v.labels) {
    const pick = ['description', 'use case', 'use_case', 'age', 'accent', 'gender'];
    for (const k of pick) {
      const val = v.labels[k];
      if (val) parts.push(val);
      if (parts.length >= 2) break;
    }
  }
  if (parts.length === 0 && v.category) parts.push(v.category);
  if (parts.length === 0 && v.description) parts.push(v.description);
  return parts.join(' · ') || 'voice';
}

export async function listVoices(): Promise<VoiceSample[]> {
  const body = await elevenLabsVoices();
  return body.voices.map((v) => ({
    id: v.voice_id,
    displayName: v.name,
    toneLabel: toneLabel(v),
  }));
}

function newId(): string {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

export type GenerateAudioArgs = {
  voiceId: string;
  script: ScriptVariant;
};

export async function generateAudio(args: GenerateAudioArgs): Promise<AudioVariant> {
  const tts = await elevenLabsTts({
    voiceId: args.voiceId,
    text: args.script.script,
  });

  // ElevenLabs returns audio as base64-encoded MP3. Write it to a file
  // because expo-av needs a uri (data: uris are flaky in RN). The
  // documents directory is sandboxed and survives across app restarts â€”
  // good enough for the demo, the user can re-generate to clear.
  const uri = `${FileSystem.documentDirectory}voice-${newId()}.mp3`;
  await FileSystem.writeAsStringAsync(uri, tts.audio_base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  // Alignment field name normalization: web's AudioAlignment type uses
  // charStartSec / charEndSec; ElevenLabs returns
  // character_start_times_seconds / character_end_times_seconds.
  let alignment: AudioAlignment | undefined;
  if (tts.alignment) {
    alignment = {
      characters: tts.alignment.characters,
      charStartSec: tts.alignment.character_start_times_seconds,
      charEndSec: tts.alignment.character_end_times_seconds,
    };
  }

  const variant: AudioVariant = {
    kind: 'audio',
    id: newId(),
    audioUrl: uri,
    voiceId: args.voiceId,
    scriptId: args.script.id,
    createdAt: Date.now(),
  };
  if (alignment) variant.alignment = alignment;
  if (alignment) {
    const last = alignment.charEndSec[alignment.charEndSec.length - 1];
    if (typeof last === 'number') variant.durationSeconds = last;
  }
  return variant;
}
