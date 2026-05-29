// Thin client for the account/auth endpoints. Separate from backendClient
// (provider proxies) because auth errors are surfaced directly in the auth UI
// with their own messages rather than mapped to provider AppError codes.
// All requests are same-origin (or via VITE_API_BASE_URL) with the httpOnly
// session cookie included.

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

export type SessionUser = {
  id: string;
  email: string;
  displayName: string | null;
  emailVerified: boolean;
};

export type AuthResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: string; status: number };

async function request<T>(
  path: string,
  options: { method: 'GET' | 'POST'; body?: unknown },
): Promise<AuthResult<T>> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: options.method,
      headers: options.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      credentials: 'include',
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    return { ok: false, code: 'network', status: 0 };
  }
  if (res.status === 204) return { ok: true, data: undefined as T };
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    /* empty / non-JSON body */
  }
  if (!res.ok) {
    const code = (data as { code?: string } | null)?.code ?? `http/${res.status}`;
    return { ok: false, code, status: res.status };
  }
  return { ok: true, data: data as T };
}

export const authApi = {
  me: () => request<{ user: SessionUser }>('/api/auth/me', { method: 'GET' }),
  signup: (body: { email: string; password: string; displayName?: string }) =>
    request<{ ok: true }>('/api/auth/signup', { method: 'POST', body }),
  login: (body: { email: string; password: string }) =>
    request<{ user: SessionUser }>('/api/auth/login-email', { method: 'POST', body }),
  logout: () => request<void>('/api/auth/logout', { method: 'POST' }),
  forgotPassword: (email: string) =>
    request<{ ok: true }>('/api/auth/forgot-password', { method: 'POST', body: { email } }),
  resetPassword: (token: string, password: string) =>
    request<{ ok: true }>('/api/auth/reset-password', { method: 'POST', body: { token, password } }),
  resendVerification: (email: string) =>
    request<{ ok: true }>('/api/auth/resend-verification', { method: 'POST', body: { email } }),
};

export const GOOGLE_START_URL = `${API_BASE}/api/auth/google/start`;
