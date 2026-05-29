import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { KLING_SUBMIT_URL } from '@advert/shared';
import { authenticate } from '../../lib/auth.js';
import {
  relayUpstreamError,
  requirePost,
  sendError,
} from '../../lib/respond.js';
import { recordSpend, costForKling, wouldExceedCap, recordUsageEvent } from '../../lib/cost.js';

// Submit a Kling v1.6 image-to-video job. Returns request_id, which the
// client passes to /api/fal/kling-poll until the job completes.
//
// Splitting submit from poll keeps Vercel's 30s timeout out of the
// critical path — Kling jobs take ~75s, so client-side polling is the
// only viable shape.

const BodyZ = z.object({
  prompt: z.string().min(1),
  imageUrl: z.string().url(),
  aspect: z.enum(['9x16', '1x1']),
});

const ASPECT_RATIO = { '9x16': '9:16', '1x1': '1:1' } as const;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requirePost(req, res)) return;

  const session = await authenticate(req);
  if (!session) return sendError(res, 401, 'auth/unauthorized');

  const parsed = BodyZ.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 400, 'body/invalid', parsed.error.message);
  }

  const cost = costForKling();
  if (wouldExceedCap(session.sub, cost)) {
    return sendError(res, 402, 'cost/cap-exceeded');
  }

  const apiKey = process.env.FAL_API_KEY;
  if (!apiKey) return sendError(res, 500, 'config/missing-key', 'FAL_API_KEY');

  let upstream: Response;
  try {
    upstream = await fetch(KLING_SUBMIT_URL, {
      method: 'POST',
      headers: {
        Authorization: `Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: parsed.data.prompt,
        image_url: parsed.data.imageUrl,
        duration: '5',
        aspect_ratio: ASPECT_RATIO[parsed.data.aspect],
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
    return relayUpstreamError(res, upstream, 'fal/kling-submit');
  }

  // Charge the cost now even though the video doesn't exist yet — Kling
  // bills on job submission, not completion. If the client fails to poll
  // we still owe fal.ai.
  recordSpend(session.sub, cost);
  recordUsageEvent(session.sub, 'fal/kling-submit', cost);
  const body = await upstream.json();
  res.status(200).json(body);
}
