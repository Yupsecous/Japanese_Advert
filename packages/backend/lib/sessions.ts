// Server-side sessions: an opaque random token in an httpOnly cookie, with
// only its sha256 hash stored. Revocable (logout, password reset) — which a
// stateless cookie JWT could not be.

import { randomBytes, createHash } from 'node:crypto';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { getDb } from './db.js';
import { sessions, users, type User, type Session } from './schema.js';

export function sessionTtlSeconds(): number {
  return Number(process.env.SESSION_TTL_SECONDS ?? 2_592_000); // 30 days
}

function hashSessionToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

export async function createSession(
  userId: string,
  userAgent?: string,
  ip?: string,
): Promise<{ rawToken: string; maxAgeSeconds: number }> {
  const rawToken = randomBytes(32).toString('base64url');
  const ttl = sessionTtlSeconds();
  await getDb()
    .insert(sessions)
    .values({
      userId,
      tokenHash: hashSessionToken(rawToken),
      userAgent: userAgent?.slice(0, 500) ?? null,
      ip: ip ?? null,
      expiresAt: new Date(Date.now() + ttl * 1000),
    });
  return { rawToken, maxAgeSeconds: ttl };
}

// Resolves a cookie token to its (active) session + user, or null.
export async function findSessionUser(
  rawToken: string,
): Promise<{ user: User; session: Session } | null> {
  const rows = await getDb()
    .select()
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(
      and(
        eq(sessions.tokenHash, hashSessionToken(rawToken)),
        isNull(sessions.revokedAt),
        gt(sessions.expiresAt, new Date()),
      ),
    )
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  return { user: row.users, session: row.sessions };
}

export async function revokeSessionByToken(rawToken: string): Promise<void> {
  await getDb()
    .update(sessions)
    .set({ revokedAt: new Date() })
    .where(and(eq(sessions.tokenHash, hashSessionToken(rawToken)), isNull(sessions.revokedAt)));
}

export async function revokeAllUserSessions(userId: string): Promise<void> {
  await getDb()
    .update(sessions)
    .set({ revokedAt: new Date() })
    .where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt)));
}
