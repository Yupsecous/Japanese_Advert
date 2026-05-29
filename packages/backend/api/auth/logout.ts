import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requirePost } from '../../lib/respond.js';
import { getCookie, clearCookie, SESSION_COOKIE } from '../../lib/cookies.js';
import { revokeSessionByToken } from '../../lib/sessions.js';

// Revokes the current session row and clears the cookie. Idempotent.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requirePost(req, res)) return;
  const raw = getCookie(req, SESSION_COOKIE);
  if (raw) {
    await revokeSessionByToken(raw).catch(() => undefined);
  }
  clearCookie(res, SESSION_COOKIE);
  return res.status(204).end();
}
