import { useAppStore } from '../store';
import { applySamplePreset, type SamplePreset } from '../services/sampleLoader';
import { useT } from '../i18n/hooks';

type Props = {
  sample: SamplePreset | null;
};

// Friendly first-impression card shown when no OpenAI key is configured.
// Replaces the brief form on cold load so a prospect doesn't land on a
// red error screen.

export function OnboardingState({ sample }: Props) {
  const openDrawer = useAppStore((s) => s.openDrawer);
  const t = useT();
  const heading = t('onboarding.heading');
  const headingParts = heading.split('\n');

  return (
    <section className="paper-surface rounded-xl border border-rule p-10 md:p-12">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
        {t('onboarding.eyebrow')}
      </p>
      <h1 className="font-serif mt-4 text-4xl font-medium leading-[1.1] tracking-tight text-ink md:text-5xl">
        {headingParts.map((line, i) => (
          <span key={i}>
            {line}
            {i < headingParts.length - 1 && <br />}
          </span>
        ))}
      </h1>
      <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-soft">
        {t('onboarding.body')}
      </p>

      <dl className="mt-8 max-w-xl divide-y divide-rule border-y border-rule">
        <div className="grid grid-cols-[120px_1fr] items-baseline gap-4 py-3">
          <dt className="font-serif text-sm font-medium text-ink">OpenAI</dt>
          <dd className="text-sm text-ink-soft">{t('onboarding.providers.openai')}</dd>
        </div>
        <div className="grid grid-cols-[120px_1fr] items-baseline gap-4 py-3">
          <dt className="font-serif text-sm font-medium text-ink">fal.ai</dt>
          <dd className="text-sm text-ink-soft">{t('onboarding.providers.fal')}</dd>
        </div>
        <div className="grid grid-cols-[120px_1fr] items-baseline gap-4 py-3">
          <dt className="font-serif text-sm font-medium text-ink">ElevenLabs</dt>
          <dd className="text-sm text-ink-soft">{t('onboarding.providers.eleven')}</dd>
        </div>
        <div className="grid grid-cols-[120px_1fr] items-baseline gap-4 py-3">
          <dt className="font-serif text-sm font-medium text-ink">Anthropic</dt>
          <dd className="text-sm text-ink-soft">{t('onboarding.providers.anthropic')}</dd>
        </div>
      </dl>

      <p className="mt-6 max-w-xl text-xs leading-relaxed text-ink-faint">
        {t('onboarding.keysNote')}
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={openDrawer}
          className="rounded-md bg-brand px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-dark"
        >
          {t('onboarding.openSettings')}
        </button>
        {sample && (
          <button
            type="button"
            onClick={() => applySamplePreset(sample)}
            className="rounded-md border border-rule-strong bg-paper px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-canvas-deep"
          >
            {t('onboarding.sampleBrief')}
          </button>
        )}
      </div>
    </section>
  );
}
