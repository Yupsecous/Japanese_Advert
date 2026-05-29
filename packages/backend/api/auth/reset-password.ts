import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { sendError, requirePost } from '../../lib/respond.js';
import { allow, clientIp } from '../../lib/ratelimit.js';
import { passwordField } from '../../lib/validation.js';
import { consumePasswordResetToken } from '../../lib/tokens.js';
import { hashPassword, setUserPassword } from '../../lib/users.js';
import { revokeAllUserSessions } from '../../lib/sessions.js';

const BodyZ = z.object({ token: z.string().min(1), password: passwordField });

// Consumes a reset token, sets the new password, and revokes ALL of the
// user's sessions (force re-login everywhere). Does not auto-login.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requirePost(req, res)) return;
  if (!allow(`reset:${clientIp(req)}`, 10, 0.1)) return sendError(res, 429, 'auth/rate-limited');

  const parsed = BodyZ.safeParse(req.body);
  if (!parsed.success) return sendError(res, 400, 'body/invalid', parsed.error.message);

  const userId = await consumePasswordResetToken(parsed.data.token);
  if (!userId) return sendError(res, 400, 'auth/token-invalid');

  const passwordHash = await hashPassword(parsed.data.password);
  await setUserPassword(userId, passwordHash);
  await revokeAllUserSessions(userId);
  return res.status(200).json({ ok: true });
}
