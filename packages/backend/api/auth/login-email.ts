import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { sendError, requirePost } from '../../lib/respond.js';
import { allow, clientIp } from '../../lib/ratelimit.js';
import { emailField } from '../../lib/validation.js';
import { findUserByEmail, normalizeEmail, toPublicUser, verifyPassword } from '../../lib/users.js';
import { createSession } from '../../lib/sessions.js';
import { setSessionCookie } from '../../lib/cookies.js';

const BodyZ = z.object({ email: emailField, password: z.string().min(1).max(200) });

// Email/password login for the web. Sets the httpOnly session cookie on
// success. Refuses unverified accounts with a distinct code so the UI can
// offer to resend verification.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requirePost(req, res)) return;

  const ip = clientIp(req);
  if (!allow(`login:ip:${ip}`, 10, 0.2)) return sendError(res, 429, 'auth/rate-limited');

  const parsed = BodyZ.safeParse(req.body);
  if (!parsed.success) return sendError(res, 400, 'body/invalid', parsed.error.message);

  const email = normalizeEmail(parsed.data.email);
  if (!allow(`login:email:${email}`, 5, 0.05)) return sendError(res, 429, 'auth/rate-limited');

  const user = await findUserByEmail(email);
  // Generic bad-credentials for unknown user OR OAuth-only (no password set).
  if (!user || !user.passwordHash) return sendError(res, 401, 'auth/bad-credentials');

  const ok = await verifyPassword(user.passwordHash, parsed.data.password);
  if (!ok) return sendError(res, 401, 'auth/bad-credentials');

  if (!user.emailVerifiedAt) return sendError(res, 403, 'auth/email-unverified');

  const { rawToken, maxAgeSeconds } = await createSession(
    user.id,
    typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : undefined,
    ip,
  );
  setSessionCookie(res, rawToken, maxAgeSeconds);
  return res.status(200).json({ user: toPublicUser(user) });
}
