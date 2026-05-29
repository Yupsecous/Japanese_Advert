import { SignJWT, jwtVerify } from 'jose';
import type { VercelRequest } from '@vercel/node';
import { getCookie, SESSION_COOKIE } from './cookies.js';
import { findSessionUser } from './sessions.js';
import type { User, Session } from './schema.js';

// HMAC-signed JWTs (HS256). Stateless — used by the Android app via the
// Authorization: Bearer header. The web app instead uses a server-side
// session cookie (see lib/sessions.ts); authenticate() handles both and
// normalizes them to the same SessionPayload {sub, sid} so the proxy routes
// and cost cap don't care which mechanism a caller used.

function jwtSecret(): Uint8Array {
  const raw = process.env.AUTH_JWT_SECRET;
  if (!raw || raw.length < 32) {
    throw new Error('AUTH_JWT_SECRET missing or shorter than 32 chars');
  }
  return new TextEncoder().encode(raw);
}

export type SessionPayload = {
  sub: string; // username
  sid: string; // session id (random per login, used for cost cap)
};

export async function issueToken(payload: SessionPayload): Promise<string> {
  const ttl = Number(process.env.AUTH_TOKEN_TTL_SECONDS ?? 43200);
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${ttl}s`)
    .sign(jwtSecret());
}

export async function verifyToken(token: string): Promise<SessionPayload> {
  const { payload } = await jwtVerify(token, jwtSecret());
  if (typeof payload.sub !== 'string' || typeof payload.sid !== 'string') {
    throw new Error('invalid token shape');
  }
  return { sub: payload.sub, sid: payload.sid };
}

// Resolves the caller to a SessionPayload, or null (→ 401 at the route).
// Precedence is deliberate: if an Authorization: Bearer header is present we
// resolve ONLY via JWT and never fall through to the cookie — this protects
// the Android contract and avoids ambiguity. Otherwise we try the web
// session cookie. For real users sub = users.id and sid = sessions.id; for
// the legacy shared-cred JWT they remain {username, random-uuid} as before.
export async function authenticate(req: VercelRequest): Promise<SessionPayload | null> {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    const token = header.slice('Bearer '.length).trim();
    if (!token) return null;
    try {
      return await verifyToken(token);
    } catch {
      return null;
    }
  }
  const raw = getCookie(req, SESSION_COOKIE);
  if (raw) {
    try {
      const found = await findSessionUser(raw);
      if (found) return { sub: found.user.id, sid: found.session.id };
    } catch {
      // DB unreachable etc. — degrade to unauthenticated rather than 500.
      return null;
    }
  }
  return null;
}

// Full web-session principal (user + session row) for routes that need the
// user record itself (/api/auth/me, logout). Bearer callers get null here.
export async function getWebSessionUser(
  req: VercelRequest,
): Promise<{ user: User; session: Session } | null> {
  const raw = getCookie(req, SESSION_COOKIE);
  if (!raw) return null;
  try {
    return await findSessionUser(raw);
  } catch {
    return null;
  }
}

// Verifies the shared credentials. Constant-time-ish compare on the password
// to keep timing attacks unhelpful. Username is allowed to be a plain compare
// since it's not the secret.
export function checkSharedCredentials(username: string, password: string): boolean {
  const expectedUser = process.env.AUTH_USERNAME ?? '';
  const expectedPass = process.env.AUTH_PASSWORD ?? '';
  if (!expectedUser || !expectedPass) return false;
  if (username !== expectedUser) return false;
  return timingSafeEqual(password, expectedPass);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
