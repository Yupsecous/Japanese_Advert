// Stripe card payment API — creates a Checkout session and redirects to Stripe.

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

type StripeTier = 'pro' | 'ultra';
type StripePeriod = 'monthly' | 'annual';

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { code?: string };
    throw new Error(err.code ?? `stripe request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

// Creates a Stripe Checkout Session and redirects the browser to it.
export async function startStripeCheckout(tier: StripeTier, period: StripePeriod): Promise<void> {
  const { url } = await post<{ url: string }>('/api/payments/stripe/create-checkout', { tier, period });
  window.location.href = url;
}

// Opens the Stripe Customer Portal (cancel/change plan, update card).
export async function openStripePortal(): Promise<void> {
  const { url } = await post<{ url: string }>('/api/payments/stripe/portal', {});
  window.location.href = url;
}

export async function fetchAdminStats(): Promise<AdminStats> {
  const res = await fetch(`${API_BASE}/api/admin/stats`, { credentials: 'include' });
  if (!res.ok) throw new Error(`admin stats failed (${res.status})`);
  return res.json() as Promise<AdminStats>;
}

export type AdminStats = {
  users: { total: number; byTier: Record<string, number>; newLast7Days: number; newLast30Days: number };
  sessions: { active: number };
  crypto: { pendingOrders: number; confirmed: Record<string, { count: number; usd: number }>; totalRevenueUsd: number };
  stripe: { byStatus: Record<string, number>; activeSubscriptions: number };
  spend: { last24hUsd: number };
};
