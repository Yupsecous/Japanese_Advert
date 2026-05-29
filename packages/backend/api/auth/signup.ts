import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { sendError, requirePost } from '../../lib/respond.js';
import { allow, clientIp } from '../../lib/ratelimit.js';
import { emailField, passwordField } from '../../lib/validation.js';
import { createEmailUser, findUserByEmail, hashPassword, normalizeEmail } from '../../lib/users.js';
import { createEmailVerificationToken } from '../../lib/tokens.js';
import { sendVerificationEmail } from '../../lib/email.js';

const BodyZ = z.object({
  email: emailField,
  password: passwordField,
  displayName: z.string().trim().min(1).max(80).optional(),
});

// Creates an unverified account and emails a verification link. Responds with
// a generic { ok: true } whether or not the address already exists, so the
// endpoint can't be used to enumerate registered emails.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requirePost(req, res)) return;
  if (!allow(`signup:${clientIp(req)}`, 5, 0.1)) {
    return sendError(res, 429, 'auth/rate-limited');
  }

  const parsed = BodyZ.safeParse(req.body);
  if (!parsed.success) return sendError(res, 400, 'body/invalid', parsed.error.message);

  const email = normalizeEmail(parsed.data.email);
  const existing = await findUserByEmail(email);

  if (existing) {
    // Re-send verification for an existing-but-unverified account; do nothing
    // for a verified one. Either way the response is identical.
    if (!existing.emailVerifiedAt) {
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
    const raw = await createEmailVerificationToken(user.id);
    await sendVerificationEmail(email, raw).catch(() => undefined);
  } catch {
    // Unique-violation race — still generic success.
  }
  return res.status(200).json({ ok: true });
}
