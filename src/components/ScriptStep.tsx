import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../store';
import { llmService } from '../services/llmService';
import { computeStepHash } from '../services/stepHash';
import { VoicePicker } from './VoicePicker';
import { CacheRestorePill } from './CacheRestorePill';
import { InlineError } from './InlineError';
import { BackButton } from './BackButton';
import { useT } from '../i18n/hooks';
import { resolveVoice } from '../data/voiceLibrary';
import {
  copyVariantsOf,
  imageVariantsOf,
  scriptVariantsOf,
  type GenerationLogEntry,
  type RefineEntry,
  type RefineKind,
  type ScriptVariant,
  type VoicePickLogEntry,
} from '../types';

function isRestoredFromCache(history: RefineEntry[]): boolean {
  for (let i = history.length - 1; i >= 0; i--) {
    const h = history[i];
    if (!h) continue;
    if (h.kind === 'cache-restore') return true;
    if (h.kind === 'initial' || h.kind === 'more' || h.kind === 'refine') return false;
  }
  return false;
}

type LoadOp = null | 'initial' | 'more' | 'refine';

function newId(): string {
  return crypto.randomUUID();
}

function makeGenerationEntry(
  kind: RefineKind,
  direction: string | null,
  count: number,
): GenerationLogEntry {
  return {
    id: newId(),
    kind,
    direction,
    variantCount: count,
    timestamp: Date.now(),
  };
}

function makeVoicePickEntry(voiceId: string, voiceName: string): VoicePickLogEntry {
  return {
    id: newId(),
    kind: 'voice-pick',
    voiceId,
    voiceName,
    timestamp: Date.now(),
  };
}

function SkeletonScript() {
  return (
    <div className="space-y-3 rounded-lg border border-neutral-200 bg-white p-5">
      <div className="h-3 w-24 animate-pulse rounded bg-neutral-200" />
      <div className="space-y-2">
        <div className="h-3 w-full animate-pulse rounded bg-neutral-200" />
        <div className="h-3 w-11/12 animate-pulse rounded bg-neutral-200" />
        <div className="h-3 w-10/12 animate-pulse rounded bg-neutral-200" />
        <div className="h-3 w-8/12 animate-pulse rounded bg-neutral-200" />
        <div className="h-3 w-11/12 animate-pulse rounded bg-neutral-200" />
      </div>
      <div className="mt-3 h-7 w-28 animate-pulse rounded bg-neutral-200" />
    </div>
  );
}

function ScriptCard({
  variant,
  index,
  total,
  isSelected,
  isRefining,
  onPick,
  onRefine,
}: {
  variant: ScriptVariant;
  index: number;
  total: number;
  isSelected: boolean;
  isRefining: boolean;
  onPick: () => void;
  onRefine: (direction: string) => void;
}) {
  const t = useT();
  const [refineOpen, setRefineOpen] = useState(false);
  const [direction, setDirection] = useState('');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const d = direction.trim();
    if (!d) return;
    onRefine(d);
    setDirection('');
    setRefineOpen(false);
  }

  return (
    <article
      className={`flex flex-col rounded-lg border bg-white p-5 transition-colors ${
        isSelected ? 'border-emerald-400 ring-2 ring-emerald-200' : 'border-neutral-200'
      } ${isRefining ? 'opacity-60' : ''}`}
    >
      <div className="flex items-center justify-between text-xs text-neutral-500">
        <span>{t('common.optionOf', { n: index + 1, total })}</span>
        <span className="font-mono">{t('script.duration', { n: variant.durationEstimate })}</span>
      </div>
      <p className="mt-2 text-xs uppercase tracking-wide text-neutral-500">
        {variant.toneDescription}
      </p>
      <p className="mt-4 flex-1 whitespace-pre-wrap text-sm leading-relaxed text-neutral-800">
        {variant.script}
      </p>
      <div className="mt-5 flex items-center justify-between gap-3">
        {isSelected && <span className="text-xs font-medium text-emerald-700">{t('common.selected')}</span>}
        <button
          type="button"
          onClick={onPick}
          disabled={isRefining}
          className="ml-auto rounded-md bg-brand px-3.5 py-1.5 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50"
        >
          {t('common.pickThis')}
        </button>
      </div>
      <div className="mt-3 border-t border-neutral-100 pt-3">
        {!refineOpen ? (
          <button
            type="button"
            onClick={() => setRefineOpen(true)}
            disabled={isRefining}
            className="text-xs font-medium text-neutral-500 underline-offset-4 hover:text-neutral-900 hover:underline disabled:opacity-50"
          >
            {isRefining ? t('refineOne.refining') : t('refineOne.openScript')}
          </button>
        ) : (
          <form onSubmit={submit} className="space-y-2">
            <textarea
              autoFocus
              value={direction}
              onChange={(e) => setDirection(e.target.value)}
              rows={2}
              placeholder={t('refineOne.placeholderScript')}
              className="w-full resize-none rounded-md border border-neutral-300 px-2.5 py-2 text-xs outline-none focus:border-neutral-900"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setRefineOpen(false);
                  setDirection('');
                }}
                className="text-xs text-neutral-500 hover:text-neutral-900"
              >
                {t('refineOne.cancel')}
              </button>
              <button
                type="submit"
                disabled={direction.trim().length === 0}
                className="rounded-md bg-neutral-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
              >
                {t('refineOne.apply')}
              </button>
            </div>
          </form>
        )}
      </div>
    </article>
  );
}

