import type { VercelRequest, VercelResponse } from '@vercel/node';
import { consumeEmailVerificationToken } from '../../lib/tokens.js';
import { markEmailVerified } from '../../lib/users.js';
import { publicOrigin } from '../../lib/email.js';

// GET link target from the verification email. Consumes the token, marks the
// account verified, then redirects to the web login page with a status flag.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = typeof req.query.token === 'string' ? req.query.token : '';
  const base = publicOrigin();
  if (!token) return res.redirect(302, `${base}/login?verified=0`);

  const userId = await consumeEmailVerificationToken(token);
  if (!userId) return res.redirect(302, `${base}/login?verified=0`);

  await markEmailVerified(userId);
  return res.redirect(302, `${base}/login?verified=1`);
}
