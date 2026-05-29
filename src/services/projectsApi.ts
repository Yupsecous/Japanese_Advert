// Thin client for the saved-ad (history) endpoints. Same-origin, cookie auth.

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

export type ProjectListItem = { id: string; title: string; updatedAt: string };
export type ProjectFull = {
  id: string;
  title: string;
  locale: string | null;
  state: unknown;
  updatedAt: string;
};

export type ApiResult<T> = { ok: true; data: T } | { ok: false; code: string; status: number };

async function req<T>(
  path: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  body?: unknown,
): Promise<ApiResult<T>> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      credentials: 'include',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    return { ok: false, code: 'network', status: 0 };
  }
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    /* empty body */
  }
  if (!res.ok) {
    const code = (data as { code?: string } | null)?.code ?? `http/${res.status}`;
    return { ok: false, code, status: res.status };
  }
  return { ok: true, data: data as T };
}

export const projectsApi = {
  list: () => req<{ projects: ProjectListItem[] }>('/api/projects', 'GET'),
  create: (body: { title: string; locale?: string | null; state: unknown }) =>
    req<{ id: string }>('/api/projects', 'POST', body),
  get: (id: string) => req<{ project: ProjectFull }>(`/api/projects/${id}`, 'GET'),
  update: (id: string, body: { title?: string; locale?: string | null; state?: unknown }) =>
    req<{ ok: true }>(`/api/projects/${id}`, 'PUT', body),
  remove: (id: string) => req<{ ok: true }>(`/api/projects/${id}`, 'DELETE'),
};