// ErrorBanner replaced by shared <InlineError /> with plain-language strings.

function HistoryPanel({ history }: { history: RefineEntry[] }) {
  const t = useT();
  if (history.length === 0) return null;
  return (
    <details className="mt-6 rounded-md border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm">
      <summary className="cursor-pointer select-none font-medium text-neutral-700">
        {t('common.directionHistory', { n: history.length })}
      </summary>
      <ol className="mt-3 space-y-2">
        {history.map((h, i) => (
          <li key={h.id} className="flex gap-3 text-neutral-700">
            <span className="font-mono text-xs text-neutral-400">{i + 1}.</span>
            <span className="flex-1">
              {h.kind === 'initial' && (
                <em className="not-italic text-neutral-500">{t('common.history.initial')}</em>
              )}
              {h.kind === 'more' && (
                <em className="not-italic text-neutral-500">{t('common.history.more')}</em>
              )}
              {h.kind === 'refine' && (
                <span>
                  {t('common.history.refined')}{' '}
                  <span className="font-medium text-neutral-900">
                    &ldquo;{(h.direction ?? '').slice(0, 240)}
                    {(h.direction ?? '').length > 240 ? '…' : ''}&rdquo;
                  </span>
                </span>
              )}
              {h.kind === 'voice-pick' && (
                <span>
                  {t('common.history.voicePick')}{' '}
                  <span className="font-medium text-neutral-900">{h.voiceName}</span>
                </span>
              )}
              {h.kind === 'cache-restore' && (
                <em className="not-italic text-neutral-500">{t('common.history.cacheRestore')}</em>
              )}
              {(h.kind === 'initial' || h.kind === 'more' || h.kind === 'refine') && (
                <span className="ml-2 text-xs text-neutral-500">+{h.variantCount}</span>
              )}
            </span>
          </li>
        ))}
      </ol>
    </details>
  );
}

