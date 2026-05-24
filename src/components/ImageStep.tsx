import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../store';
import { llmService } from '../services/llmService';
import { critiqueImage } from '../services/critiqueService';
import { computeStepHash } from '../services/stepHash';
import { TIER_COST_USD } from '../services/fluxClient';
import { CacheRestorePill } from './CacheRestorePill';
import { InlineError } from './InlineError';
import { BackButton } from './BackButton';
import { useT } from '../i18n/hooks';
import {
  copyVariantsOf,
  imageVariantsOf,
  type Critique,
  type ImageVariant,
  type RefineEntry,
  type RefineKind,
} from '../types';

function isRestoredFromCache(history: RefineEntry[]): boolean {
  for (let i = history.length - 1; i >= 0; i--) {
    const h = history[i];
    if (!h) continue;
    if (h.kind === 'cache-restore') return true;
    if (
      h.kind === 'initial' ||
      h.kind === 'more' ||
      h.kind === 'refine' ||
      h.kind === 'critique-applied'
    )
      return false;
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

function SkeletonImage() {
  return (
    <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
      <div className="aspect-[4/5] animate-pulse bg-gradient-to-br from-neutral-100 to-neutral-200" />
      <div className="space-y-2 p-4">
        <div className="h-3 w-24 animate-pulse rounded bg-neutral-200" />
        <div className="h-7 w-28 animate-pulse rounded bg-neutral-200" />
      </div>
    </div>
  );
}

function CritiqueBlock({
  variantId,
  critique,
  loading,
  error,
  onLoad,
  onApply,
  onClose,
}: {
  variantId: string;
  critique: Critique | undefined;
  loading: boolean;
  error: string | null;
  onLoad: () => void;
  onApply: (text: string) => void;
  onClose: () => void;
}) {
  const t = useT();
  return (
    <div className="border-t border-neutral-200 bg-neutral-50 p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">
          {t('image.critiqueLabel')}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-neutral-500 hover:text-neutral-800"
        >
          {t('image.critiqueHide')}
        </button>
      </div>

      {loading && (
        <div className="mt-3 space-y-2">
          <div className="h-3 w-full animate-pulse rounded bg-neutral-200" />
          <div className="h-3 w-11/12 animate-pulse rounded bg-neutral-200" />
          <div className="h-3 w-9/12 animate-pulse rounded bg-neutral-200" />
        </div>
      )}

      {error && !loading && (
        <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <p className="font-medium">{t('image.critiqueFailed')}</p>
          <p className="mt-1">{error}</p>
          <button
            type="button"
            onClick={onLoad}
            className="mt-2 rounded-md border border-red-300 bg-white px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
          >
            {t('image.critiqueRetry')}
          </button>
        </div>
      )}

      {!loading && !error && critique && (
        <>
          <p className="mt-3 text-sm leading-relaxed text-neutral-800">{critique.text}</p>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => onApply(critique.text)}
              className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-dark"
            >
              {t('image.applyCritique')}
            </button>
            <span className="text-xs text-neutral-500">
              {t('image.critiqueAppliedTo')}{' '}
              <span className="font-mono">{variantId.slice(0, 6)}</span>.
            </span>
          </div>
        </>
      )}
    </div>
  );
}

function VariantCard({
  variant,
  index,
  total,
  isSelected,
  isRefining,
  critique,
  critiqueDisabled,
  critiqueDisabledReason,
  onPick,
  onCritiqueLoad,
  onApplyCritique,
  onRefine,
}: {
  variant: ImageVariant;
  index: number;
  total: number;
  isSelected: boolean;
  isRefining: boolean;
  critique: Critique | undefined;
  critiqueDisabled?: boolean;
  critiqueDisabledReason?: string;
  onPick: () => void;
  onCritiqueLoad: () => Promise<void>;
  onApplyCritique: (text: string) => void;
  onRefine: (direction: string) => void;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refineOpen, setRefineOpen] = useState(false);
  const [direction, setDirection] = useState('');

  function submitRefine(e: React.FormEvent) {
    e.preventDefault();
    const d = direction.trim();
    if (!d) return;
    onRefine(d);
    setDirection('');
    setRefineOpen(false);
  }

  async function run() {
    setLoading(true);
    setError(null);
    try {
      await onCritiqueLoad();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  function toggle() {
    if (!open) {
      setOpen(true);
      if (!critique && !loading) {
        void run();
      }
    } else {
      setOpen(false);
    }
  }

  return (
    <article
      className={`overflow-hidden rounded-lg border bg-white transition-colors ${
        isSelected ? 'border-emerald-400 ring-2 ring-emerald-200' : 'border-neutral-200'
      } ${isRefining ? 'opacity-60' : ''}`}
    >
      <div className="relative aspect-[4/5] bg-neutral-100">
        <img
          src={variant.imageUrl}
          alt={`Variant ${index + 1}`}
          className="h-full w-full object-cover"
          loading="lazy"
        />
        {isRefining && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm">
            <div className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 shadow-sm">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-brand" aria-hidden="true" />
              {t('refineOne.refining')}
            </div>
          </div>
        )}
      </div>
      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between text-xs text-neutral-500">
          <span>{t('common.optionOf', { n: index + 1, total })}</span>
          {isSelected && <span className="font-medium text-emerald-700">{t('common.selected')}</span>}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPick}
            disabled={isRefining}
            className="flex-1 rounded-md bg-brand px-3.5 py-1.5 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50"
          >
            {t('common.pickThis')}
          </button>
          <button
            type="button"
            onClick={toggle}
            disabled={(critiqueDisabled && !critique) || isRefining}
            title={critiqueDisabled && !critique ? critiqueDisabledReason : undefined}
            className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {open ? t('image.hideCritique') : critique ? t('image.showCritique') : t('image.critique')}
          </button>
        </div>
        <div className="border-t border-neutral-100 pt-3">
          {!refineOpen ? (
            <button
              type="button"
              onClick={() => setRefineOpen(true)}
              disabled={isRefining}
              className="text-xs font-medium text-neutral-500 underline-offset-4 hover:text-neutral-900 hover:underline disabled:opacity-50"
            >
              {t('refineOne.openImage')}
            </button>
          ) : (
            <form onSubmit={submitRefine} className="space-y-2">
              <textarea
                autoFocus
                value={direction}
                onChange={(e) => setDirection(e.target.value)}
                rows={2}
                placeholder={t('refineOne.placeholderImage')}
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
      </div>
      {open && (
        <CritiqueBlock
          variantId={variant.id}
          critique={critique}
          loading={loading}
          error={error}
          onLoad={run}
          onApply={onApplyCritique}
          onClose={() => setOpen(false)}
        />
      )}
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
              {h.kind === 'critique-applied' && (
                <span>
                  {t('common.history.critiqueApplied')}{' '}
                  <span className="font-medium text-neutral-900">
                    &ldquo;{(h.direction ?? '').slice(0, 160)}
                    {(h.direction ?? '').length > 160 ? '…' : ''}&rdquo;
                  </span>
                </span>
              )}
              {h.kind === 'cache-restore' && (
                <em className="not-italic text-neutral-500">{t('common.history.cacheRestore')}</em>
              )}
              {(h.kind === 'initial' ||
                h.kind === 'more' ||
                h.kind === 'refine' ||
                h.kind === 'critique-applied') && (
                <span className="ml-2 text-xs text-neutral-500">+{h.variantCount}</span>
              )}
            </span>
          </li>
        ))}
      </ol>
    </details>
  );
}

