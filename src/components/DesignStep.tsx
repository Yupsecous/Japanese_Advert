import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppStore } from '../store';
import { generateDesign } from '../services/designService';
import { computeStepHash } from '../services/stepHash';
import { CacheRestorePill } from './CacheRestorePill';
import { InlineError } from './InlineError';
import { BackButton } from './BackButton';
import { ViewportFrame } from './ViewportFrame';
import { useT } from '../i18n/hooks';
import { buttonClass } from './ui/Button';
import {
  copyVariantsOf,
  designVariantsOf,
  imageVariantsOf,
  type DesignVariant,
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

type LoadOp = null | 'initial' | 'refine';

function newId(): string {
  return crypto.randomUUID();
}

function makeHistoryEntry(kind: RefineKind, direction: string | null): RefineEntry {
  return {
    id: newId(),
    kind,
    direction,
    variantCount: 1,
    timestamp: Date.now(),
  };
}

// Builds a self-contained HTML document that mounts the generated component
// into an iframe. Tailwind is loaded via the CDN script; React/Babel via
// unpkg so we can transform TSX on the fly. The iframe sandbox is
// `allow-scripts` only — no same-origin, so the generated code can't reach
// into our app's DOM, cookies, storage, or fetch our APIs with our keys.
function buildPreviewDocument(variant: DesignVariant): string {
  const componentName = variant.componentName || 'GeneratedComponent';
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Preview</title>
<script src="https://cdn.tailwindcss.com"></script>
<script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
<style>
  html, body { margin: 0; padding: 0; background: #fff; }
  #root { min-height: 100vh; }
  #boom {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    padding: 16px;
    background: #fef2f2;
    color: #991b1b;
    border-top: 1px solid #fecaca;
    white-space: pre-wrap;
    font-size: 12px;
  }
</style>
</head>
<body>
<div id="root"></div>
<div id="boom" hidden></div>
<script type="text/babel" data-presets="react,typescript">
try {
${variant.code}
const __root = ReactDOM.createRoot(document.getElementById('root'));
__root.render(React.createElement(${componentName}));
} catch (err) {
  const el = document.getElementById('boom');
  el.hidden = false;
  el.textContent = 'Preview failed to mount: ' + (err && err.message ? err.message : String(err));
}
</script>
</body>
</html>`;
}

function PreviewFrame({ variant }: { variant: DesignVariant }) {
  const srcDoc = useMemo(() => buildPreviewDocument(variant), [variant]);
  return (
    <ViewportFrame
      srcDoc={srcDoc}
      frameKey={variant.id}
      defaultViewport="desktop"
      title="Landing page preview"
    />
  );
}

function SkeletonPreview() {
  return (
    <div className="h-[720px] w-full animate-pulse rounded-lg border border-neutral-200 bg-gradient-to-b from-neutral-50 to-neutral-100" />
  );
}

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
              {h.kind === 'refine' && (
                <span>
                  {t('common.history.refined')}{' '}
                  <span className="font-medium text-neutral-900">
                    &ldquo;{(h.direction ?? '').slice(0, 240)}
                    {(h.direction ?? '').length > 240 ? '…' : ''}&rdquo;
                  </span>
                </span>
              )}
              {h.kind === 'cache-restore' && (
                <em className="not-italic text-neutral-500">{t('common.history.cacheRestore')}</em>
              )}
            </span>
          </li>
        ))}
      </ol>
    </details>
  );
}

export function DesignStep() {
  const brief = useAppStore((s) => s.brief);
  const apiKey = useAppStore((s) => s.keys.anthropic);
  const locale = useAppStore((s) => s.locale);
  const brand = useAppStore((s) => s.brand);
  const step = useAppStore((s) => s.steps.design);
  const copyStep = useAppStore((s) => s.steps.copy);
  const imageStep = useAppStore((s) => s.steps.image);
  const setStepStatus = useAppStore((s) => s.setStepStatus);
  const appendVariants = useAppStore((s) => s.appendVariants);
  const replaceVariants = useAppStore((s) => s.replaceVariants);
  const addHistoryEntry = useAppStore((s) => s.addHistoryEntry);
  const pickVariant = useAppStore((s) => s.pickVariant);
  const restoreFromCache = useAppStore((s) => s.restoreFromCache);
  const reopenStep = useAppStore((s) => s.reopenStep);
  const openDrawer = useAppStore((s) => s.openDrawer);
  const t = useT();

  const variants = designVariantsOf(step.variants);
  const current = variants[0];

  const [loading, setLoading] = useState<LoadOp>(null);
  const [errorState, setErrorState] = useState<{ op: LoadOp; error: unknown } | null>(null);
  const [refineText, setRefineText] = useState('');
  const [showCode, setShowCode] = useState(false);
  const initialAttemptedRef = useRef(false);

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
      const next = await generateDesign({
        apiKey,
        brief,
        approvedCopy,
        approvedImage,
        count: 1,
        locale,
        brand,
      });
      appendVariants('design', next);
      addHistoryEntry('design', makeHistoryEntry('initial', null));
      setStepStatus('design', 'options');
    } catch (err) {
      setErrorState({ op: 'initial', error: err });
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
    setStepStatus('design', 'refining');
    try {
      const next = await generateDesign({
        apiKey,
        brief,
        approvedCopy,
        approvedImage,
        refineDirection: direction,
        count: 1,
        locale,
        brand,
      });
      addHistoryEntry('design', makeHistoryEntry('refine', direction));
      replaceVariants('design', next);
      setStepStatus('design', 'options');
      setRefineText('');
    } catch (err) {
      setErrorState({ op: 'refine', error: err });
      setStepStatus('design', 'options');
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
      const hash = computeStepHash(useAppStore.getState(), 'design');
      if (restoreFromCache('design', hash)) return;
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
        <p className="font-medium">{t('design.missingTitle')}</p>
        <p className="mt-1">{t('design.missingBody')}</p>
      </section>
    );
  }

  const keyMissing = apiKey.trim().length === 0;
  const showSkeleton = (step.status === 'generating' || loading !== null) && !current;
  const restoredFromCache = isRestoredFromCache(step.history) && variants.length > 0;

  return (
    <section className="space-y-5">
      <div>
        <BackButton
          label={t('design.backToAudio')}
          onClick={() => reopenStep('audio')}
          disabled={loading !== null}
        />
      </div>
      <header className="flex items-baseline justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{t('design.heading')}</h2>
          <p className="mt-1 text-sm text-neutral-500">{t('design.subtitle')}</p>
        </div>
        <span className="text-xs uppercase tracking-wide text-neutral-500">{step.status}</span>
      </header>

      {keyMissing && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-medium">{t('design.keyMissingTitle')}</p>
          <p className="mt-1">{t('design.keyMissingBody')}</p>
          <button
            type="button"
            onClick={openDrawer}
            className="mt-3 rounded-md border border-amber-300 bg-white px-3 py-1.5 text-sm font-medium text-amber-800 hover:bg-amber-100"
          >
            {t('common.openSettings')}
          </button>
        </div>
      )}

      {errorState && (
        <InlineError
          error={errorState.error}
          onRetry={() => {
            if (errorState.op === 'initial') {
              initialAttemptedRef.current = false;
              void runInitial();
            }
            if (errorState.op === 'refine') void runRefine();
          }}
        />
      )}

      {restoredFromCache && <CacheRestorePill />}

      {showSkeleton ? (
        <SkeletonPreview />
      ) : current ? (
        <>
          <PreviewFrame variant={current} />
          {current.rationale && (
            <p className="rounded-md border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
              <span className="mr-2 text-xs font-medium uppercase tracking-wide text-neutral-500">
                {t('design.rationale')}
              </span>
              {current.rationale}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => pickVariant('design', 0)}
              disabled={step.status === 'approved'}
              className={buttonClass('solid')}
            >
              {step.status === 'approved' ? t('common.selected') : t('design.approve')}
            </button>
            <button
              type="button"
              onClick={() => setShowCode((v) => !v)}
              className={buttonClass('pill')}
            >
              {showCode ? t('design.hideCode') : t('design.showCode')}
            </button>
          </div>

          {showCode && (
            <pre className="max-h-[480px] overflow-auto rounded-md border border-neutral-200 bg-neutral-950 p-4 text-xs leading-relaxed text-neutral-100">
              <code>{current.code}</code>
            </pre>
          )}

          <div className="rounded-lg border border-neutral-200 bg-white p-4">
            <label htmlFor="design-refine" className="text-sm font-medium text-neutral-800">
              {t('common.refine')}
            </label>
            <p className="mt-1 text-xs text-neutral-500">{t('design.refineHint')}</p>
            <div className="mt-3 flex flex-col gap-3 md:flex-row">
              <textarea
                id="design-refine"
                rows={2}
                value={refineText}
                onChange={(e) => setRefineText(e.target.value)}
                placeholder={t('design.refinePlaceholder')}
                disabled={loading !== null}
                className="flex-1 resize-none rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900 disabled:bg-neutral-50"
              />
              <button
                type="button"
                onClick={runRefine}
                disabled={loading !== null || refineText.trim().length === 0 || keyMissing}
                className={`self-start ${buttonClass('solid')}`}
              >
                {loading === 'refine' ? t('common.refining') : t('common.refine')}
              </button>
            </div>
          </div>
        </>
      ) : null}

      <HistoryPanel history={step.history} />
    </section>
  );
}
