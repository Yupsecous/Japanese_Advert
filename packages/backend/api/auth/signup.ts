import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { sendError, requirePost } from '../../lib/respond.js';
import { allow, clientIp } from '../../lib/ratelimit.js';
import { emailField, passwordField } from '../../lib/validation.js';
import {
  createEmailUser,
  findUserByEmail,
  hashPassword,
  markEmailVerified,
  normalizeEmail,
  toPublicUser,
} from '../../lib/users.js';
import { createEmailVerificationToken } from '../../lib/tokens.js';
import { sendVerificationEmail } from '../../lib/email.js';
import { createSession } from '../../lib/sessions.js';
import { setSessionCookie } from '../../lib/cookies.js';

const BodyZ = z.object({
  email: emailField,
  password: passwordField,
  displayName: z.string().trim().min(1).max(80).optional(),
});

// Creates an account. Normally: unverified + emailed a verification link, and
// responds with a generic { ok: true } (no enumeration). When AUTH_AUTO_VERIFY=1
// (preview deploys without an email sender): the new account is created
// already-verified and the user is logged in immediately, so the email/password
// flow works end-to-end with no SMTP. Off for the real domain deploy.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requirePost(req, res)) return;
  if (!allow(`signup:${clientIp(req)}`, 5, 0.1)) {
    return sendError(res, 429, 'auth/rate-limited');
  }

  const parsed = BodyZ.safeParse(req.body);
  if (!parsed.success) return sendError(res, 400, 'body/invalid', parsed.error.message);

  const autoVerify = process.env.AUTH_AUTO_VERIFY === '1';
  const email = normalizeEmail(parsed.data.email);
  const existing = await findUserByEmail(email);

  if (existing) {
    // Existing account: never auto-login (could be someone else). In normal
    // mode, re-send verification if still unverified. Always generic success.
    if (!autoVerify && !existing.emailVerifiedAt) {
      const raw = await createEmailVerificationToken(existing.id);
      await sendVerificationEmail(email, raw).catch(() => undefined);
    }
    return res.status(200).json({ ok: true });
  }

  const passwordHash = await hashPassword(parsed.data.password);
  try {
    const user = await createEmailUser({
      email,
      passwordHash,
      displayName: parsed.data.displayName ?? null,
    });

    if (autoVerify) {
      await markEmailVerified(user.id);
      const ua = typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : undefined;
      const { rawToken, maxAgeSeconds } = await createSession(user.id, ua, clientIp(req));
      setSessionCookie(res, rawToken, maxAgeSeconds);
      return res.status(200).json({ ok: true, user: toPublicUser({ ...user, emailVerifiedAt: new Date() }) });
    }

    const raw = await createEmailVerificationToken(user.id);
    await sendVerificationEmail(email, raw).catch(() => undefined);
  } catch {
    // Unique-violation race — still generic success.
  }
  return res.status(200).json({ ok: true });
}
