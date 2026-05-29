// In-memory token-bucket rate limiter, keyed by an arbitrary string (IP,
// email, or both). Single-process only — buckets reset on restart, which is
// acceptable for one VPS. Swap for Redis if the backend is ever scaled out.

import type { VercelRequest } from '@vercel/node';

type Bucket = { tokens: number; updatedAt: number };
const buckets = new Map<string, Bucket>();

// Returns true if the action is allowed (and consumes a token), false if the
// caller is currently rate-limited.
export function allow(key: string, capacity: number, refillPerSec: number): boolean {
  const now = Date.now();
  const b = buckets.get(key) ?? { tokens: capacity, updatedAt: now };
  const elapsed = (now - b.updatedAt) / 1000;
  b.tokens = Math.min(capacity, b.tokens + elapsed * refillPerSec);
  b.updatedAt = now;
  if (b.tokens < 1) {
    buckets.set(key, b);
    return false;
  }
  b.tokens -= 1;
  buckets.set(key, b);
  return true;
}

// Use the IP Express resolved (req.ip), which honors `trust proxy`. When no
// reverse proxy is trusted (the default now), this is the real socket address
// and CANNOT be spoofed via X-Forwarded-For. Previously this read the raw XFF
// header unconditionally, so any client could rotate the header to mint
// unlimited rate-limit keys and bypass every throttle.
export function clientIp(req: VercelRequest): string {
  const r = req as unknown as { ip?: string; socket?: { remoteAddress?: string } };
  if (typeof r.ip === 'string' && r.ip.length > 0) return r.ip;
  return r.socket?.remoteAddress ?? 'unknown';
}
