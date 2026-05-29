import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { authenticate } from '../../lib/auth.js';
import {
  relayUpstreamError,
  requirePost,
  sendError,
} from '../../lib/respond.js';
import { recordSpend, costForText, wouldExceedCap, recordUsageEvent } from '../../lib/cost.js';
import { costCapForTier } from '../../lib/tiers.js';

// ElevenLabs /text-to-speech/{voice_id}/with-timestamps proxy. Returns
// the same JSON shape ElevenLabs returns — an `audio_base64` string +
// character-level alignment arrays. The client decodes the base64 into
// a Blob (web) or writes to a file (RN).
//
// We don't proxy the raw streaming endpoint because alignment is what
// makes the kinetic-captions feature possible; streaming would skip it.

const BodyZ = z.object({
  voiceId: z.string().min(1),
  text: z.string().min(1),
  modelId: z.string().default('eleven_multilingual_v2'),
  voiceSettings: z
    .object({
      stability: z.number().optional(),
      similarity_boost: z.number().optional(),
      style: z.number().optional(),
    })
    .optional(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requirePost(req, res)) return;

  const session = await authenticate(req);
  if (!session) return sendError(res, 401, 'auth/unauthorized');

  const parsed = BodyZ.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 400, 'body/invalid', parsed.error.message);
  }

  const cost = costForText();
  if (wouldExceedCap(session.sub, cost, costCapForTier(session.tier))) {
    return sendError(res, 402, 'cost/cap-exceeded');
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return sendError(res, 500, 'config/missing-key', 'ELEVENLABS_API_KEY');

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(parsed.data.voiceId)}/with-timestamps`;

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: parsed.data.text,
        model_id: parsed.data.modelId,
        ...(parsed.data.voiceSettings
          ? { voice_settings: parsed.data.voiceSettings }
          : {}),
      }),
    });
  } catch (err) {
    return sendError(
      res,
      502,
      'upstream/error',
      err instanceof Error ? err.message : 'fetch failed',
    );
  }

  if (!upstream.ok) {
    return relayUpstreamError(res, upstream, 'elevenlabs/tts');
  }

  recordSpend(session.sub, cost);
  recordUsageEvent(session.sub, 'elevenlabs/tts', cost);
  const body = await upstream.json();
  res.status(200).json(body);
}
