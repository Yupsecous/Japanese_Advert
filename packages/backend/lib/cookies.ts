// Cookie helpers. We read req.headers.cookie and write Set-Cookie directly
// (the handlers aren't a middleware chain, so no cookie-parser). The web
// session cookie is httpOnly + SameSite=Lax, Secure when served over HTTPS.
// Short-lived OAuth state/verifier cookies are HMAC-signed to detect tamper.

import { parse, serialize } from 'cookie';
import { createHmac, timingSafeEqual } from 'node:crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export const SESSION_COOKIE = 'sid_web';
export const OAUTH_STATE_COOKIE = 'g_state';
export const OAUTH_VERIFIER_COOKIE = 'g_verifier';

// Secure cookies require HTTPS. In local dev the app is served over plain
// http://localhost (via the Vite proxy), where Secure cookies are dropped —
// so key Secure off the public origin's scheme.
function secureCookies(): boolean {
  return (process.env.PUBLIC_ORIGIN ?? '').startsWith('https://');
}

export function getCookie(req: VercelRequest, name: string): string | undefined {
  const header = req.headers.cookie;
  if (!header) return undefined;
  return parse(header)[name];
}

function appendSetCookie(res: VercelResponse, serialized: string): void {
  const prev = res.getHeader('Set-Cookie');
  const arr = Array.isArray(prev) ? prev.map(String) : prev !== undefined ? [String(prev)] : [];
  arr.push(serialized);
  res.setHeader('Set-Cookie', arr);
}

export function setSessionCookie(res: VercelResponse, rawToken: string, maxAgeSeconds: number): void {
  appendSetCookie(
    res,
    serialize(SESSION_COOKIE, rawToken, {
      httpOnly: true,
      secure: secureCookies(),
      sameSite: 'lax',
      path: '/',
      maxAge: maxAgeSeconds,
    }),
  );
}

export function clearCookie(res: VercelResponse, name: string): void {
  appendSetCookie(
    res,
    serialize(name, '', {
      httpOnly: true,
      secure: secureCookies(),
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    }),
  );
}

// --- HMAC-signed short-lived cookies (OAuth state + PKCE verifier) ---

function cookieSecret(): string {
  const s = process.env.SESSION_COOKIE_SECRET;
  if (!s || s.length < 32) {
    throw new Error('SESSION_COOKIE_SECRET missing or shorter than 32 chars');
  }
  return s;
}

function sign(value: string): string {
  const mac = createHmac('sha256', cookieSecret()).update(value).digest('base64url');
  return `${value}.${mac}`;
}

function unsign(signed: string): string | null {
  const dot = signed.lastIndexOf('.');
  if (dot < 0) return null;
  const value = signed.slice(0, dot);
  const expected = createHmac('sha256', cookieSecret()).update(value).digest('base64url');
  const got = signed.slice(dot + 1);
  const a = Buffer.from(got);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return value;
}

export function setSignedCookie(
  res: VercelResponse,
  name: string,
  value: string,
  maxAgeSeconds: number,
): void {
  appendSetCookie(
    res,
    serialize(name, sign(value), {
      httpOnly: true,
      secure: secureCookies(),
      sameSite: 'lax',
      path: '/',
      maxAge: maxAgeSeconds,
    }),
  );
}

export function getSignedCookie(req: VercelRequest, name: string): string | null {
  const raw = getCookie(req, name);
  if (!raw) return null;
  return unsign(raw);
}
