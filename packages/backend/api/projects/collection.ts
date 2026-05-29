import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { getWebSessionUser } from '../../lib/auth.js';
import { sendError } from '../../lib/respond.js';
import { allow } from '../../lib/ratelimit.js';
import { listProjects, createProject } from '../../lib/projects.js';

// Collection: GET = list the signed-in user's ads; POST = save a new one.
// Web-session only (history is an account feature; Bearer/Android isn't used).

const MAX_STATE_BYTES = 800_000;

const CreateZ = z.object({
  title: z.string().max(200).optional(),
  locale: z.string().max(16).optional(),
  state: z.unknown(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const found = await getWebSessionUser(req);
  if (!found) return sendError(res, 401, 'auth/unauthorized');
  const userId = found.user.id;

  if (req.method === 'GET') {
    const items = await listProjects(userId);
    return res.status(200).json({ projects: items });
  }

  if (req.method === 'POST') {
    if (!allow(`projects:${userId}`, 40, 1)) return sendError(res, 429, 'auth/rate-limited');
    const parsed = CreateZ.safeParse(req.body);
    if (!parsed.success) return sendError(res, 400, 'body/invalid', parsed.error.message);
    if (JSON.stringify(parsed.data.state ?? {}).length > MAX_STATE_BYTES) {
      return sendError(res, 400, 'body/invalid', 'state too large');
    }
    const created = await createProject(
      userId,
      parsed.data.title?.trim() || 'Untitled ad',
      parsed.data.locale ?? null,
      parsed.data.state ?? {},
    );
    return res.status(200).json({ id: created.id });
  }

  return sendError(res, 405, 'method/not-allowed');
}
