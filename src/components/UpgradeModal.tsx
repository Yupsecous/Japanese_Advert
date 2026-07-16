import { useEffect, useState } from 'react';
import { useAppStore } from '../store';
import { useT } from '../i18n/hooks';
import { authApi } from '../services/authApi';
import { TIER_LABELS, type Tier } from '../tiers';
import { BrandMark } from './BrandMark';
import { Button } from './ui/Button';
import { CryptoPaymentModal } from './CryptoPaymentModal';
import { startStripeCheckout, openStripePortal } from '../services/stripeApi';

type Step = 'select' | 'confirm' | 'payment' | 'redeem';

function Check() {
  return (
    <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true" className="mt-0.5 shrink-0 text-brand">
      <path fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" d="M3 8.5 6.5 12 13 4.5" />
    </svg>
  );
}

function ChevronLeft() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      <path fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" d="M10 12L6 8l4-4" />
    </svg>
  );
}

export function UpgradeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useT();
  const user = useAppStore((s) => s.user);
  const setSession = useAppStore((s) => s.setSession);
  const current: Tier = user?.tier ?? 'free';

  const [step, setStep] = useState<Step>('select');
  const [selectedTier, setSelectedTier] = useState<Tier | null>(null);

  // Redeem key state
  const [key, setKey] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Crypto
  const [cryptoTier, setCryptoTier] = useState<'pro' | 'ultra' | null>(null);

  // Stripe
  const [stripePeriod, setStripePeriod] = useState<'monthly' | 'annual'>('monthly');
  const [stripeRedirecting, setStripeRedirecting] = useState(false);
  const [portalBusy, setPortalBusy] = useState(false);
  const [stripeEnabled, setStripeEnabled] = useState(false);

  useEffect(() => {
    void fetch('/api/config')
      .then((r) => r.json())
      .then((c: { stripeEnabled?: boolean }) => setStripeEnabled(Boolean(c?.stripeEnabled)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') handleClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  function handleClose() {
    setStep('select');
    setSelectedTier(null);
    setKey('');
    setMsg(null);
    onClose();
  }

  function handleSelectTier(tier: Tier) {
    if (tier === current) return;
    setSelectedTier(tier);
    setMsg(null);
    setStep('confirm');
  }

  function handleConfirm() {
    if (!selectedTier) return;
    const tierOrder: Record<Tier, number> = { free: 0, pro: 1, ultra: 2 };
    const isUpgrade = tierOrder[selectedTier] > tierOrder[current];
    if (isUpgrade) {
      setStep('payment');
    } else {
      // Downgrade: nothing to pay, just close (user manages via portal or support)
      setMsg({ ok: false, text: 'To downgrade, manage your subscription from the billing portal.' });
      setStep('select');
      setSelectedTier(null);
    }
  }

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
      setStep('select');
      setSelectedTier(null);
    } else {
      setMsg({ ok: false, text: t('tier.redeemInvalid') });
    }
  }

  if (!open) return null;

  const tierOrder: Record<Tier, number> = { free: 0, pro: 1, ultra: 2 };

  const plans: Array<{ tier: Tier; price: string; highlight: boolean }> = [
    { tier: 'free',  price: t('upgrade.free.price'),  highlight: false },
    { tier: 'pro',   price: t('upgrade.pro.price'),   highlight: true  },
    { tier: 'ultra', price: t('upgrade.ultra.price'), highlight: false },
  ];

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-label={t('upgrade.title')}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} aria-hidden="true" />

        <div className="paper-surface relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-rule p-6 sm:p-8">

          {/* Back button (shown in sub-steps) */}
          {step !== 'select' && (
            <button
              type="button"
              onClick={() => {
                if (step === 'payment' || step === 'confirm') { setStep('select'); setSelectedTier(null); }
                if (step === 'redeem') setStep('payment');
                setMsg(null);
              }}
              className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-md p-1.5 text-sm text-ink-faint transition-colors hover:bg-canvas-deep hover:text-ink"
            >
              <ChevronLeft /> Back
            </button>
          )}

          {/* Close */}
          <button
            type="button"
            onClick={handleClose}
            aria-label={t('upgrade.close')}
            className="absolute right-4 top-4 rounded-md p-1.5 text-ink-faint transition-colors hover:bg-canvas-deep hover:text-ink"
          >
            <svg viewBox="0 0 16 16" width="18" height="18" aria-hidden="true">
              <path fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>

          {/* Header */}
          <div className="flex flex-col items-center text-center">
            <BrandMark size={34} withWordmark />
            <h2 className="mt-4 font-serif text-xl font-semibold tracking-tight text-ink sm:text-2xl">
              {step === 'select'  && t('upgrade.title')}
              {step === 'confirm' && `Switch to ${selectedTier ? TIER_LABELS[selectedTier] : ''}?`}
              {step === 'payment' && 'Choose payment method'}
              {step === 'redeem'  && 'Redeem a key'}
            </h2>
            {step === 'select' && (
              <p className="mt-1 text-sm text-ink-soft">{t('upgrade.subtitle')}</p>
            )}
            {step === 'confirm' && selectedTier && (
              <p className="mt-1 text-sm text-ink-soft">
                {tierOrder[selectedTier] > tierOrder[current]
                  ? `Upgrade from ${TIER_LABELS[current]} to ${TIER_LABELS[selectedTier]}`
                  : `Downgrade from ${TIER_LABELS[current]} to ${TIER_LABELS[selectedTier]}`}
              </p>
            )}
          </div>

          {/* ── STEP: SELECT ── */}
          {step === 'select' && (
            <>
              <div className="mt-7 grid gap-4 sm:grid-cols-3">
                {plans.map(({ tier, price, highlight }) => {
                  const isCurrent = current === tier;
                  const isSelectable = tier !== current;
                  const features = [
                    t(`upgrade.${tier}.f1` as const),
                    t(`upgrade.${tier}.f2` as const),
                    t(`upgrade.${tier}.f3` as const),
                  ];
                  return (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => handleSelectTier(tier)}
                      disabled={isCurrent}
                      className={`relative flex flex-col rounded-xl border p-5 text-left transition-all ${
                        highlight
                          ? 'border-brand bg-brand-50/40'
                          : 'border-rule bg-canvas'
                      } ${
                        isSelectable
                          ? 'cursor-pointer hover:border-ink-soft hover:shadow-md'
                          : 'cursor-default opacity-80'
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
                            <Check /><span>{f}</span>
                          </li>
                        ))}
                      </ul>
                      {isSelectable && (
                        <span className={`mt-4 w-full rounded-md py-1.5 text-center text-xs font-medium ${
                          highlight ? 'bg-brand text-white' : 'bg-canvas-deep text-ink-soft'
                        }`}>
                          {tierOrder[tier] > tierOrder[current] ? 'Upgrade' : 'Downgrade'}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Manage existing subscription */}
              {(current === 'pro' || current === 'ultra') && stripeEnabled && (
                <p className="mt-4 text-center text-xs text-ink-soft">
                  {t('stripe.alreadySubscribed')}{' '}
                  <button
                    type="button"
                    onClick={() => { setPortalBusy(true); void openStripePortal().finally(() => setPortalBusy(false)); }}
                    disabled={portalBusy}
                    className="underline hover:text-ink"
                  >
                    {portalBusy ? '…' : t('stripe.manageSubscription')}
                  </button>
                </p>
              )}

              {msg && (
                <p className={`mt-4 text-center text-sm ${msg.ok ? 'text-success-400' : 'text-red-400'}`}>
                  {msg.text}
                </p>
              )}
            </>
          )}

          {/* ── STEP: CONFIRM ── */}
          {step === 'confirm' && selectedTier && (
            <div className="mt-8 flex flex-col items-center gap-4">
              <div className="rounded-xl border border-rule bg-canvas-deep p-5 text-center">
                <p className="text-sm text-ink-soft">You are currently on</p>
                <p className="mt-1 text-lg font-semibold text-ink">{TIER_LABELS[current]}</p>
                <div className="my-3 flex items-center justify-center gap-2 text-ink-faint">
                  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                    <path fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </div>
                <p className="text-sm text-ink-soft">You selected</p>
                <p className="mt-1 text-lg font-semibold text-brand">{TIER_LABELS[selectedTier]}</p>
              </div>
              <div className="flex w-full gap-3">
                <Button variant="ghost" onClick={() => { setStep('select'); setSelectedTier(null); }} className="flex-1">
                  Cancel
                </Button>
                <Button variant="solid" onClick={handleConfirm} className="flex-1">
                  {tierOrder[selectedTier] > tierOrder[current] ? 'Continue to payment' : 'Confirm downgrade'}
                </Button>
              </div>
            </div>
          )}

          {/* ── STEP: PAYMENT METHOD ── */}
          {step === 'payment' && selectedTier && selectedTier !== 'free' && (
            <div className="mt-8 space-y-3">
              {/* Redeem key */}
              <button
                type="button"
                onClick={() => setStep('redeem')}
                className="flex w-full items-center gap-4 rounded-xl border border-rule bg-canvas-deep p-4 text-left transition-colors hover:border-ink-soft hover:bg-canvas"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-canvas border border-rule text-xl">🔑</span>
                <div>
                  <p className="text-sm font-semibold text-ink">Redeem a key</p>
                  <p className="text-xs text-ink-soft">Enter a Pro or Ultra licence key</p>
                </div>
              </button>

              {/* Crypto */}
              <button
                type="button"
                onClick={() => { setCryptoTier(selectedTier as 'pro' | 'ultra'); }}
                className="flex w-full items-center gap-4 rounded-xl border border-rule bg-canvas-deep p-4 text-left transition-colors hover:border-ink-soft hover:bg-canvas"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-canvas border border-rule text-xl">₿</span>
                <div>
                  <p className="text-sm font-semibold text-ink">Pay with crypto</p>
                  <p className="text-xs text-ink-soft">ETH, BTC, SOL, USDT, USDC — non-custodial</p>
                </div>
              </button>

              {/* Stripe (card) */}
              {stripeEnabled && (
                <div className="rounded-xl border border-rule bg-canvas-deep p-4">
                  <div className="flex items-center gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-canvas border border-rule text-xl">💳</span>
                    <div>
                      <p className="text-sm font-semibold text-ink">Pay with card</p>
                      <p className="text-xs text-ink-soft">Monthly or annual, cancel anytime</p>
                    </div>
                  </div>
                  {/* Period toggle */}
                  <div className="mt-3 inline-flex rounded-md border border-rule bg-paper p-0.5">
                    {(['monthly', 'annual'] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setStripePeriod(p)}
                        className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                          stripePeriod === p ? 'bg-ink text-paper' : 'text-ink-soft hover:text-ink'
                        }`}
                      >
                        {t(`stripe.${p}`)}
                        {p === 'annual' && <span className="ml-1 text-[10px] text-brand">{t('stripe.annualSave')}</span>}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    disabled={stripeRedirecting}
                    onClick={() => {
                      setStripeRedirecting(true);
                      void startStripeCheckout(selectedTier as 'pro' | 'ultra', stripePeriod)
                        .catch(() => setStripeRedirecting(false));
                    }}
                    className="mt-3 w-full rounded-lg bg-brand py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                  >
                    {stripeRedirecting ? t('stripe.redirecting') : `Subscribe to ${TIER_LABELS[selectedTier]}`}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── STEP: REDEEM ── */}
          {step === 'redeem' && (
            <div className="mt-8">
              <p className="text-sm text-ink-soft">Enter your licence key to instantly unlock {selectedTier ? TIER_LABELS[selectedTier] : 'your plan'}.</p>
              <div className="mt-4 flex gap-2">
                <input
                  type="text"
                  value={key}
                  autoFocus
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
                <p className={`mt-2 text-xs ${msg.ok ? 'text-success-400' : 'text-red-400'}`}>{msg.text}</p>
              )}
            </div>
          )}

        </div>
      </div>

      {cryptoTier && (
        <CryptoPaymentModal
          tier={cryptoTier}
          open
          onClose={() => setCryptoTier(null)}
          onSuccess={(u) => {
            setSession(u);
            setCryptoTier(null);
            setMsg({ ok: true, text: t('pay.success', { tier: TIER_LABELS[u.tier] }) });
            setStep('select');
            setSelectedTier(null);
          }}
        />
      )}
    </>
  );
}
