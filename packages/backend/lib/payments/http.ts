// Tiny timeout-guarded fetch helpers for talking to public RPCs / block
// explorers. Node 22 has global fetch + AbortSignal.timeout — no deps.

const DEFAULT_TIMEOUT_MS = 12_000;

function timeout(ms?: number): AbortSignal {
  return AbortSignal.timeout(ms ?? DEFAULT_TIMEOUT_MS);
}

export type HttpJson = { ok: boolean; status: number; data: unknown };

export async function getJson(url: string, ms?: number): Promise<HttpJson> {
  const res = await fetch(url, { signal: timeout(ms), headers: { accept: 'application/json' } });
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    /* non-JSON body */
  }
  return { ok: res.ok, status: res.status, data };
}

export async function getText(url: string, ms?: number): Promise<{ ok: boolean; status: number; text: string }> {
  const res = await fetch(url, { signal: timeout(ms) });
  const text = await res.text().catch(() => '');
  return { ok: res.ok, status: res.status, text };
}

// Minimal JSON-RPC 2.0 POST. Throws on transport/HTTP/RPC error so the caller
// can treat "couldn't reach the chain" distinctly from "tx not found".
export async function jsonRpc<T = unknown>(url: string, method: string, params: unknown[], ms?: number): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    signal: timeout(ms),
  });
  if (!res.ok) throw new Error(`rpc ${method} http ${res.status}`);
  const body = (await res.json()) as { result?: T; error?: unknown };
  if (body.error) throw new Error(`rpc ${method} error ${JSON.stringify(body.error).slice(0, 200)}`);
  return body.result as T;
}
