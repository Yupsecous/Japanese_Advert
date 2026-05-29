// Data layer for saved ad projects (the account-scoped history). Every query
// is scoped by user_id so one user can never read or mutate another's ads.

import { and, desc, eq } from 'drizzle-orm';
import { getDb } from './db.js';
import { projects, type Project } from './schema.js';

export type ProjectListItem = { id: string; title: string; updatedAt: string };

export async function listProjects(userId: string): Promise<ProjectListItem[]> {
  const rows = await getDb()
    .select({ id: projects.id, title: projects.title, updatedAt: projects.updatedAt })
    .from(projects)
    .where(eq(projects.userId, userId))
    .orderBy(desc(projects.updatedAt))
    .limit(200);
  return rows.map((r) => ({ id: r.id, title: r.title, updatedAt: r.updatedAt.toISOString() }));
}

export async function getProject(userId: string, id: string): Promise<Project | null> {
  const rows = await getDb()
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, userId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function createProject(
  userId: string,
  title: string,
  locale: string | null,
  state: unknown,
): Promise<{ id: string }> {
  const rows = await getDb()
    .insert(projects)
    .values({ userId, title, locale, state: state as Project['state'] })
    .returning({ id: projects.id });
  return { id: rows[0]!.id };
}

export async function updateProject(
  userId: string,
  id: string,
  patch: { title?: string; locale?: string | null; state?: unknown },
): Promise<boolean> {
  const set: Partial<Project> = { updatedAt: new Date() };
  if (patch.title !== undefined) set.title = patch.title;
  if (patch.locale !== undefined) set.locale = patch.locale;
  if (patch.state !== undefined) set.state = patch.state as Project['state'];
  const rows = await getDb()
    .update(projects)
    .set(set)
    .where(and(eq(projects.id, id), eq(projects.userId, userId)))
    .returning({ id: projects.id });
  return rows.length > 0;
}

export async function deleteProject(userId: string, id: string): Promise<boolean> {
  const rows = await getDb()
    .delete(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, userId)))
    .returning({ id: projects.id });
  return rows.length > 0;
}
