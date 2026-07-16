import { useEffect, useState } from 'react';
import { useAppStore } from '../store';
import { fetchAdminStats, type AdminStats } from '../services/stripeApi';
import { useT } from '../i18n/hooks';

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border border-rule bg-paper p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-ink">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-ink-soft">{sub}</p>}
    </div>
  );
}

function fmt(n: number, decimals = 0) {
  return n.toLocaleString(undefined, { maximumFractionDigits: decimals });
}

function fmtUsd(n: number) {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function AdminDashboard() {
  const t = useT();
  const user = useAppStore((s) => s.user);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchAdminStats()
      .then(setStats)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (!user?.isAdmin) return null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink">{t('admin.title')}</h1>
        <button
          type="button"
          onClick={() => { setLoading(true); fetchAdminStats().then(setStats).catch((e: Error) => setError(e.message)).finally(() => setLoading(false)); }}
          className="rounded-md border border-rule px-3 py-1.5 text-xs text-ink-soft hover:bg-canvas-deep hover:text-ink"
        >
          Refresh
        </button>
      </div>

      {loading && <p className="text-sm text-ink-soft">{t('admin.loading')}</p>}
      {error && <p className="text-sm text-red-600">{t('admin.error')}: {error}</p>}

      {stats && (
        <div className="space-y-6">
          {/* Users */}
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-faint">{t('admin.users')}</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Total" value={fmt(stats.users.total)} />
              <StatCard label={t('admin.newLast7')} value={fmt(stats.users.newLast7Days)} />
              <StatCard label={t('admin.newLast30')} value={fmt(stats.users.newLast30Days)} />
              <StatCard label={t('admin.sessions')} value={fmt(stats.sessions.active)} sub="non-expired" />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {Object.entries(stats.users.byTier).map(([tier, cnt]) => (
                <div key={tier} className="inline-flex items-center gap-1.5 rounded-full border border-rule bg-paper px-3 py-1 text-xs">
                  <span className="font-semibold capitalize text-ink">{tier}</span>
                  <span className="text-ink-faint">{fmt(cnt)}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Revenue */}
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-faint">{t('admin.revenue')}</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              <StatCard
                label="Total crypto"
                value={fmtUsd(stats.crypto.totalRevenueUsd)}
                sub={`${Object.values(stats.crypto.confirmed).reduce((a, b) => a + b.count, 0)} orders`}
              />
              <StatCard
                label="Stripe active subs"
                value={fmt(stats.stripe.activeSubscriptions)}
                sub={Object.entries(stats.stripe.byStatus).map(([s, n]) => `${s}: ${n}`).join(' · ')}
              />
              <StatCard
                label={t('admin.pending')}
                value={fmt(stats.crypto.pendingOrders)}
                sub="awaiting tx hash"
              />
            </div>
            {Object.entries(stats.crypto.confirmed).length > 0 && (
              <div className="mt-3 overflow-hidden rounded-lg border border-rule">
                <table className="w-full text-sm">
                  <thead className="bg-canvas-deep">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-ink-faint">Tier</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-ink-faint">Orders</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-ink-faint">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(stats.crypto.confirmed).map(([tier, d]) => (
                      <tr key={tier} className="border-t border-rule">
                        <td className="px-4 py-2 font-medium capitalize text-ink">{tier}</td>
                        <td className="px-4 py-2 text-right text-ink-soft">{fmt(d.count)}</td>
                        <td className="px-4 py-2 text-right text-ink-soft">{fmtUsd(d.usd)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* API spend */}
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-faint">{t('admin.spend')}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <StatCard label="API spend (24h)" value={fmtUsd(stats.spend.last24hUsd)} sub="across all users" />
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
