import type { VercelRequest, VercelResponse } from '@vercel/node';
import { exchangeGoogleCode } from '../../../lib/oauth.js';
import { upsertGoogleUser } from '../../../lib/users.js';
import { createSession } from '../../../lib/sessions.js';
import {
  getSignedCookie,
  setSessionCookie,
  clearCookie,
  OAUTH_STATE_COOKIE,
  OAUTH_VERIFIER_COOKIE,
} from '../../../lib/cookies.js';
import { publicOrigin } from '../../../lib/email.js';
import { clientIp } from '../../../lib/ratelimit.js';

// Google redirects here. Verify state, exchange the code, apply the
// account-linking rules, create a session, and bounce to the app. All error
// paths redirect to /login with an oauth status flag (never a raw 500 page).
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const base = publicOrigin();
  const fail = (reason: string) => res.redirect(302, `${base}/login?oauth=${reason}`);

  const code = typeof req.query.code === 'string' ? req.query.code : '';
  const state = typeof req.query.state === 'string' ? req.query.state : '';
  const storedState = getSignedCookie(req, OAUTH_STATE_COOKIE);
  const verifier = getSignedCookie(req, OAUTH_VERIFIER_COOKIE);

  // One-shot cookies — clear regardless of outcome.
  clearCookie(res, OAUTH_STATE_COOKIE);
  clearCookie(res, OAUTH_VERIFIER_COOKIE);

  if (!code || !state || !storedState || state !== storedState || !verifier) {
    return fail('state');
  }

  let identity;
  try {
    identity = await exchangeGoogleCode(code, verifier);
  } catch {
    return fail('failed');
  }

  const result = await upsertGoogleUser(identity);
  if (!result.ok) return fail('link');

  const { rawToken, maxAgeSeconds } = await createSession(
    result.user.id,
    typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : undefined,
    clientIp(req),
  );
  setSessionCookie(res, rawToken, maxAgeSeconds);
  return res.redirect(302, `${base}/`);
}
