import type { VercelResponse } from '@vercel/node';

// Centralized error response shape. The client maps `code` to a
// localized error message (same code map used by web AppError).
export type ApiErrorCode =
  | 'auth/unauthorized'
  | 'auth/bad-credentials'
  | 'auth/missing-config'
  | 'auth/email-unverified'
  | 'auth/token-invalid'
  | 'auth/rate-limited'
  | 'oauth/state-mismatch'
  | 'oauth/exchange-failed'
  | 'oauth/link-requires-login'
  | 'tier/forbidden'
  | 'method/not-allowed'
  | 'body/invalid'
  | 'cost/cap-exceeded'
  | 'upstream/error'
  | 'upstream/auth-failed'
  | 'upstream/no-credits'
  | 'upstream/rate-limit'
  | 'upstream/timeout'
  | 'config/missing-key'
  | 'unknown';

export function sendError(
  res: VercelResponse,
  status: number,
  code: ApiErrorCode,
  detail?: string,
): void {
  res.status(status).json({ code, ...(detail ? { detail } : {}) });
}

export function methodNotAllowed(res: VercelResponse): void {
  sendError(res, 405, 'method/not-allowed');
}

// Maps a fetch Response to the appropriate ApiErrorCode + status.
export async function relayUpstreamError(
  res: VercelResponse,
  upstream: Response,
  scope: string,
): Promise<void> {
  const text = await upstream.text().catch(() => '');
  const detail = `${scope}: ${text.slice(0, 240)}`;
  if (upstream.status === 401) return sendError(res, 401, 'upstream/auth-failed', detail);
  if (upstream.status === 402) return sendError(res, 402, 'upstream/no-credits', detail);
  if (upstream.status === 429) return sendError(res, 429, 'upstream/rate-limit', detail);
  sendError(res, upstream.status >= 500 ? 502 : 400, 'upstream/error', detail);
}

export function requirePost(req: { method?: string }, res: VercelResponse): boolean {
  if (req.method !== 'POST') {
    methodNotAllowed(res);
    return false;
  }
  return true;
}