export function ImageStep() {
  const brief = useAppStore((s) => s.brief);
  const apiKeys = useAppStore((s) => s.keys);
  const locale = useAppStore((s) => s.locale);
  const brand = useAppStore((s) => s.brand);
  const imageQualityTier = useAppStore((s) => s.imageQualityTier);
  const step = useAppStore((s) => s.steps.image);
  const copyStep = useAppStore((s) => s.steps.copy);
  const setStepStatus = useAppStore((s) => s.setStepStatus);
  const appendVariants = useAppStore((s) => s.appendVariants);
  const replaceVariants = useAppStore((s) => s.replaceVariants);
  const addHistoryEntry = useAppStore((s) => s.addHistoryEntry);
  const setCritique = useAppStore((s) => s.setCritique);
  const pickVariant = useAppStore((s) => s.pickVariant);
  const restoreFromCache = useAppStore((s) => s.restoreFromCache);
  const reopenStep = useAppStore((s) => s.reopenStep);
  const openDrawer = useAppStore((s) => s.openDrawer);
  const t = useT();

  const variants = imageVariantsOf(step.variants);
  const replaceVariantById = useAppStore((s) => s.replaceVariantById);

  const [loading, setLoading] = useState<LoadOp>(null);
  const [errorState, setErrorState] = useState<{ op: LoadOp; error: unknown } | null>(null);
  const [refineText, setRefineText] = useState('');
  const [refiningIds, setRefiningIds] = useState<Set<string>>(new Set());
  const initialAttemptedRef = useRef(false);

  async function refineOneVariant(variant: ImageVariant, direction: string) {
    if (!approvedCopy) return;
    setErrorState(null);
    setRefiningIds((prev) => new Set(prev).add(variant.id));
    try {
      const next = await llmService.refineSingleImage({
        brief,
        approvedCopy,
        existingVariant: variant,
        refineDirection: direction,
        apiKeys: { openai: apiKeys.openai, fal: apiKeys.fal },
        locale,
        brand,
        tier: imageQualityTier,
      });
      replaceVariantById('image', variant.id, next);
      addHistoryEntry(
        'image',
        makeHistoryEntry('refine', `[per-variant] ${direction}`, 1),
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

  async function runInitial() {
    if (!approvedCopy) return;
    setErrorState(null);
    setLoading('initial');
    try {
      const next = await llmService.generateImages({
        brief,
        approvedCopy,
        count: 2,
        apiKeys: { openai: apiKeys.openai, fal: apiKeys.fal },
        locale,
        brand,
        tier: imageQualityTier,
      });
      appendVariants('image', next);
      addHistoryEntry('image', makeHistoryEntry('initial', null, next.length));
      setStepStatus('image', 'options');
    } catch (err) {
      setErrorState({ op: 'initial', error: err });
    } finally {
      setLoading(null);
    }
  }

  async function runMore() {
    if (!approvedCopy) return;
    setErrorState(null);
    setLoading('more');
    try {
      const next = await llmService.generateImages({
        brief,
        approvedCopy,
        previousVariants: variants,
        count: 2,
        apiKeys: { openai: apiKeys.openai, fal: apiKeys.fal },
        locale,
        brand,
        tier: imageQualityTier,
      });
      appendVariants('image', next);
      addHistoryEntry('image', makeHistoryEntry('more', null, next.length));
    } catch (err) {
      setErrorState({ op: 'more', error: err });
    } finally {
      setLoading(null);
    }
  }

  async function runRefine(
    directionText?: string,
    kind: 'refine' | 'critique-applied' = 'refine',
  ) {
    if (!approvedCopy) return;
    const direction = (directionText ?? refineText).trim();
    if (!direction) return;
    setErrorState(null);
    setLoading('refine');
    setStepStatus('image', 'refining');
    try {
      const next = await llmService.generateImages({
        brief,
        approvedCopy,
        previousVariants: variants,
        refineDirection: direction,
        count: 2,
        apiKeys: { openai: apiKeys.openai, fal: apiKeys.fal },
        locale,
        brand,
        tier: imageQualityTier,
      });
      addHistoryEntry('image', makeHistoryEntry(kind, direction, next.length));
      replaceVariants('image', next);
      setStepStatus('image', 'options');
      if (!directionText) setRefineText('');
    } catch (err) {
      setErrorState({ op: 'refine', error: err });
      setStepStatus('image', 'options');
    } finally {
      setLoading(null);
    }
  }

  async function loadCritique(variant: ImageVariant) {
    if (!approvedCopy) {
      throw new Error('Approved copy is missing. Re-open the copy step and pick a variant.');
    }
    const text = await critiqueImage({
      variant,
      approvedCopy,
      brief,
      apiKey: apiKeys.anthropic,
      locale,
      brand,
    });
    const c: Critique = {
      variantId: variant.id,
      text,
      createdAt: Date.now(),
    };
    setCritique('image', variant.id, c);
  }

  useEffect(() => {
    if (!approvedCopy) return;
    if (
      step.status === 'generating' &&
      variants.length === 0 &&
      !initialAttemptedRef.current &&
      loading === null
    ) {
      initialAttemptedRef.current = true;
      const hash = computeStepHash(useAppStore.getState(), 'image');
      if (restoreFromCache('image', hash)) return;
      void runInitial();
    }
    if (step.status !== 'generating') {
      initialAttemptedRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step.status, variants.length, approvedCopy?.id]);

  if (!approvedCopy) {
    return (
      <section className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        <p className="font-medium">{t('image.copyMissingTitle')}</p>
        <p className="mt-1">{t('image.copyMissingBody')}</p>
      </section>
    );
  }

  const openaiMissing = apiKeys.openai.trim().length === 0;
  const falMissing = apiKeys.fal.trim().length === 0;
  const anthropicMissing = apiKeys.anthropic.trim().length === 0;
  const keysMissing = openaiMissing || falMissing;
  const showInitialSkeleton =
    (step.status === 'generating' || loading === 'initial') && variants.length === 0;
  const showRefineSkeleton = loading === 'refine';
  const showingSkeletons = showInitialSkeleton || showRefineSkeleton;
  const restoredFromCache = isRestoredFromCache(step.history) && variants.length > 0;

  return (
    <section className="space-y-5">
      <div>
        <BackButton label={t('image.backToCopy')} onClick={() => reopenStep('copy')} disabled={loading !== null} />
      </div>
      <header className="flex items-baseline justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{t('image.heading')}</h2>
          <p className="mt-1 text-sm text-neutral-500">{t('image.subtitle')}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <button
            type="button"
            onClick={openDrawer}
            title={t('image.tierBadgeTooltip')}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] tabular-nums transition-colors ${
              imageQualityTier === 'realistic'
                ? 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                : imageQualityTier === 'balanced'
                  ? 'border-sky-300 bg-sky-50 text-sky-800 hover:bg-sky-100'
                  : 'border-neutral-300 bg-neutral-50 text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            {t(`image.tierBadge.${imageQualityTier}` as const)}
            <span className="opacity-70">·</span>
            <span>{TIER_COST_USD[imageQualityTier] < 0.01 ? '<$0.01' : `$${TIER_COST_USD[imageQualityTier].toFixed(2)}`}/img</span>
          </button>
          <span className="text-xs uppercase tracking-wide text-neutral-500">{step.status}</span>
        </div>
      </header>

      {keysMissing && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-medium">{t('image.keysMissingTitle')}</p>
          <p className="mt-1">{t('image.keysMissingBody')}</p>
          <button
            type="button"
            onClick={openDrawer}
            className="mt-3 rounded-md border border-amber-300 bg-white px-3 py-1.5 text-sm font-medium text-amber-800 hover:bg-amber-100"
          >
            {t('common.openSettings')}
          </button>
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
            <SkeletonImage />
            <SkeletonImage />
          </>
        ) : (
          variants.map((v, i) => (
            <VariantCard
              key={v.id}
              variant={v}
              index={i}
              total={variants.length}
              isSelected={step.selectedIndex === i}
              isRefining={refiningIds.has(v.id)}
              critique={step.critiques[v.id]}
              onPick={() => pickVariant('image', i)}
              onCritiqueLoad={() => loadCritique(v)}
              onApplyCritique={(text) => void runRefine(text, 'critique-applied')}
              onRefine={(direction) => void refineOneVariant(v, direction)}
              critiqueDisabled={anthropicMissing}
              critiqueDisabledReason={t('image.critiqueDisabled')}
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
              disabled={loading !== null || keysMissing}
              className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading === 'more' ? t('common.generating') : t('common.showMore')}
            </button>
            <span className="text-xs text-neutral-500">
              {t('common.variantsSoFar', { n: variants.length, s: variants.length === 1 ? '' : 's' })}
            </span>
            {anthropicMissing && (
              <span className="ml-auto text-xs text-amber-700">
                {t('image.anthropicMissing')}
              </span>
            )}
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white p-4">
            <label htmlFor="image-refine" className="text-sm font-medium text-neutral-800">
              {t('common.refine')}
            </label>
            <p className="mt-1 text-xs text-neutral-500">{t('common.refineDirection')}</p>
            <div className="mt-3 flex flex-col gap-3 md:flex-row">
              <textarea
                id="image-refine"
                rows={2}
                value={refineText}
                onChange={(e) => setRefineText(e.target.value)}
                placeholder={t('image.refinePlaceholder')}
                disabled={loading !== null}
                className="flex-1 resize-none rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900 disabled:bg-neutral-50"
              />
              <button
                type="button"
                onClick={() => void runRefine()}
                disabled={loading !== null || refineText.trim().length === 0 || keysMissing}
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
