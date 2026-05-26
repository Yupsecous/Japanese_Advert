import { SignJWT, jwtVerify } from 'jose';
import type { VercelRequest } from '@vercel/node';

// HMAC-signed JWTs (HS256). Stateless — the server never stores sessions.
// Each token carries a session id used for cost-cap accounting (lib/cost.ts).

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

// Extracts and verifies the Bearer token. Returns null if missing/invalid —
// the route handler converts that to a 401 response.
export async function authenticate(req: VercelRequest): Promise<SessionPayload | null> {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  const token = header.slice('Bearer '.length).trim();
  if (!token) return null;
  try {
    return await verifyToken(token);
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
