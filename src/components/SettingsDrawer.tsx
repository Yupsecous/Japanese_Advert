import { useEffect, useState } from 'react';
import { useAppStore } from '../store';
import { useT } from '../i18n/hooks';
import { authApi } from '../services/authApi';
import { TIER_LABELS } from '../tiers';
import { LOCALES, LOCALE_LABELS, LOCALE_SHORT_LABELS } from '../i18n';
import { BrandSettings } from './BrandSettings';
import { GenerationSettings } from './GenerationSettings';
import { Button } from './ui/Button';

type Section = 'account' | 'generation' | 'brand' | 'data';

function NavIcon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 20 20" width="17" height="17" aria-hidden="true" className="shrink-0">
      <path fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}
const SECTIONS: { id: Section; key: string; icon: string }[] = [
  { id: 'account', key: 'settings.navAccount', icon: 'M10 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM4 16.5c0-2.5 2.7-4 6-4s6 1.5 6 4' },
  { id: 'generation', key: 'settings.navGeneration', icon: 'M3 14l4-4 3 3 5-5 2 2M3 4.5h14v11H3z' },
  { id: 'brand', key: 'settings.navBrand', icon: 'M3.5 10.5 9 5h6v6l-5.5 5.5zM13 7h.01' },
  { id: 'data', key: 'settings.navData', icon: 'M10 3c3.3 0 6 1 6 2.3v9.4C16 16 13.3 17 10 17s-6-1-6-2.3V5.3C4 4 6.7 3 10 3ZM4 8c0 1.3 2.7 2.3 6 2.3S16 9.3 16 8' },
];

