import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { issueToken, checkSharedCredentials } from '../../lib/auth.js';
import { sendError, requirePost } from '../../lib/respond.js';
import { allow, clientIp } from '../../lib/ratelimit.js';

const BodyZ = z.object({
  username: z.string().min(1).max(200),
  password: z.string().min(1).max(400),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requirePost(req, res)) return;
  // This mints a privileged Bearer token from shared credentials — throttle
  // hard to make online brute force impractical (was previously unthrottled).
  if (!allow(`login-shared:${clientIp(req)}`, 10, 0.05)) {
    return sendError(res, 429, 'auth/rate-limited');
  }

  const parsed = BodyZ.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 400, 'body/invalid', parsed.error.message);
  }

  if (!checkSharedCredentials(parsed.data.username, parsed.data.password)) {
    // Same response for unknown-user and wrong-password — don't leak which.
    return sendError(res, 401, 'auth/bad-credentials');
  }

  const sid = crypto.randomUUID();
  const token = await issueToken({ sub: parsed.data.username, sid });
  res.status(200).json({ token, sid });
}