export function ScriptStep() {
  const brief = useAppStore((s) => s.brief);
  const apiKey = useAppStore((s) => s.keys.openai);
  const locale = useAppStore((s) => s.locale);
  const brand = useAppStore((s) => s.brand);
  const step = useAppStore((s) => s.steps.script);
  const copyStep = useAppStore((s) => s.steps.copy);
  const imageStep = useAppStore((s) => s.steps.image);
  const setStepStatus = useAppStore((s) => s.setStepStatus);
  const appendVariants = useAppStore((s) => s.appendVariants);
  const replaceVariants = useAppStore((s) => s.replaceVariants);
  const addHistoryEntry = useAppStore((s) => s.addHistoryEntry);
  const pickVariant = useAppStore((s) => s.pickVariant);
  const setVoiceId = useAppStore((s) => s.setVoiceId);
  const reopenStep = useAppStore((s) => s.reopenStep);
  const restoreFromCache = useAppStore((s) => s.restoreFromCache);
  const openDrawer = useAppStore((s) => s.openDrawer);
  const t = useT();

  const variants = scriptVariantsOf(step.variants);
  const replaceVariantById = useAppStore((s) => s.replaceVariantById);

  const [loading, setLoading] = useState<LoadOp>(null);
  const [errorState, setErrorState] = useState<{ op: LoadOp; error: unknown } | null>(null);
  const [refineText, setRefineText] = useState('');
  const [refiningIds, setRefiningIds] = useState<Set<string>>(new Set());
  const initialAttemptedRef = useRef(false);

  async function refineOneVariant(variant: ScriptVariant, direction: string) {
    if (!approvedCopy || !approvedImage) return;
    setErrorState(null);
    setRefiningIds((prev) => new Set(prev).add(variant.id));
    try {
      const next = await llmService.refineSingleScript({
        brief,
        approvedCopy,
        approvedImage,
        existingVariant: variant,
        refineDirection: direction,
        apiKey,
        locale,
        brand,
      });
      replaceVariantById('script', variant.id, next);
      addHistoryEntry(
        'script',
        makeGenerationEntry('refine', `[per-variant] ${direction}`, 1),
      );
    } catch (err) {
      setErrorState({ op: 'refine', error: err });
    } finally {
      setRefiningIds((prev) => {
        const n = new Set(prev);
        n.delete(variant.id);
        return n;
      });
    }
  }

  const approvedCopy =
    copyStep.selectedIndex !== null
      ? copyVariantsOf(copyStep.variants)[copyStep.selectedIndex]
      : undefined;
  const approvedImage =
    imageStep.selectedIndex !== null
      ? imageVariantsOf(imageStep.variants)[imageStep.selectedIndex]
      : undefined;

  async function runInitial() {
    if (!approvedCopy || !approvedImage) return;
    setErrorState(null);
    setLoading('initial');
    try {
      const next = await llmService.generateScript({
        brief,
        approvedCopy,
        approvedImage,
        count: 2,
        apiKey,
        locale,
        brand,
      });
      appendVariants('script', next);
      addHistoryEntry('script', makeGenerationEntry('initial', null, next.length));
      setStepStatus('script', 'options');
    } catch (err) {
      setErrorState({ op: 'initial', error: err });
    } finally {
      setLoading(null);
    }
  }

  async function runMore() {
    if (!approvedCopy || !approvedImage) return;
    setErrorState(null);
    setLoading('more');
    try {
      const next = await llmService.generateScript({
        brief,
        approvedCopy,
        approvedImage,
        previousVariants: variants,
        count: 2,
        apiKey,
        locale,
        brand,
      });
      appendVariants('script', next);
      addHistoryEntry('script', makeGenerationEntry('more', null, next.length));
    } catch (err) {
      setErrorState({ op: 'more', error: err });
    } finally {
      setLoading(null);
    }
  }

  async function runRefine() {
    if (!approvedCopy || !approvedImage) return;
    const direction = refineText.trim();
    if (!direction) return;
    setErrorState(null);
    setLoading('refine');
    setStepStatus('script', 'refining');
    try {
      const next = await llmService.generateScript({
        brief,
        approvedCopy,
        approvedImage,
        previousVariants: variants,
        refineDirection: direction,
        count: 2,
        apiKey,
        locale,
        brand,
      });
      addHistoryEntry('script', makeGenerationEntry('refine', direction, next.length));
      replaceVariants('script', next);
      setStepStatus('script', 'options');
      setRefineText('');
    } catch (err) {
      setErrorState({ op: 'refine', error: err });
      setStepStatus('script', 'options');
    } finally {
      setLoading(null);
    }
  }

  useEffect(() => {
    if (!approvedCopy || !approvedImage) return;
    if (
      step.status === 'generating' &&
      variants.length === 0 &&
      !initialAttemptedRef.current &&
      loading === null
    ) {
      initialAttemptedRef.current = true;
      const hash = computeStepHash(useAppStore.getState(), 'script');
      if (restoreFromCache('script', hash)) return;
      void runInitial();
    }
    if (step.status !== 'generating') {
      initialAttemptedRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step.status, variants.length, approvedCopy?.id, approvedImage?.id]);

  if (!approvedCopy || !approvedImage) {
    return (
      <section className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        <p className="font-medium">{t('script.missingTitle')}</p>
        <p className="mt-1">{t('script.missingBody')}</p>
      </section>
    );
  }

  const apiKeyMissing = apiKey.trim().length === 0;
  const showInitialSkeleton =
    (step.status === 'generating' || loading === 'initial') && variants.length === 0;
  const showRefineSkeleton = loading === 'refine';
  const showingSkeletons = showInitialSkeleton || showRefineSkeleton;
  const restoredFromCache = isRestoredFromCache(step.history) && variants.length > 0;

  // Phase B: script picked, voice not yet — show VoicePicker
  const scriptPicked = step.selectedIndex !== null;
  const phaseB = scriptPicked && variants.length > 0;

  function handleVoiceSelect(voiceId: string, voiceName: string) {
    setVoiceId('script', voiceId);
    addHistoryEntry('script', makeVoicePickEntry(voiceId, voiceName));
  }

  return (
    <section className="space-y-5">
      <div>
        <BackButton
          label={phaseB ? t('script.backToPicker') : t('script.backToImage')}
          onClick={() => (phaseB ? reopenStep('script') : reopenStep('image'))}
          disabled={loading !== null}
        />
      </div>
      <header className="flex items-baseline justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{t('script.heading')}</h2>
          <p className="mt-1 text-sm text-neutral-500">{t('script.subtitle')}</p>
        </div>
        <span className="text-xs uppercase tracking-wide text-neutral-500">{step.status}</span>
      </header>

      {apiKeyMissing && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-medium">{t('script.keyMissingTitle')}</p>
          <p className="mt-1">{t('script.keyMissingBody')}</p>
          <button
            type="button"
            onClick={openDrawer}
            className="mt-3 rounded-md border border-amber-300 bg-white px-3 py-1.5 text-sm font-medium text-amber-800 hover:bg-amber-100"
          >
            {t('common.openSettings')}
          </button>
        </div>
      )}

      {phaseB ? (
        <>
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-900">
            <span className="font-medium">{t('script.pickedStrong')}</span>{' '}
            {t('script.pickedRest')}
          </div>

          {step.selectedVoiceId && (
            <div className="rounded-md border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-700">
              {t('script.voiceLocked')}{' '}
              <span className="font-medium text-neutral-900">
                {resolveVoice(step.selectedVoiceId, step.history)?.displayName ?? step.selectedVoiceId}
              </span>
            </div>
          )}

          <VoicePicker
            onSelect={(v) => handleVoiceSelect(v.id, v.displayName)}
          />
        </>
      ) : (
        <>
          {errorState && errorState.op === 'initial' && (
            <InlineError
              error={errorState.error}
              onRetry={() => {
                initialAttemptedRef.current = false;
                void runInitial();
              }}
            />
          )}

          {restoredFromCache && <CacheRestorePill />}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {showingSkeletons ? (
              <>
                <SkeletonScript />
                <SkeletonScript />
              </>
            ) : (
              variants.map((v, i) => (
                <ScriptCard
                  key={v.id}
                  variant={v}
                  index={i}
                  total={variants.length}
                  isSelected={step.selectedIndex === i}
                  isRefining={refiningIds.has(v.id)}
                  onPick={() => pickVariant('script', i)}
                  onRefine={(direction) => void refineOneVariant(v, direction)}
                />
              ))
            )}
          </div>

          {variants.length > 0 && (
            <>
              {errorState && errorState.op !== 'initial' && (
                <InlineError
                  error={errorState.error}
                  onRetry={() => {
                    if (errorState.op === 'more') void runMore();
                    if (errorState.op === 'refine') void runRefine();
                  }}
                />
              )}

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={runMore}
                  disabled={loading !== null || apiKeyMissing}
                  className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading === 'more' ? t('common.generating') : t('common.showMore')}
                </button>
                <span className="text-xs text-neutral-500">
                  {t('common.variantsSoFar', { n: variants.length, s: variants.length === 1 ? '' : 's' })}
                </span>
              </div>

              <div className="rounded-lg border border-neutral-200 bg-white p-4">
                <label htmlFor="script-refine" className="text-sm font-medium text-neutral-800">
                  {t('common.refine')}
                </label>
                <p className="mt-1 text-xs text-neutral-500">{t('common.refineDirection')}</p>
                <div className="mt-3 flex flex-col gap-3 md:flex-row">
                  <textarea
                    id="script-refine"
                    rows={2}
                    value={refineText}
                    onChange={(e) => setRefineText(e.target.value)}
                    placeholder={t('script.refinePlaceholder')}
                    disabled={loading !== null}
                    className="flex-1 resize-none rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900 disabled:bg-neutral-50"
                  />
                  <button
                    type="button"
                    onClick={runRefine}
                    disabled={loading !== null || refineText.trim().length === 0 || apiKeyMissing}
                    className="self-start rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-ink-faint"
                  >
                    {loading === 'refine' ? t('common.refining') : t('common.refine')}
                  </button>
                </div>
              </div>
            </>
          )}
        </>
      )}

      <HistoryPanel history={step.history} />
    </section>
  );
}