function Row({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5">
      <div className="min-w-0">
        <p className="text-sm text-ink">{label}</p>
        {sub && <p className="truncate text-xs text-ink-faint">{sub}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export function SettingsDrawer({ onUpgrade }: { onUpgrade?: () => void }) {
  const open = useAppStore((s) => s.drawerOpen);
  const closeDrawer = useAppStore((s) => s.closeDrawer);
  const user = useAppStore((s) => s.user);
  const setSession = useAppStore((s) => s.setSession);
  const resetBrief = useAppStore((s) => s.resetBrief);
  const resetSteps = useAppStore((s) => s.resetSteps);
  const resetAudience = useAppStore((s) => s.resetAudience);
  const locale = useAppStore((s) => s.locale);
  const setLocale = useAppStore((s) => s.setLocale);
  const t = useT();

  const [section, setSection] = useState<Section>('account');
  const [showLang, setShowLang] = useState(false);
  const [redeemKey, setRedeemKey] = useState('');
  const [redeemBusy, setRedeemBusy] = useState(false);
  const [redeemMsg, setRedeemMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeDrawer();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, closeDrawer]);

  async function redeem() {
    const key = redeemKey.trim();
    if (!key) return;
    setRedeemBusy(true);
    setRedeemMsg(null);
    const res = await authApi.redeem(key);
    setRedeemBusy(false);
    if (res.ok && res.data.user) {
      setSession(res.data.user);
      setRedeemKey('');
      setRedeemMsg({ ok: true, text: t('tier.redeemSuccess', { tier: TIER_LABELS[res.data.user.tier] }) });
    } else {
      setRedeemMsg({ ok: false, text: t('tier.redeemInvalid') });
    }
  }

  async function signOut() {
    await authApi.logout().catch(() => undefined);
    resetBrief();
    resetSteps();
    resetAudience();
    closeDrawer();
    setSession(null);
  }

  function newAd() {
    resetBrief();
    resetSteps();
    closeDrawer();
  }

  if (!open) return null;

  const tier = user?.tier ?? 'free';
  const name = user?.displayName?.trim() || user?.email || t('nav.account');
  const initial = (user?.displayName?.trim() || user?.email || '?').charAt(0).toUpperCase();

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={t('settings.title')}>
      <div className="absolute inset-0 bg-neutral-900/30 backdrop-blur-sm" onClick={closeDrawer} aria-hidden="true" />
      <div className="paper-surface relative z-10 flex h-[620px] max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-rule">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-rule px-6 py-4">
          <h2 className="font-serif text-lg font-semibold tracking-tight text-ink">{t('settings.title')}</h2>
          <button
            type="button"
            onClick={closeDrawer}
            aria-label={t('settings.close')}
            className="rounded-md p-1.5 text-ink-faint transition-colors hover:bg-canvas-deep hover:text-ink"
          >
            <svg viewBox="0 0 16 16" width="18" height="18" aria-hidden="true">
              <path fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </header>

        <div className="flex min-h-0 flex-1">
          {/* Left nav */}
          <nav className="w-44 shrink-0 space-y-0.5 border-r border-rule p-3">
            {SECTIONS.map((s) => {
              const active = section === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSection(s.id)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
                    active ? 'bg-canvas-deep font-medium text-ink' : 'text-ink-soft hover:bg-canvas-deep hover:text-ink'
                  }`}
                >
                  <NavIcon d={s.icon} />
                  <span>{t(s.key)}</span>
                </button>
              );
            })}
          </nav>

          {/* Content */}
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            {section === 'account' && (
              <div className="divide-y divide-rule">
                <div className="flex items-center justify-between gap-4 pb-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-semibold text-white">
                      {initial}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{name}</p>
                      {user?.email && <p className="truncate text-xs text-ink-faint">{user.email}</p>}
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                      tier === 'ultra'
                        ? 'border-violet-300 bg-violet-50 text-violet-700'
                        : tier === 'pro'
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                          : 'border-rule-strong bg-canvas-deep text-ink-soft'
                    }`}
                  >
                    {TIER_LABELS[tier]}
                  </span>
                </div>

                <Row label={t('upgrade.title')} sub={t('upgrade.cta')}>
                  <Button variant="pill" onClick={() => onUpgrade?.()}>
                    {t('nav.upgrade')}
                  </Button>
                </Row>

                <div className="py-3.5">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm text-ink">{t('upgrade.redeemTitle')}</p>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      value={redeemKey}
                      onChange={(e) => setRedeemKey(e.target.value)}
                      placeholder={t('tier.redeemPlaceholder')}
                      spellCheck={false}
                      onKeyDown={(e) => e.key === 'Enter' && void redeem()}
                      className="min-w-0 flex-1 rounded-lg border border-rule-strong bg-paper px-3 py-2 text-sm outline-none focus:border-brand"
                    />
                    <Button variant="solid" onClick={() => void redeem()} disabled={redeemBusy || redeemKey.trim().length === 0}>
                      {redeemBusy ? '…' : t('tier.redeemCta')}
                    </Button>
                  </div>
                  {redeemMsg && (
                    <p className={`mt-2 text-xs ${redeemMsg.ok ? 'text-success-700' : 'text-red-600'}`}>{redeemMsg.text}</p>
                  )}
                </div>

                <div className="py-3.5">
                  <Row label={t('app.language')} sub={LOCALE_LABELS[locale]}>
                    <Button variant="pill" onClick={() => setShowLang((v) => !v)}>
                      {t('settings.change')}
                    </Button>
                  </Row>
                  {showLang && (
                    <div className="mt-1 grid grid-cols-2 gap-1.5">
                      {LOCALES.map((code) => (
                        <button
                          key={code}
                          type="button"
                          onClick={() => {
                            setLocale(code);
                            setShowLang(false);
                          }}
                          className={`flex items-center justify-between rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                            code === locale
                              ? 'border-brand bg-brand-50/40 text-ink'
                              : 'border-rule text-ink-soft hover:bg-canvas-deep hover:text-ink'
                          }`}
                        >
                          <span>{LOCALE_LABELS[code]}</span>
                          <span className="text-xs uppercase opacity-60">{LOCALE_SHORT_LABELS[code]}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {section === 'generation' && <GenerationSettings />}
            {section === 'brand' && <BrandSettings />}

            {section === 'data' && (
              <div className="divide-y divide-rule">
                <Row label={t('nav.newAd')} sub={t('settings.newAdHint')}>
                  <Button variant="pill" onClick={newAd}>
                    {t('nav.newAd')}
                  </Button>
                </Row>
                <Row label={t('settings.signOut')} sub={user?.email ?? ''}>
                  <Button variant="danger" onClick={() => void signOut()}>
                    {t('settings.signOut')}
                  </Button>
                </Row>
              </div>
            )}
          </div>
        </div>

        {/* Footer: upsell banner + session id (Grok-style) */}
        <footer className="border-t border-rule px-6 py-4">
          {tier !== 'ultra' && (
            <div className="flex items-center justify-between gap-3 rounded-xl bg-gradient-to-r from-ink to-[#1b1f2a] px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-white">{t('upgrade.ultra.name')} · Personify Ads</p>
                <p className="truncate text-xs text-white/60">{t('upgrade.ultra.f1')} · {t('upgrade.ultra.f2')}</p>
              </div>
              <Button variant="light" onClick={() => onUpgrade?.()} className="shrink-0">
                {t('nav.upgrade')}
              </Button>
            </div>
          )}
          {user?.id && user.id !== 'public' && (
            <p className="mt-2 text-center font-mono text-[10px] text-ink-faint/60">{user.id}</p>
          )}
        </footer>
      </div>
    </div>
  );
}
