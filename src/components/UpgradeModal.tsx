import { useEffect, useState } from 'react';
import { useAppStore } from '../store';
import { useT } from '../i18n/hooks';
import { authApi } from '../services/authApi';
import { TIER_LABELS, type Tier } from '../tiers';
import { BrandMark } from './BrandMark';
import { Button } from './ui/Button';

// Personify Ads plans modal — the equivalent of Grok's "SuperGrok" upgrade
// sheet, mapped onto our Free/Pro/Ultra tiers. There are no real payments yet:
// a plan is unlocked by redeeming a fixed Pro/Ultra key (same flow as Settings).

function Check() {
  return (
    <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true" className="mt-0.5 shrink-0 text-brand">
      <path fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" d="M3 8.5 6.5 12 13 4.5" />
    </svg>
  );
}

export function UpgradeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useT();
  const user = useAppStore((s) => s.user);
  const setSession = useAppStore((s) => s.setSession);
  const current: Tier = user?.tier ?? 'free';

  const [key, setKey] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function redeem() {
    const k = key.trim();
    if (!k) return;
    setBusy(true);
    setMsg(null);
    const res = await authApi.redeem(k);
    setBusy(false);
    if (res.ok && res.data.user) {
      setSession(res.data.user);
      setKey('');
      setMsg({ ok: true, text: t('tier.redeemSuccess', { tier: TIER_LABELS[res.data.user.tier] }) });
    } else {
      setMsg({ ok: false, text: t('tier.redeemInvalid') });
    }
  }

  const plans: Array<{ tier: Tier; price: string; highlight: boolean }> = [
    { tier: 'free', price: t('upgrade.free.price'), highlight: false },
    { tier: 'pro', price: t('upgrade.pro.price'), highlight: true },
    { tier: 'ultra', price: t('upgrade.ultra.price'), highlight: false },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t('upgrade.title')}
    >
      <div className="absolute inset-0 bg-neutral-900/30 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="paper-surface relative z-10 max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-rule p-6 sm:p-8">
        <button
          type="button"
          onClick={onClose}
          aria-label={t('upgrade.close')}
          className="absolute right-4 top-4 rounded-md p-1.5 text-ink-faint transition-colors hover:bg-canvas-deep hover:text-ink"
        >
          <svg viewBox="0 0 16 16" width="18" height="18" aria-hidden="true">
            <path fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>

        <div className="flex flex-col items-center text-center">
          <BrandMark size={34} withWordmark />
          <h2 className="mt-4 font-serif text-xl font-semibold tracking-tight text-ink sm:text-2xl">
            {t('upgrade.title')}
          </h2>
          <p className="mt-1 text-sm text-ink-soft">{t('upgrade.subtitle')}</p>
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-3">
          {plans.map(({ tier, price, highlight }) => {
            const isCurrent = current === tier;
            const features = [
              t(`upgrade.${tier}.f1` as const),
              t(`upgrade.${tier}.f2` as const),
              t(`upgrade.${tier}.f3` as const),
            ];
            return (
              <div
                key={tier}
                className={`relative flex flex-col rounded-xl border p-5 ${
                  highlight ? 'border-brand bg-brand-50/40' : 'border-rule bg-canvas'
                }`}
              >
                {isCurrent && (
                  <span className="absolute right-3 top-3 rounded-full border border-rule bg-paper px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-faint">
                    {t('upgrade.yourPlan')}
                  </span>
                )}
                <p className="text-sm font-semibold text-ink">{t(`upgrade.${tier}.name` as const)}</p>
                <p className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl font-semibold tracking-tight text-ink">{price}</span>
                  {tier !== 'free' && <span className="text-xs text-ink-faint">{t('upgrade.perMonth')}</span>}
                </p>
                <p className="mt-1 text-xs text-ink-soft">{t(`upgrade.${tier}.tagline` as const)}</p>
                <ul className="mt-4 space-y-2">
                  {features.map((f) => (
                    <li key={f} className="flex gap-2 text-xs text-ink-soft">
                      <Check />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {user && (
          <div className="mt-7 rounded-xl border border-rule bg-canvas-deep p-4">
            <p className="text-sm font-medium text-ink">{t('upgrade.redeemTitle')}</p>
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder={t('tier.redeemPlaceholder')}
                spellCheck={false}
                onKeyDown={(e) => e.key === 'Enter' && void redeem()}
                className="min-w-0 flex-1 rounded-lg border border-rule-strong bg-paper px-3 py-2 text-sm outline-none focus:border-brand"
              />
              <Button variant="solid" onClick={() => void redeem()} disabled={busy || key.trim().length === 0} className="shrink-0">
                {busy ? '…' : t('tier.redeemCta')}
              </Button>
            </div>
            {msg && (
              <p className={`mt-2 text-xs ${msg.ok ? 'text-success-700' : 'text-red-600'}`}>{msg.text}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
