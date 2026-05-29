import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { sendError, requirePost } from '../../lib/respond.js';
import { allow, clientIp } from '../../lib/ratelimit.js';
import { emailField } from '../../lib/validation.js';
import { findUserByEmail, normalizeEmail } from '../../lib/users.js';
import { createPasswordResetToken } from '../../lib/tokens.js';
import { sendPasswordResetEmail } from '../../lib/email.js';

const BodyZ = z.object({ email: emailField });

// Always returns a generic { ok: true } (no enumeration). Only emails a reset
// link if the account exists and has a password set (OAuth-only accounts have
// nothing to reset). Hard-rate-limited.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requirePost(req, res)) return;
  const ip = clientIp(req);
  if (!allow(`forgot:ip:${ip}`, 5, 0.03)) return sendError(res, 429, 'auth/rate-limited');

  const parsed = BodyZ.safeParse(req.body);
  if (!parsed.success) return sendError(res, 400, 'body/invalid', parsed.error.message);

  const email = normalizeEmail(parsed.data.email);
  if (!allow(`forgot:email:${email}`, 3, 0.02)) return sendError(res, 429, 'auth/rate-limited');

  const user = await findUserByEmail(email);
  if (user && user.passwordHash) {
    const raw = await createPasswordResetToken(user.id);
    await sendPasswordResetEmail(email, raw).catch(() => undefined);
  }
  return res.status(200).json({ ok: true });
}
