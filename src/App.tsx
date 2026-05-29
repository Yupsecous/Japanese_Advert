import { useEffect, useRef, useState } from 'react';
import { useAppStore } from './store';
import { Stepper } from './components/Stepper';
import { SettingsDrawer } from './components/SettingsDrawer';
import { BriefForm } from './components/BriefForm';
import { StepShell } from './components/StepShell';
import { OnboardingState } from './components/OnboardingState';
import { TranslatorHarness } from './components/TranslatorHarness';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { AuthGate } from './components/AuthGate';
import { useT } from './i18n/hooks';
import { loadSamplePreset, type SamplePreset } from './services/sampleLoader';
import { isBrandDictionaryEmpty } from './types';

function isTestMode(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('test') === '1';
}

export default function App() {
  const briefSubmitted = useAppStore((s) => s.briefSubmitted);
  const openaiKey = useAppStore((s) => s.keys.openai);
  const openDrawer = useAppStore((s) => s.openDrawer);
  const resetBrief = useAppStore((s) => s.resetBrief);
  const resetSteps = useAppStore((s) => s.resetSteps);
  const brand = useAppStore((s) => s.brand);
  const brandActive = !isBrandDictionaryEmpty(brand);
  const t = useT();
  const [sample, setSample] = useState<SamplePreset | null>(null);
  const autoOpenedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    void loadSamplePreset().then((p) => {
      if (!cancelled) setSample(p);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // First-time auto-open of Settings drawer when the page loads with no
  // OpenAI key configured. Delay 600ms so the welcome card is visible
  // first. One-shot per session — sessionStorage-persisted ref means a
  // user who closes the drawer and refreshes isn't re-pestered.
  useEffect(() => {
    if (autoOpenedRef.current) return;
    if (briefSubmitted) return;
    if (openaiKey.trim().length > 0) return;
    const flagKey = 'demo-v2-onboarding-shown';
    if (typeof window !== 'undefined' && window.sessionStorage.getItem(flagKey)) return;
    const t = setTimeout(() => {
      autoOpenedRef.current = true;
      if (typeof window !== 'undefined') window.sessionStorage.setItem(flagKey, '1');
      openDrawer();
    }, 600);
    return () => clearTimeout(t);
  }, [briefSubmitted, openaiKey, openDrawer]);

  const restart = () => {
    resetBrief();
    resetSteps();
  };

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
    <div className="min-h-full bg-white">
      <header className="border-b border-rule bg-paper/80 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-y-2 px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex min-w-0 items-baseline gap-2 sm:gap-3">
            <div className="h-2 w-2 shrink-0 rounded-full bg-accent" aria-hidden="true" />
            <p className="truncate font-serif text-base font-medium tracking-tight text-ink sm:text-lg">
              {t('app.title')}
            </p>
            <p className="hidden text-xs uppercase tracking-[0.18em] text-ink-faint sm:block">
              {t('app.version')}
            </p>
            {brandActive && (
              <button
                type="button"
                onClick={openDrawer}
                title={t('app.brandActiveTooltip')}
                className="hidden items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 transition-colors hover:bg-emerald-100 md:inline-flex"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                {brand.name.trim().length > 0
                  ? brand.name.trim().length > 18
                    ? brand.name.trim().slice(0, 18) + '…'
                    : brand.name.trim()
                  : t('app.brandActive')}
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            {briefSubmitted && (
              <button
                type="button"
                onClick={restart}
                className="rounded-md border border-rule px-2.5 py-1.5 text-xs text-ink-soft transition-colors hover:bg-canvas-deep hover:text-ink sm:px-3 sm:text-sm"
              >
                {t('app.newBrief')}
              </button>
            )}
            <button
              type="button"
              onClick={openDrawer}
              className="rounded-md border border-rule px-2.5 py-1.5 text-xs text-ink-soft transition-colors hover:bg-canvas-deep hover:text-ink sm:px-3 sm:text-sm"
            >
              {t('app.settings')}
            </button>
            <LanguageSwitcher />
          </div>
        </div>
        {!showOnboarding && (
          <div className="mx-auto max-w-[1600px] px-4 pb-4 sm:px-6">
            <Stepper />
          </div>
        )}
      </header>

      <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8">
        {showOnboarding ? (
          <OnboardingState sample={sample} />
        ) : briefSubmitted ? (
          <StepShell />
        ) : (
          <BriefForm />
        )}
      </main>

      <SettingsDrawer />
    </div>
    </AuthGate>
  );
}
