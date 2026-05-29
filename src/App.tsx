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
import { useT } from './i18n/hooks';
import { loadSamplePreset, type SamplePreset } from './services/sampleLoader';

function isTestMode(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('test') === '1';
}

export default function App() {
  const briefSubmitted = useAppStore((s) => s.briefSubmitted);
  const openaiKey = useAppStore((s) => s.keys.openai);
  const t = useT();
  const [sample, setSample] = useState<SamplePreset | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void loadSamplePreset().then((p) => {
      if (!cancelled) setSample(p);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (isTestMode()) {
    return (
      <AuthGate>
        <TranslatorHarness />
        <SettingsDrawer />
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
            <button
              type="button"
              onClick={() => setUpgradeOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-ink/90"
            >
              <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true">
                <path fill="currentColor" d="M10 3l1.8 3.7L15.5 8.5 11.8 10.3 10 14l-1.8-3.7L4.5 8.5 8.2 6.7Z" />
              </svg>
              {t('nav.upgrade')}
            </button>
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

        <SettingsDrawer />
        <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
      </div>
    </AuthGate>
  );
}
