import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { getWebSessionUser } from '../../lib/auth.js';
import { sendError } from '../../lib/respond.js';
import { allow } from '../../lib/ratelimit.js';
import { getProject, updateProject, deleteProject } from '../../lib/projects.js';

// Item: GET = load one ad's full state; PUT = autosave; DELETE = remove.
// Mounted at /api/projects/:id — id comes from the Express route params.

const MAX_STATE_BYTES = 800_000;

const UpdateZ = z.object({
  title: z.string().max(200).optional(),
  locale: z.string().max(16).optional(),
  state: z.unknown().optional(),
});

function paramId(req: VercelRequest): string {
  const p = (req as unknown as { params?: { id?: string } }).params;
  return (p?.id ?? '').trim();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const found = await getWebSessionUser(req);
  if (!found) return sendError(res, 401, 'auth/unauthorized');
  const userId = found.user.id;
  const id = paramId(req);
  if (!id) return sendError(res, 400, 'body/invalid', 'missing id');

  if (req.method === 'GET') {
    const p = await getProject(userId, id);
    if (!p) return sendError(res, 404, 'project/not-found');
    return res.status(200).json({
      project: { id: p.id, title: p.title, locale: p.locale, state: p.state, updatedAt: p.updatedAt },
    });
  }

  if (req.method === 'PUT') {
    if (!allow(`projects:${userId}`, 40, 1)) return sendError(res, 429, 'auth/rate-limited');
    const parsed = UpdateZ.safeParse(req.body);
    if (!parsed.success) return sendError(res, 400, 'body/invalid', parsed.error.message);
    if (parsed.data.state !== undefined && JSON.stringify(parsed.data.state).length > MAX_STATE_BYTES) {
      return sendError(res, 400, 'body/invalid', 'state too large');
    }
    const ok = await updateProject(userId, id, parsed.data);
    if (!ok) return sendError(res, 404, 'project/not-found');
    return res.status(200).json({ ok: true });
  }

  if (req.method === 'DELETE') {
    const ok = await deleteProject(userId, id);
    if (!ok) return sendError(res, 404, 'project/not-found');
    return res.status(200).json({ ok: true });
  }

  return sendError(res, 405, 'method/not-allowed');
}
