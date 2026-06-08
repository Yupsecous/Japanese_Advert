import { useEffect, useMemo, useRef, useState } from 'react';
import { useT } from '../i18n/hooks';
import { TIER_LABELS } from '../tiers';
import { paymentsApi, type CryptoAsset, type CryptoOrder, type PaymentOptions } from '../services/paymentsApi';
import type { SessionUser } from '../services/authApi';
import { Button } from './ui/Button';
import { BrandMark } from './BrandMark';

// Non-custodial crypto checkout. The user picks a coin/network, we quote a
// concrete amount + receiving address, they pay from their own wallet, then
// paste the transaction hash. The backend verifies it on-chain and upgrades the
// tier. No processor, no wallet connection — just an address and a tx hash.

const ERR_KEY: Record<string, string> = {
  'payment/not-found': 'pay.err.notFound',
  'payment/unconfirmed': 'pay.err.unconfirmed',
  'payment/mismatch': 'pay.err.mismatch',
  'payment/tx-reused': 'pay.err.reused',
  'payment/expired': 'pay.err.expired',
  'payment/unsupported': 'pay.err.unsupported',
  'payment/price-unavailable': 'pay.err.price',
  'payment/disabled': 'pay.unavailable',
};

function two(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function CryptoPaymentModal({
  tier,
  open,
  onClose,
  onSuccess,
}: {
  tier: 'pro' | 'ultra';
  open: boolean;
  onClose: () => void;
  onSuccess: (user: SessionUser) => void;
}) {
  const t = useT();
  const [options, setOptions] = useState<PaymentOptions | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [order, setOrder] = useState<CryptoOrder | null>(null);
  const [txHash, setTxHash] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [nowTs, setNowTs] = useState(() => Date.now());
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset everything each time the modal is (re)opened, then load options.
  useEffect(() => {
    if (!open) return;
    setOptions(null);
    setLoadError(false);
    setOrder(null);
    setTxHash('');
    setBusy(false);
    setError(null);
    setCopied(false);
    let cancelled = false;
    void paymentsApi.options().then((res) => {
      if (cancelled) return;
      if (res.ok) setOptions(res.data);
      else setLoadError(true);
    });
    return () => {
      cancelled = true;
    };
  }, [open, tier]);

  // Esc to close.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Live countdown while a quote is shown.
  useEffect(() => {
    if (!open || !order) return;
    const id = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(id);
  }, [open, order]);

  const remainingMs = order ? new Date(order.expiresAt).getTime() - nowTs : 0;
  const expired = order != null && remainingMs <= 0;

  const countdown = useMemo(() => {
    if (!order) return '';
    const s = Math.max(0, Math.floor(remainingMs / 1000));
    return `${two(Math.floor(s / 60))}:${two(s % 60)}`;
  }, [order, remainingMs]);

  if (!open) return null;

  async function startOrder(asset: CryptoAsset) {
    setBusy(true);
    setError(null);
    const res = await paymentsApi.createOrder({ tier, chain: asset.chain, asset: asset.asset });
    setBusy(false);
    if (res.ok) {
      setOrder(res.data.order);
      setTxHash('');
    } else {
      setError(t(ERR_KEY[res.code] ?? 'pay.err.create'));
    }
  }

  async function verify() {
    if (!order) return;
    const h = txHash.trim();
    if (!h) return;
    setBusy(true);
    setError(null);
    const res = await paymentsApi.verify({ orderId: order.orderId, txHash: h });
    setBusy(false);
    if (res.ok && res.data.user) {
      onSuccess(res.data.user);
      return;
    }
    setError(res.ok ? t('pay.err.generic') : t(ERR_KEY[res.code] ?? 'pay.err.generic'));
  }

  function copyAddress() {
    if (!order) return;
    void navigator.clipboard?.writeText(order.address).then(() => {
      setCopied(true);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 1500);
    });
  }

  const tierLabel = TIER_LABELS[tier];

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t('pay.title')}
    >
      <div className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="paper-surface relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-rule p-6 sm:p-7">
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
          <BrandMark size={30} />
          <h2 className="mt-3 font-serif text-lg font-semibold tracking-tight text-ink sm:text-xl">
            {t('pay.title')}
          </h2>
          <p className="mt-1 text-sm text-ink-soft">{t('pay.subtitle', { tier: tierLabel })}</p>
        </div>

        {/* Choose coin/network */}
        {!order && (
          <div className="mt-6">
            {loadError || (options && !options.enabled) ? (
              <p className="rounded-xl border border-rule bg-canvas-deep p-4 text-center text-sm text-ink-soft">
                {t('pay.unavailable')}
              </p>
            ) : !options ? (
              <p className="py-6 text-center text-sm text-ink-faint">{t('pay.loading')}</p>
            ) : (
              <>
                <p className="text-sm font-medium text-ink">{t('pay.choose')}</p>
                <p className="mt-0.5 text-xs text-ink-soft">{t('pay.chooseHint')}</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {options.assets.map((a) => (
                    <button
                      key={`${a.chain}:${a.asset}`}
                      type="button"
                      disabled={busy}
                      onClick={() => void startOrder(a)}
                      className="flex items-center justify-between gap-2 rounded-lg border border-rule bg-paper px-3 py-2.5 text-left text-sm text-ink transition-colors hover:border-brand hover:bg-canvas-deep disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <span className="font-medium">{a.asset}</span>
                      <span className="text-xs text-ink-faint">{a.chainLabel}</span>
                    </button>
                  ))}
                </div>
                {options && (
                  <p className="mt-3 text-center text-xs text-ink-faint">
                    {t('pay.priceLine', {
                      tier: tierLabel,
                      usd: String(tier === 'pro' ? options.prices.pro : options.prices.ultra),
                    })}
                  </p>
                )}
              </>
            )}
            {error && <p className="mt-3 text-center text-xs text-red-600">{error}</p>}
          </div>
        )}

        {/* Pay + verify */}
        {order && (
          <div className="mt-6 space-y-4">
            <div className="rounded-xl border border-rule bg-canvas-deep p-4">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-xs uppercase tracking-wide text-ink-faint">{t('pay.amount')}</span>
                <span className="text-xs text-ink-faint">
                  {t('pay.network')}: {order.network}
                </span>
              </div>
              <p className="mt-1 font-mono text-lg font-semibold text-ink">
                {order.amount} {order.asset}
              </p>
              <p className="text-xs text-ink-soft">{t('pay.usdValue', { usd: order.amountUsd.toFixed(2) })}</p>

              <div className="mt-3">
                <span className="text-xs uppercase tracking-wide text-ink-faint">{t('pay.address')}</span>
                <div className="mt-1 flex items-stretch gap-2">
                  <code className="min-w-0 flex-1 break-all rounded-lg border border-rule-strong bg-paper px-3 py-2 text-xs text-ink">
                    {order.address}
                  </code>
                  <Button variant="pill" size="sm" onClick={copyAddress} className="shrink-0">
                    {copied ? t('pay.copied') : t('pay.copy')}
                  </Button>
                </div>
              </div>
            </div>

            <p className="text-xs leading-relaxed text-ink-soft">
              {t('pay.instructions', { network: order.network, tier: tierLabel })}
            </p>

            <div>
              <label className="text-sm font-medium text-ink">{t('pay.txHash')}</label>
              <input
                type="text"
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
                placeholder={t('pay.txHashPlaceholder')}
                spellCheck={false}
                onKeyDown={(e) => e.key === 'Enter' && !expired && void verify()}
                className="mt-1.5 w-full rounded-lg border border-rule-strong bg-paper px-3 py-2 font-mono text-xs outline-none focus:border-brand"
              />
            </div>

            {error && <p className="text-xs text-red-600">{error}</p>}

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setOrder(null);
                  setError(null);
                }}
                className="text-xs text-ink-faint underline-offset-2 hover:text-ink hover:underline"
              >
                {t('pay.back')}
              </button>
              <span className={`text-xs ${expired ? 'text-red-600' : 'text-ink-faint'}`}>
                {expired ? t('pay.err.expired') : t('pay.expiresIn', { time: countdown })}
              </span>
            </div>

            {expired ? (
              <Button
                variant="solid"
                onClick={() => {
                  setOrder(null);
                  setError(null);
                }}
                className="w-full"
              >
                {t('pay.newQuote')}
              </Button>
            ) : (
              <Button
                variant="solid"
                onClick={() => void verify()}
                disabled={busy || txHash.trim().length === 0}
                className="w-full"
              >
                {busy ? t('pay.verifying') : t('pay.verify')}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
