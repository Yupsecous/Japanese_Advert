import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sendError } from '../../lib/respond.js';
import { getWebSessionUser } from '../../lib/auth.js';
import { toPublicUser } from '../../lib/users.js';

// Returns the current web user (from the session cookie) for hydration on
// page load. 401 when there's no valid session.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const found = await getWebSessionUser(req);
  if (!found) return sendError(res, 401, 'auth/unauthorized');
  return res.status(200).json({ user: toPublicUser(found.user) });
}
