// Web → backend client. The web is a thin client: it never holds provider
// API keys. Every AI call goes to our backend proxy (same-origin in prod, via
// the Vite dev proxy locally), authenticated by the httpOnly session cookie
// (credentials: 'include'). Backend error codes are mapped back to the
// provider-scoped AppError codes the existing UI already localizes.

import { AppError, type ErrorCode } from './errorMessages';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

export type ProviderScope = 'openai' | 'anthropic' | 'fal' | 'eleven';

// The auth store registers a handler so a mid-session 401 kicks the user
// back to the sign-in screen instead of surfacing a cryptic error.
let sessionExpiredHandler: (() => void) | null = null;
export function setSessionExpiredHandler(fn: (() => void) | null): void {
  sessionExpiredHandler = fn;
}

type BackendError = { code?: string; detail?: string };

function mapProviderError(scope: ProviderScope, status: number, body: BackendError): AppError {
  const code = body.code ?? '';
  if (status === 401 || code === 'auth/unauthorized') {
    sessionExpiredHandler?.();
    return new AppError('auth/session-expired', body.detail);
  }
  if (status === 402 || code === 'cost/cap-exceeded') {
    return new AppError('cost/cap-exceeded', body.detail);
  }
  if (code === 'upstream/auth-failed') return new AppError(`${scope}/auth-failed` as ErrorCode, body.detail);
  if (code === 'upstream/rate-limit') return new AppError(`${scope}/rate-limit` as ErrorCode, body.detail);
  if (code === 'upstream/no-credits') {
    if (scope === 'fal') return new AppError('fal/no-credits', body.detail);
    if (scope === 'openai') return new AppError('openai/insufficient-quota', body.detail);
    if (scope === 'anthropic') return new AppError('anthropic/insufficient-quota', body.detail);
    return new AppError('eleven/bad-response', body.detail);
  }
  // config/missing-key, upstream/error, route/not-found, etc. — a
  // server-side problem the user can't fix; surface as a provider bad-response.
  return new AppError(`${scope}/bad-response` as ErrorCode, body.detail || code || `status ${status}`);
}

// POST JSON to a backend route, returning parsed JSON. Throws an AppError
// (provider-scoped) on any non-2xx or network failure.
export async function backendPost<T>(path: string, body: unknown, scope: ProviderScope): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body ?? {}),
    });
  } catch (err) {
    throw new AppError(`${scope}/network` as ErrorCode, err instanceof Error ? err.message : 'fetch failed');
  }
  if (!res.ok) {
    let parsed: BackendError = {};
    try {
      parsed = (await res.json()) as BackendError;
    } catch {
      /* non-JSON error body */
    }
    throw mapProviderError(scope, res.status, parsed);
  }
  return (await res.json()) as T;
}
