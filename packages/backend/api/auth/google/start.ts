import type { VercelRequest, VercelResponse } from '@vercel/node';
import { allow, clientIp } from '../../../lib/ratelimit.js';
import { sendError } from '../../../lib/respond.js';
import { createGoogleAuthUrl } from '../../../lib/oauth.js';
import { setSignedCookie, OAUTH_STATE_COOKIE, OAUTH_VERIFIER_COOKIE } from '../../../lib/cookies.js';

// Kicks off Google sign-in. Stores the CSRF state + PKCE verifier in
// short-lived signed httpOnly cookies, then 302s to Google.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!allow(`google:${clientIp(req)}`, 10, 0.2)) return sendError(res, 429, 'auth/rate-limited');

  let auth: { url: string; state: string; codeVerifier: string };
  try {
    auth = createGoogleAuthUrl();
  } catch {
    return sendError(res, 500, 'auth/missing-config', 'Google OAuth not configured');
  }
  setSignedCookie(res, OAUTH_STATE_COOKIE, auth.state, 600);
  setSignedCookie(res, OAUTH_VERIFIER_COOKIE, auth.codeVerifier, 600);
  return res.redirect(302, auth.url);
}
