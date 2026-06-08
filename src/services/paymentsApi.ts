// Thin client for the non-custodial crypto-payment endpoints. Same shape as
// authApi (same-origin, httpOnly session cookie included) but kept separate so
// payment errors surface as their own UI messages.

import type { Tier } from '../tiers';
import type { SessionUser } from './authApi';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

export type PaymentResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: string; status: number };

async function request<T>(
  path: string,
  options: { method: 'GET' | 'POST'; body?: unknown },
): Promise<PaymentResult<T>> {
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

export type CryptoAsset = {
  chain: string;
  chainLabel: string;
  asset: string;
  label: string;
  kind: string;
};

export type PaymentOptions = {
  enabled: boolean;
  prices: { pro: number; ultra: number };
  ttlMin: number;
  assets: CryptoAsset[];
};

export type CryptoOrder = {
  orderId: string;
  tier: Tier;
  chain: string;
  network: string;
  asset: string;
  address: string;
  amount: string; // human amount to send
  amountUsd: number;
  expiresAt: string; // ISO
  ttlMin: number;
};

export const paymentsApi = {
  options: () => request<PaymentOptions>('/api/payments/crypto/options', { method: 'GET' }),
  createOrder: (body: { tier: 'pro' | 'ultra'; chain: string; asset: string }) =>
    request<{ order: CryptoOrder }>('/api/payments/crypto/create-order', { method: 'POST', body }),
  verify: (body: { orderId: string; txHash: string }) =>
    request<{ ok: true; user: SessionUser | null; tier: Tier }>('/api/payments/crypto/verify', {
      method: 'POST',
      body,
    }),
};
