import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../store';
import { llmService } from '../services/llmService';
import { computeStepHash } from '../services/stepHash';
import { CacheRestorePill } from './CacheRestorePill';
import { InlineError } from './InlineError';
import { useT } from '../i18n/hooks';
import {
  copyVariantsOf,
  type CopyVariant,
  type RefineEntry,
  type RefineKind,
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

function makeHistoryEntry(kind: RefineKind, direction: string | null, count: number): RefineEntry {
  return {
    id: newId(),
    kind,
    direction,
    variantCount: count,
    timestamp: Date.now(),
  };
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-lg border border-neutral-200 bg-white p-5">
      <div className="h-3 w-24 rounded bg-neutral-200" />
      <div className="mt-4 space-y-2">
        <div className="h-4 w-5/6 rounded bg-neutral-200" />
        <div className="h-4 w-4/6 rounded bg-neutral-200" />
      </div>
      <div className="mt-5 space-y-2">
        <div className="h-3 w-full rounded bg-neutral-100" />
        <div className="h-3 w-11/12 rounded bg-neutral-100" />
        <div className="h-3 w-9/12 rounded bg-neutral-100" />
      </div>
      <div className="mt-5 h-7 w-28 rounded bg-neutral-200" />
    </div>
  );
}

function VariantCard({
  variant,
  index,
  total,
  isSelected,
  onPick,
}: {
  variant: CopyVariant;
  index: number;
  total: number;
  isSelected: boolean;
  onPick: () => void;
}) {
  const t = useT();
  return (
    <article
      className={`flex flex-col rounded-lg border bg-white p-5 transition-colors ${
        isSelected ? 'border-emerald-400 ring-2 ring-emerald-200' : 'border-neutral-200'
      }`}
    >
      <div className="flex items-center justify-between text-xs text-neutral-500">
        <span>{t('common.optionOf', { n: index + 1, total })}</span>
        {isSelected && <span className="font-medium text-emerald-700">{t('common.selected')}</span>}
      </div>
      <h3 className="mt-3 text-base font-semibold leading-snug text-neutral-900">
        {variant.headline}
      </h3>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-neutral-700">{variant.caption}</p>
      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="rounded-full border border-neutral-300 px-3 py-1 text-xs font-medium text-neutral-700">
          {variant.cta}
        </span>
        <button
          type="button"
          onClick={onPick}
          className="rounded-md bg-brand px-3.5 py-1.5 text-sm font-medium text-white hover:bg-brand-dark"
        >
          {t('common.pickThis')}
        </button>
      </div>
    </article>
  );
}

// ErrorBanner replaced by shared <InlineError /> with plain-language
// strings via humanize().

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
                  <span className="font-medium text-neutral-900">&ldquo;{h.direction}&rdquo;</span>
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

