import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { authenticate } from '../../lib/auth.js';
import { relayUpstreamError, requirePost, sendError } from '../../lib/respond.js';
import {
  recordSpend,
  refundSpend,
  costForTts,
  wouldExceedCap,
  wouldExceedGlobalDailyCap,
  recordUsageEvent,
} from '../../lib/cost.js';
import { costCapForTier } from '../../lib/tiers.js';
import { allow } from '../../lib/ratelimit.js';

// ElevenLabs /text-to-speech/{voice_id}/with-timestamps proxy. ElevenLabs
// bills per character, so we bound the text length and bill by length.

const BodyZ = z.object({
  voiceId: z.string().min(1).max(100),
  text: z.string().min(1).max(5000),
  modelId: z.string().max(100).default('eleven_multilingual_v2'),
  voiceSettings: z
    .object({
      stability: z.number().min(0).max(1).optional(),
      similarity_boost: z.number().min(0).max(1).optional(),
      style: z.number().min(0).max(1).optional(),
    })
    .optional(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requirePost(req, res)) return;

  const session = await authenticate(req);
  if (!session) return sendError(res, 401, 'auth/unauthorized');
  if (!allow(`tts:${session.sub}`, 15, 0.2)) return sendError(res, 429, 'auth/rate-limited');

  const parsed = BodyZ.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 400, 'body/invalid', parsed.error.message);
  }

  const cost = costForTts(parsed.data.text.length);
  if (
    wouldExceedCap(session.sub, cost, costCapForTier(session.tier)) ||
    (await wouldExceedGlobalDailyCap(cost))
  ) {
    return sendError(res, 402, 'cost/cap-exceeded');
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return sendError(res, 500, 'config/missing-key', 'ELEVENLABS_API_KEY');

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(parsed.data.voiceId)}/with-timestamps`;

  recordSpend(session.sub, cost);

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
        ...(parsed.data.voiceSettings ? { voice_settings: parsed.data.voiceSettings } : {}),
      }),
    });
  } catch (err) {
    refundSpend(session.sub, cost);
    // eslint-disable-next-line no-console
    console.error('[elevenlabs/tts] fetch failed:', err);
    return sendError(res, 502, 'upstream/error');
  }

  if (!upstream.ok) {
    refundSpend(session.sub, cost);
    return relayUpstreamError(res, upstream, 'elevenlabs/tts');
  }

  recordUsageEvent(session.sub, 'elevenlabs/tts', cost);
  const body = await upstream.json();
  res.status(200).json(body);
}
