import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { sendError, requirePost } from '../../lib/respond.js';
import { allow, clientIp } from '../../lib/ratelimit.js';
import { emailField } from '../../lib/validation.js';
import { findUserByEmail, normalizeEmail } from '../../lib/users.js';
import { createEmailVerificationToken } from '../../lib/tokens.js';
import { sendVerificationEmail } from '../../lib/email.js';

const BodyZ = z.object({ email: emailField });

// Re-sends a verification link. Generic { ok: true } regardless of whether
// the account exists or is already verified (no enumeration).
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requirePost(req, res)) return;
  if (!allow(`resend:${clientIp(req)}`, 3, 0.05)) return sendError(res, 429, 'auth/rate-limited');

  const parsed = BodyZ.safeParse(req.body);
  if (!parsed.success) return sendError(res, 400, 'body/invalid', parsed.error.message);

  const email = normalizeEmail(parsed.data.email);
  const user = await findUserByEmail(email);
  if (user && !user.emailVerifiedAt) {
    const raw = await createEmailVerificationToken(user.id);
    await sendVerificationEmail(email, raw).catch(() => undefined);
  }
  return res.status(200).json({ ok: true });
}