export function CopyStep() {
  const brief = useAppStore((s) => s.brief);
  const apiKey = useAppStore((s) => s.keys.openai);
  const anthropicKey = useAppStore((s) => s.keys.anthropic);
  const locale = useAppStore((s) => s.locale);
  const step = useAppStore((s) => s.steps.copy);
  const setStepStatus = useAppStore((s) => s.setStepStatus);
  const appendVariants = useAppStore((s) => s.appendVariants);
  const replaceVariants = useAppStore((s) => s.replaceVariants);
  const addHistoryEntry = useAppStore((s) => s.addHistoryEntry);
  const pickVariant = useAppStore((s) => s.pickVariant);
  const restoreFromCache = useAppStore((s) => s.restoreFromCache);
  const openDrawer = useAppStore((s) => s.openDrawer);
  const t = useT();

  const variants = copyVariantsOf(step.variants);

  const [loading, setLoading] = useState<LoadOp>(null);
  const [errorState, setErrorState] = useState<{ op: LoadOp; error: unknown } | null>(null);
  const [refineText, setRefineText] = useState('');
  const initialAttemptedRef = useRef(false);

  async function runInitial() {
    setErrorState(null);
    setLoading('initial');
    try {
      const next = await llmService.generateCopy({
        apiKeys: { openai: apiKey, anthropic: anthropicKey },
        brief,
        count: 2,
        locale,
      });
      appendVariants('copy', next);
      addHistoryEntry('copy', makeHistoryEntry('initial', null, next.length));
      setStepStatus('copy', 'options');
    } catch (err) {
      setErrorState({ op: 'initial', error: err });
    } finally {
      setLoading(null);
    }
  }

  async function runMore() {
    setErrorState(null);
    setLoading('more');
    try {
      const next = await llmService.generateCopy({
        apiKeys: { openai: apiKey, anthropic: anthropicKey },
        brief,
        previousVariants: variants,
        count: 2,
        locale,
      });
      appendVariants('copy', next);
      addHistoryEntry('copy', makeHistoryEntry('more', null, next.length));
    } catch (err) {
      setErrorState({ op: 'more', error: err });
    } finally {
      setLoading(null);
    }
  }

  async function runRefine() {
    const direction = refineText.trim();
    if (!direction) return;
    setErrorState(null);
    setLoading('refine');
    setStepStatus('copy', 'refining');
    try {
      const next = await llmService.generateCopy({
        apiKeys: { openai: apiKey, anthropic: anthropicKey },
        brief,
        previousVariants: variants,
        refineDirection: direction,
        count: 2,
        locale,
      });
      addHistoryEntry('copy', makeHistoryEntry('refine', direction, next.length));
      replaceVariants('copy', next);
      setStepStatus('copy', 'options');
      setRefineText('');
    } catch (err) {
      setErrorState({ op: 'refine', error: err });
      setStepStatus('copy', 'options');
    } finally {
      setLoading(null);
    }
  }

  useEffect(() => {
    if (
      step.status === 'generating' &&
      variants.length === 0 &&
      !initialAttemptedRef.current &&
      loading === null
    ) {
      initialAttemptedRef.current = true;
      const hash = computeStepHash(useAppStore.getState(), 'copy');
      if (restoreFromCache('copy', hash)) return;
      void runInitial();
    }
    if (step.status !== 'generating') {
      initialAttemptedRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step.status, variants.length]);

  const apiKeyMissing = apiKey.trim().length === 0;
  const showInitialSkeleton =
    (step.status === 'generating' || loading === 'initial') && variants.length === 0;
  const showRefineSkeleton = loading === 'refine';
  const showingSkeletons = showInitialSkeleton || showRefineSkeleton;
  const restoredFromCache = isRestoredFromCache(step.history) && variants.length > 0;

  return (
    <section className="space-y-5">
      <header className="flex items-baseline justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{t('copy.heading')}</h2>
          <p className="mt-1 text-sm text-neutral-500">{t('copy.subtitle')}</p>
        </div>
        <span className="text-xs uppercase tracking-wide text-neutral-500">{step.status}</span>
      </header>

      {apiKeyMissing && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-medium">{t('copy.keyMissingTitle')}</p>
          <p className="mt-1">{t('copy.keyMissingBody')}</p>
          <button
            type="button"
            onClick={openDrawer}
            className="mt-3 rounded-md border border-amber-300 bg-white px-3 py-1.5 text-sm font-medium text-amber-800 hover:bg-amber-100"
          >
            {t('common.openSettings')}
          </button>
        </div>
      )}

      {!apiKeyMissing && anthropicKey.trim().length === 0 && (
        <div className="rounded-md border border-neutral-200 bg-neutral-50 px-4 py-2 text-xs text-neutral-600">
          {t('copy.anthropicHint')}
        </div>
      )}

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
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          variants.map((v, i) => (
            <VariantCard
              key={v.id}
              variant={v}
              index={i}
              total={variants.length}
              isSelected={step.selectedIndex === i}
              onPick={() => pickVariant('copy', i)}
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
            <label htmlFor="refine-direction" className="text-sm font-medium text-neutral-800">
              {t('common.refine')}
            </label>
            <p className="mt-1 text-xs text-neutral-500">{t('common.refineDirection')}</p>
            <div className="mt-3 flex flex-col gap-3 md:flex-row">
              <textarea
                id="refine-direction"
                rows={2}
                value={refineText}
                onChange={(e) => setRefineText(e.target.value)}
                placeholder={t('copy.refinePlaceholder')}
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

      <HistoryPanel history={step.history} />
    </section>
  );
}
