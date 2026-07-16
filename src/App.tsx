import { useEffect, useState } from 'react';
import { useAppStore } from './store';
import { Stepper } from './components/Stepper';
import { SettingsDrawer } from './components/SettingsDrawer';
import { BriefForm } from './components/BriefForm';
import { StepShell } from './components/StepShell';
import { OnboardingState } from './components/OnboardingState';
import { TranslatorHarness } from './components/TranslatorHarness';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { AuthGate } from './components/AuthGate';
import { Sidebar } from './components/Sidebar';
import { UpgradeModal } from './components/UpgradeModal';
import { AdminDashboard } from './components/AdminDashboard';
import { Button } from './components/ui/Button';
import { useProjectSync } from './services/useProjectSync';
import { useT } from './i18n/hooks';
import { loadSamplePreset, type SamplePreset } from './services/sampleLoader';
import { authApi } from './services/authApi';

function isTestMode(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('test') === '1';
}

export default function App() {
  const briefSubmitted = useAppStore((s) => s.briefSubmitted);
  const openaiKey = useAppStore((s) => s.keys.openai);
  const closeDrawer = useAppStore((s) => s.closeDrawer);
  const setSession = useAppStore((s) => s.setSession);
  const user = useAppStore((s) => s.user);
  const t = useT();
  useProjectSync();
  const [sample, setSample] = useState<SamplePreset | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [stripeMsg, setStripeMsg] = useState<string | null>(null);

  // Admin route: /admin shows the dashboard, nothing else.
  const isAdminRoute = window.location.pathname === '/admin';

  useEffect(() => {
    let cancelled = false;
    void loadSamplePreset().then((p) => {
      if (!cancelled) setSample(p);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Handle Stripe redirect-back: ?stripe=success|canceled
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const stripe = params.get('stripe');
    if (!stripe) return;
    // Clean the URL immediately so a reload doesn't re-trigger.
    window.history.replaceState({}, '', window.location.pathname);
    if (stripe === 'success') {
      // Re-fetch /me so the upgraded tier is reflected in the UI.
      void authApi.me().then((r) => {
        if (r.ok && r.data.user) setSession(r.data.user);
        setStripeMsg('Payment successful — your plan has been upgraded!');
        setTimeout(() => setStripeMsg(null), 6000);
      });
    } else if (stripe === 'canceled') {
      setStripeMsg('Checkout canceled — no charge was made.');
      setTimeout(() => setStripeMsg(null), 4000);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isTestMode()) {
    return (
      <AuthGate>
        <TranslatorHarness />
        <SettingsDrawer />
      </AuthGate>
    );
  }

  if (isAdminRoute) {
    return (
      <AuthGate>
        <AdminDashboard />
      </AuthGate>
    );
  }

  const hasOpenaiKey = openaiKey.trim().length > 0;
  const showOnboarding = !briefSubmitted && !hasOpenaiKey;

  return (
    <AuthGate>
      <div className="flex h-screen overflow-hidden bg-canvas">
        <Sidebar
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((v) => !v)}
          onUpgrade={() => setUpgradeOpen(true)}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top bar */}
          <header className="flex h-14 shrink-0 items-center justify-end gap-2 border-b border-rule bg-paper/80 px-4 backdrop-blur sm:px-6">
            <span
              title={t('nav.privateHint')}
              className="hidden items-center gap-1.5 rounded-full border border-rule px-2.5 py-1 text-xs text-ink-soft sm:inline-flex"
            >
              <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true" className="opacity-70">
                <path fill="none" stroke="currentColor" strokeWidth="1.3" d="M4.5 7V5.5a3.5 3.5 0 0 1 7 0V7M3.5 7h9v6h-9z" />
              </svg>
              {t('nav.private')}
            </span>
            <Button variant="dark" size="sm" onClick={() => setUpgradeOpen(true)} className="rounded-full">
              <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true">
                <path fill="currentColor" d="M10 3l1.8 3.7L15.5 8.5 11.8 10.3 10 14l-1.8-3.7L4.5 8.5 8.2 6.7Z" />
              </svg>
              {t('nav.upgrade')}
            </Button>
            <LanguageSwitcher />
          </header>

          {/* Main scroll area */}
          <main className="min-h-0 flex-1 overflow-y-auto">
            <div className="mx-auto max-w-[1180px] px-4 py-6 sm:px-8 sm:py-8">
              {!showOnboarding && (
                <div className="mb-6">
                  <Stepper />
                </div>
              )}
              {showOnboarding ? (
                <OnboardingState sample={sample} />
              ) : briefSubmitted ? (
                <StepShell />
              ) : (
                <BriefForm />
              )}
            </div>
          </main>
        </div>

        <SettingsDrawer
          onUpgrade={() => {
            closeDrawer();
            setUpgradeOpen(true);
          }}
        />
        <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />

        {/* Stripe redirect-back toast */}
        {stripeMsg && (
          <div className="fixed bottom-4 left-1/2 z-[100] -translate-x-1/2 rounded-xl border border-rule bg-paper px-5 py-3 text-sm shadow-lg">
            {stripeMsg}
          </div>
        )}

        {/* Admin link in sidebar (only for admin users) */}
        {user?.isAdmin && (
          <a
            href="/admin"
            className="fixed bottom-16 left-3 z-50 rounded-md border border-rule bg-paper px-2.5 py-1 text-[10px] font-medium text-ink-faint hover:text-ink"
          >
            Admin
          </a>
        )}
      </div>
    </AuthGate>
  );
}
