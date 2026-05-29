import { backendPost } from './backendClient';
import type { VoiceSample } from '../data/voiceLibrary';

type ElevenVoice = {
  voice_id: string;
  name: string;
  category?: string;
  labels?: Record<string, string>;
  description?: string;
};

type VoicesResponse = {
  voices?: ElevenVoice[];
};

function toneLabelFromVoice(v: ElevenVoice): string {
  const parts: string[] = [];
  if (v.labels) {
    // ElevenLabs labels typically include accent, age, gender, use-case, description
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

// Map an ElevenLabs API voice to the VoiceSample shape the UI uses.
function toSample(v: ElevenVoice): VoiceSample {
  return {
    id: v.voice_id,
    displayName: v.name,
    toneLabel: toneLabelFromVoice(v),
    elevenlabsVoiceId: v.voice_id,
  };
}

// Routes through the backend proxy (/api/elevenlabs/voices). The leading-
// underscore arg is retained (ignored) for call-site compatibility.
export async function fetchUserVoices(_apiKey?: string): Promise<VoiceSample[]> {
  const body = await backendPost<VoicesResponse>('/api/elevenlabs/voices', {}, 'eleven');
  const voices = body.voices ?? [];
  return voices.map(toSample);
}
