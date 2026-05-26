import type { VercelRequest, VercelResponse } from '@vercel/node';

// Liveness probe. Doesn't touch any providers; safe to ping on a schedule.
export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    ok: true,
    name: '@advert/backend',
    version: '0.1.0',
    time: new Date().toISOString(),
  });
}
