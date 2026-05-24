import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppStore } from '../store';
import {
  generateAssetsBatch,
  type BatchAssetProgress,
} from '../services/batchGeneratorService';
import {
  recommendChannels,
  simulateDelivery,
  type DeliveryStatus,
} from '../services/distributionService';
import {
  generateEffectiveness,
  computeKpiSummary,
  computeSegmentHeatmap,
  type HeatmapCell,
} from '../services/effectivenessService';
import { extractLearnedInsight } from '../services/feedbackService';
import { downloadCampaignReport, type ReportResult } from '../services/audienceReportService';
import { InlineError } from './InlineError';
import { useT } from '../i18n/hooks';
import type {
  Customer,
  DeliveryChannel,
  DeliveryRecord,
  GeneratedAssetSet,
} from '../types';

// ---------------------------------------------------------------------------
// Audience Console — Phase 2-5 stacked under AudienceStep.
//
// Each section gates on the previous one's data being present. The whole
// console is one scrollable page that the user walks through in the
// 5-minute demo scenario.
// ---------------------------------------------------------------------------

const BATCH_SIZE_OPTIONS = [10, 25, 50, 100];

const CHANNEL_LABELS: Record<DeliveryChannel, string> = {
  line: 'LINE',
  instagram_dm: 'Instagram DM',
  email: 'Email',
  web_push: 'Web Push',
};

const FORMAT_ORDER = ['text', 'image', 'video', 'voice'] as const;

export function AudienceConsole() {
  const customers = useAppStore((s) => s.customers);
  const briefCache = useAppStore((s) => s.briefCache);
  const generatedAssets = useAppStore((s) => s.generatedAssets);
  const deliveryLog = useAppStore((s) => s.deliveryLog);
  const effectivenessData = useAppStore((s) => s.effectivenessData);
  const learnedInsights = useAppStore((s) => s.learnedInsights);
  const runVersion = useAppStore((s) => s.runVersion);

  const setAssetForCustomer = useAppStore((s) => s.setAssetForCustomer);
  const clearGeneratedAssets = useAppStore((s) => s.clearGeneratedAssets);
  const appendDeliveryRecord = useAppStore((s) => s.appendDeliveryRecord);
  const clearDeliveryLog = useAppStore((s) => s.clearDeliveryLog);
  const setEffectivenessForCustomer = useAppStore((s) => s.setEffectivenessForCustomer);
  const clearEffectiveness = useAppStore((s) => s.clearEffectiveness);
  const appendLearnedInsight = useAppStore((s) => s.appendLearnedInsight);
  const bumpRunVersion = useAppStore((s) => s.bumpRunVersion);

  const brief = useAppStore((s) => s.brief);
  const apiKeys = useAppStore((s) => s.keys);
  const locale = useAppStore((s) => s.locale);
  const brand = useAppStore((s) => s.brand);
  const setBrand = useAppStore((s) => s.setBrand);
  const imageQualityTier = useAppStore((s) => s.imageQualityTier);

  if (Object.keys(briefCache).length === 0) {
    // Console is gated on individual briefs existing.
    return null;
  }

  return (
    <div className="space-y-8 border-t border-rule pt-8">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
          Audience Console
        </p>
        <h3 className="font-serif mt-2 text-2xl font-medium tracking-tight text-ink">
          Personalize, deliver, measure, learn
        </h3>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">
          Each section unlocks the next. Generate personalized assets for a slice of the audience,
          simulate delivery, inspect effectiveness, fold what worked back into the brand
          dictionary.
        </p>
        {runVersion > 0 && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" aria-hidden="true" />
            Learning v{runVersion} applied
          </div>
        )}
      </header>

      <BatchGeneratorPanel
        customers={customers}
        briefCache={briefCache}
        generatedAssets={generatedAssets}
        brief={brief}
        apiKeys={apiKeys}
        locale={locale}
        brand={brand}
        tier={imageQualityTier}
        onAsset={setAssetForCustomer}
        onClear={clearGeneratedAssets}
      />

      {Object.keys(generatedAssets).length > 0 && (
        <DistributionPanel
          customers={customers}
          briefCache={briefCache}
          generatedAssets={generatedAssets}
          deliveryLog={deliveryLog}
          anthropicKey={apiKeys.anthropic}
          onDeliveryRecord={appendDeliveryRecord}
          onClearLog={clearDeliveryLog}
        />
      )}

      {deliveryLog.length > 0 && (
        <EffectivenessDashboardPanel
          customers={customers}
          briefCache={briefCache}
          deliveryLog={deliveryLog}
          effectivenessData={effectivenessData}
          onWriteEffectiveness={setEffectivenessForCustomer}
          onClearEffectiveness={clearEffectiveness}
        />
      )}

      {Object.keys(effectivenessData).length > 0 && (
        <FeedbackLoopPanel
          customers={customers}
          deliveryLog={deliveryLog}
          effectivenessData={effectivenessData}
          learnedInsights={learnedInsights}
          anthropicKey={apiKeys.anthropic}
          locale={locale}
          // Report-export inputs:
          brief={brief}
          briefCache={briefCache}
          generatedAssets={generatedAssets}
          brand={brand}
          runVersion={runVersion}
          onInsight={(text) => {
            appendLearnedInsight(text);
            // Also push to the durable brand dictionary so all 8 generation
            // paths pick it up via brandPromptBlock.
            setBrand({ ...brand, learnedInsights: [...brand.learnedInsights, text] });
            bumpRunVersion();
          }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Phase 2 — Batch Generator
// ---------------------------------------------------------------------------

function BatchGeneratorPanel({
  customers,
  briefCache,
  generatedAssets,
  brief,
  apiKeys,
  locale,
  brand,
  tier,
  onAsset,
  onClear,
}: {
  customers: Customer[];
  briefCache: Record<string, any>;
  generatedAssets: Record<string, GeneratedAssetSet>;
  brief: ReturnType<typeof useAppStore.getState>['brief'];
  apiKeys: ReturnType<typeof useAppStore.getState>['keys'];
  locale: ReturnType<typeof useAppStore.getState>['locale'];
  brand: ReturnType<typeof useAppStore.getState>['brand'];
  tier: ReturnType<typeof useAppStore.getState>['imageQualityTier'];
  onAsset: (id: string, asset: GeneratedAssetSet) => void;
  onClear: () => void;
}) {
  const t = useT();
  const [batchSize, setBatchSize] = useState<number>(10);
  const [progress, setProgress] = useState<BatchAssetProgress | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [running, setRunning] = useState(false);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const customersWithBriefs = useMemo(
    () => customers.filter((c) => briefCache[c.id]),
    [customers, briefCache],
  );

  async function run() {
    if (customersWithBriefs.length === 0) return;
    setError(null);
    setRunning(true);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const slice = customersWithBriefs.slice(0, batchSize);
      await generateAssetsBatch({
        campaignBrief: brief,
        briefCache,
        customers: slice,
        apiKeys: {
          openai: apiKeys.openai,
          anthropic: apiKeys.anthropic,
          fal: apiKeys.fal,
        },
        locale,
        brand,
        tier,
        signal: ctrl.signal,
        onAsset: (asset) => onAsset(asset.customerId, asset),
        onProgress: setProgress,
      });
    } catch (err) {
      setError(err);
    } finally {
      setRunning(false);
      abortRef.current = null;
    }
  }

  function cancel() {
    abortRef.current?.abort();
  }

  const assetCount = Object.keys(generatedAssets).length;
  const apiMissing =
    apiKeys.openai.trim().length === 0 || apiKeys.anthropic.trim().length === 0 || apiKeys.fal.trim().length === 0;

  return (
    <section className="rounded-lg border border-rule bg-white p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h4 className="text-base font-semibold tracking-tight text-ink">{t('batch.heading')}</h4>
          <p className="mt-1 max-w-2xl text-sm text-ink-soft">{t('batch.subtitle')}</p>
        </div>
        {assetCount > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="rounded-md border border-neutral-200 px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
          >
            {t('batch.clear')}
          </button>
        )}
      </div>

      {error !== null && (
        <div className="mt-4">
          <InlineError error={error} onRetry={() => void run()} />
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-md border border-neutral-200 bg-neutral-50 p-3">
        <label className="text-xs font-medium uppercase tracking-wide text-neutral-500" htmlFor="batch-size">
          {t('batch.size')}
        </label>
        <select
          id="batch-size"
          value={batchSize}
          onChange={(e) => setBatchSize(Number(e.target.value))}
          disabled={running}
          className="rounded-md border border-neutral-300 bg-white px-2.5 py-1 text-sm"
        >
          {BATCH_SIZE_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <span className="text-xs text-neutral-500">
          {t('batch.eligible', { n: customersWithBriefs.length })}
        </span>
        {!running && (
          <button
            type="button"
            onClick={() => void run()}
            disabled={apiMissing || customersWithBriefs.length === 0}
            className="ml-auto rounded-md bg-brand px-4 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-ink-faint"
          >
            {t('batch.run', { n: Math.min(batchSize, customersWithBriefs.length) })}
          </button>
        )}
        {running && (
          <button
            type="button"
            onClick={cancel}
            className="ml-auto rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            {t('batch.cancel')}
          </button>
        )}
      </div>

      {progress && running && (
        <div className="mt-3 rounded-md border border-neutral-200 bg-white p-3">
          <div className="flex items-center justify-between text-sm">
            <p className="font-medium text-neutral-900">
              {t('batch.progress', { completed: progress.completed, total: progress.total })}
            </p>
            <span className="text-xs text-neutral-500">
              {t('batch.inFlight', { inFlight: progress.inFlight })}
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
            <div
              className="h-full bg-brand transition-all"
              style={{ width: `${Math.round((progress.completed / progress.total) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {assetCount > 0 && (
        <div className="mt-5">
          <p className="text-xs uppercase tracking-wide text-neutral-500">
            {t('batch.previewLabel', { n: assetCount })}
          </p>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Object.values(generatedAssets).map((asset) => {
              const customer = customers.find((c) => c.id === asset.customerId);
              return (
                <button
                  key={asset.customerId}
                  type="button"
                  onClick={() => setFocusedId(asset.customerId)}
                  className="flex flex-col gap-2 rounded-md border border-neutral-200 bg-white p-3 text-left shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex items-baseline justify-between">
                    <span className="font-mono text-[10px] text-neutral-400">{asset.customerId}</span>
                    {customer && (
                      <span className="text-[10px] text-neutral-500">
                        {customer.segment} · {customer.age}
                      </span>
                    )}
                  </div>
                  {asset.imageUrl && (
                    <div className="aspect-[4/5] overflow-hidden rounded border border-neutral-200 bg-neutral-100">
                      <img
                        src={asset.imageUrl}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <p className="line-clamp-2 text-sm font-semibold text-neutral-900">{asset.headline}</p>
                  <p className="line-clamp-2 text-[11px] text-neutral-600">{asset.caption}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {focusedId && <AssetDrillDown
        customerId={focusedId}
        customer={customers.find((c) => c.id === focusedId)}
        asset={generatedAssets[focusedId]}
        onClose={() => setFocusedId(null)}
      />}
    </section>
  );
}

function AssetDrillDown({
  customer,
  asset,
  onClose,
}: {
  customerId: string;
  customer?: Customer;
  asset?: GeneratedAssetSet;
  onClose: () => void;
}) {
  const t = useT();
  if (!asset || !customer) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-40 flex items-center justify-center bg-neutral-900/40 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-lg border border-rule bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-500">
              {customer.segment} · {customer.age} · {customer.location}
            </p>
            <h4 className="font-serif mt-1 text-xl font-medium tracking-tight text-ink">
              {customer.name}
            </h4>
            <p className="mt-1 text-xs text-neutral-500">{customer.socialSignalSummary}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-neutral-200 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50"
          >
            {t('common.openSettings').includes('Open') ? 'Close' : '閉じる'}
          </button>
        </div>
        <div className="mt-5 grid gap-5 md:grid-cols-[200px_1fr]">
          {asset.imageUrl ? (
            <div className="aspect-[4/5] overflow-hidden rounded-md border border-neutral-200 bg-neutral-100">
              <img src={asset.imageUrl} alt="" className="h-full w-full object-cover" />
            </div>
          ) : (
            <div className="aspect-[4/5] rounded-md border border-dashed border-neutral-200 bg-neutral-50" />
          )}
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-neutral-500">Headline</p>
              <p className="mt-1 font-semibold text-neutral-900">{asset.headline}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-neutral-500">Caption</p>
              <p className="mt-1 text-neutral-800">{asset.caption}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-neutral-500">CTA</p>
              <p className="mt-1">
                <span className="inline-flex rounded-full border border-neutral-300 px-3 py-1 text-xs font-medium text-neutral-700">
                  {asset.cta}
                </span>
              </p>
            </div>
            {asset.script && (
              <div>
                <p className="text-[10px] uppercase tracking-wide text-neutral-500">Script</p>
                <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-neutral-700">
                  {asset.script}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Phase 3 — Distribution
// ---------------------------------------------------------------------------

function DistributionPanel({
  customers,
  briefCache,
  generatedAssets,
  deliveryLog,
  anthropicKey,
  onDeliveryRecord,
  onClearLog,
}: {
  customers: Customer[];
  briefCache: Record<string, any>;
  generatedAssets: Record<string, GeneratedAssetSet>;
  deliveryLog: DeliveryRecord[];
  anthropicKey: string;
  onDeliveryRecord: (record: DeliveryRecord) => void;
  onClearLog: () => void;
}) {
  const t = useT();
  const [statusByCustomer, setStatusByCustomer] = useState<Record<string, DeliveryStatus>>({});
  const [channelMap, setChannelMap] = useState<Record<string, DeliveryChannel>>({});
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<unknown>(null);

  // Initialize delivered status from any prior delivery log.
  useEffect(() => {
    if (deliveryLog.length === 0) return;
    const initial: Record<string, DeliveryStatus> = {};
    for (const r of deliveryLog) initial[r.customerId] = 'delivered';
    setStatusByCustomer(initial);
  }, [deliveryLog]);

  const eligibleCustomers = customers.filter((c) => generatedAssets[c.id]);
  const deliveredCount = deliveryLog.length;

  async function runDistribute() {
    if (eligibleCustomers.length === 0) return;
    setError(null);
    setRunning(true);
    try {
      const channels = await recommendChannels({
        customers: eligibleCustomers,
        briefCache,
        apiKey: anthropicKey,
      });
      setChannelMap(channels);

      await simulateDelivery({
        customers: eligibleCustomers,
        channelMap: channels,
        generatedAssets,
        onStatus: (id, status) => {
          setStatusByCustomer((prev) => ({ ...prev, [id]: status }));
        },
        onRecord: (record) => {
          onDeliveryRecord(record);
        },
      });
    } catch (err) {
      setError(err);
    } finally {
      setRunning(false);
    }
  }

  function clearAll() {
    onClearLog();
    setStatusByCustomer({});
    setChannelMap({});
  }

  return (
    <section className="rounded-lg border border-rule bg-white p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h4 className="text-base font-semibold tracking-tight text-ink">{t('dist.heading')}</h4>
          <p className="mt-1 max-w-2xl text-sm text-ink-soft">{t('dist.subtitle')}</p>
        </div>
        {deliveredCount > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="rounded-md border border-neutral-200 px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
          >
            {t('dist.clear')}
          </button>
        )}
      </div>

      {error !== null && (
        <div className="mt-4">
          <InlineError error={error} onRetry={() => void runDistribute()} />
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void runDistribute()}
          disabled={running || eligibleCustomers.length === 0}
          className="rounded-md bg-brand px-4 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-ink-faint"
        >
          {running
            ? t('dist.running')
            : deliveredCount > 0
              ? t('dist.redeliver', { n: eligibleCustomers.length })
              : t('dist.start', { n: eligibleCustomers.length })}
        </button>
        {deliveredCount > 0 && (
          <span className="text-xs text-neutral-500">
            {t('dist.delivered', { delivered: deliveredCount, total: eligibleCustomers.length })}
          </span>
        )}
      </div>

      {eligibleCustomers.length > 0 && (
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {eligibleCustomers.map((c) => {
            const status = statusByCustomer[c.id];
            const channel = channelMap[c.id];
            return (
              <div
                key={c.id}
                className={`relative overflow-hidden rounded-md border bg-white p-2.5 text-xs shadow-sm transition-all ${
                  status === 'delivered'
                    ? 'border-emerald-300 bg-emerald-50'
                    : status === 'delivering'
                      ? 'border-amber-300 bg-amber-50'
                      : status === 'queued'
                        ? 'border-neutral-300 bg-neutral-50'
                        : 'border-neutral-200'
                }`}
              >
                <p className="truncate text-[10px] font-mono text-neutral-400">{c.id}</p>
                <p className="mt-0.5 truncate text-[11px] font-semibold text-neutral-900">{c.name}</p>
                <p className="mt-0.5 truncate text-[10px] text-neutral-500">{c.segment}</p>
                {channel && (
                  <p className="mt-1 truncate text-[10px] font-medium text-neutral-700">
                    {CHANNEL_LABELS[channel]}
                  </p>
                )}
                {status && (
                  <div
                    className={`absolute right-1 top-1 inline-flex h-2 w-2 rounded-full ${
                      status === 'delivered'
                        ? 'bg-emerald-500'
                        : status === 'delivering'
                          ? 'animate-pulse bg-amber-500'
                          : 'bg-neutral-400'
                    }`}
                    aria-label={status}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Phase 4 — Effectiveness Dashboard
// ---------------------------------------------------------------------------

type DashView = 'kpi' | 'heatmap' | 'drilldown';

function EffectivenessDashboardPanel({
  customers,
  briefCache,
  deliveryLog,
  effectivenessData,
  onWriteEffectiveness,
  onClearEffectiveness,
}: {
  customers: Customer[];
  briefCache: Record<string, any>;
  deliveryLog: DeliveryRecord[];
  effectivenessData: Record<string, import('../types').EffectivenessRecord>;
  onWriteEffectiveness: (id: string, rec: import('../types').EffectivenessRecord) => void;
  onClearEffectiveness: () => void;
}) {
  const t = useT();
  const [view, setView] = useState<DashView>('kpi');

  // Auto-generate effectiveness data on mount if it's missing.
  useEffect(() => {
    if (Object.keys(effectivenessData).length > 0) return;
    if (deliveryLog.length === 0) return;
    const generated = generateEffectiveness({
      deliveryLog,
      customers,
      briefCache,
    });
    for (const [id, rec] of Object.entries(generated)) {
      onWriteEffectiveness(id, rec);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deliveryLog.length]);

  const kpis = useMemo(() => computeKpiSummary(effectivenessData), [effectivenessData]);
  const heatmap = useMemo(
    () =>
      computeSegmentHeatmap({
        customers,
        deliveryLog,
        effectivenessData,
      }),
    [customers, deliveryLog, effectivenessData],
  );

  const hasData = Object.keys(effectivenessData).length > 0;

  return (
    <section className="rounded-lg border border-rule bg-white p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h4 className="text-base font-semibold tracking-tight text-ink">{t('dash.heading')}</h4>
          <p className="mt-1 max-w-2xl text-sm text-ink-soft">{t('dash.subtitle')}</p>
        </div>
        {hasData && (
          <button
            type="button"
            onClick={onClearEffectiveness}
            className="rounded-md border border-neutral-200 px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
          >
            {t('dash.regenerate')}
          </button>
        )}
      </div>

      {hasData && (
        <>
          <div className="mt-4 inline-flex rounded-md border border-neutral-200 bg-neutral-50 p-0.5">
            {(['kpi', 'heatmap', 'drilldown'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                  view === v ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                {t(`dash.view.${v}`)}
              </button>
            ))}
          </div>

          {view === 'kpi' && <KpiView kpis={kpis} />}
          {view === 'heatmap' && <HeatmapView heatmap={heatmap} />}
          {view === 'drilldown' && (
            <DrillDownView
              customers={customers}
              deliveryLog={deliveryLog}
              effectivenessData={effectivenessData}
            />
          )}
        </>
      )}
    </section>
  );
}

function KpiView({ kpis }: { kpis: ReturnType<typeof computeKpiSummary> }) {
  const t = useT();
  const stats: { label: string; value: string; sub?: string }[] = [
    {
      label: t('dash.kpi.delivered'),
      value: kpis.delivered.toString(),
    },
    {
      label: t('dash.kpi.openRate'),
      value: `${Math.round(kpis.openRate * 100)}%`,
      sub: `${kpis.opened} / ${kpis.delivered}`,
    },
    {
      label: t('dash.kpi.clickRate'),
      value: `${Math.round(kpis.clickRate * 100)}%`,
      sub: `${kpis.clicked} / ${kpis.delivered}`,
    },
    {
      label: t('dash.kpi.convertRate'),
      value: `${Math.round(kpis.convertRate * 100)}%`,
      sub: `${kpis.converted} / ${kpis.delivered}`,
    },
  ];
  return (
    <div className="mt-5 space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-md border border-neutral-200 bg-neutral-50 p-3">
            <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-500">
              {s.label}
            </p>
            <p className="mt-1 font-serif text-2xl font-medium tabular-nums text-ink">{s.value}</p>
            {s.sub && <p className="text-[10px] text-neutral-500">{s.sub}</p>}
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-white p-5">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-emerald-700">
          {t('dash.upliftEyebrow')}
        </p>
        <p className="font-serif mt-2 text-3xl font-medium tracking-tight text-ink sm:text-4xl">
          {t('dash.uplift', { pct: kpis.upliftPct >= 0 ? `+${Math.round(kpis.upliftPct)}` : `${Math.round(kpis.upliftPct)}` })}
        </p>
        <p className="mt-2 text-sm text-ink-soft">
          {t('dash.upliftBody', {
            personalized: `${Math.round(kpis.convertRate * 100)}%`,
            baseline: `${Math.round(kpis.baselineConvertRate * 100)}%`,
          })}
        </p>
      </div>
    </div>
  );
}

function HeatmapView({ heatmap }: { heatmap: HeatmapCell[] }) {
  const t = useT();
  const segments = Array.from(new Set(heatmap.map((c) => c.segment)));
  const formats = FORMAT_ORDER.filter((f) => heatmap.some((c) => c.format === f));

  // Color scale: cvr 0 → neutral, cvr 1 → vivid green. Cap at 0.6 for the
  // visible top end so the color range is readable.
  const cap = 0.6;
  function colorFor(cvr: number): string {
    const t01 = Math.max(0, Math.min(1, cvr / cap));
    // Light teal → deep teal
    const r = Math.round(245 - 195 * t01);
    const g = Math.round(252 - 92 * t01);
    const b = Math.round(245 - 110 * t01);
    return `rgb(${r}, ${g}, ${b})`;
  }

  function cell(segment: string, format: string): HeatmapCell | undefined {
    return heatmap.find((c) => c.segment === segment && c.format === format);
  }

  return (
    <div className="mt-5">
      <p className="text-xs text-neutral-500">{t('dash.heatmapNote')}</p>
      <div className="mt-3 overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-1 text-sm">
          <thead>
            <tr>
              <th className="px-2 py-1 text-left text-[11px] uppercase tracking-wide text-neutral-500">
                {t('dash.segment')}
              </th>
              {formats.map((f) => (
                <th
                  key={f}
                  className="px-2 py-1 text-center text-[11px] uppercase tracking-wide text-neutral-500"
                >
                  {f}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {segments.map((segment) => (
              <tr key={segment}>
                <td className="px-2 py-1 text-xs font-medium text-neutral-800">{segment}</td>
                {formats.map((f) => {
                  const c = cell(segment, f);
                  if (!c || c.delivered === 0) {
                    return (
                      <td
                        key={f}
                        className="rounded-md border border-neutral-100 bg-neutral-50 px-2 py-2 text-center text-[10px] text-neutral-400"
                      >
                        —
                      </td>
                    );
                  }
                  return (
                    <td
                      key={f}
                      className="rounded-md border border-neutral-200 px-2 py-2 text-center tabular-nums"
                      style={{ backgroundColor: colorFor(c.cvr) }}
                      title={`${segment} × ${f}: ${c.converted}/${c.delivered} converted`}
                    >
                      <p className="text-sm font-semibold text-ink">{Math.round(c.cvr * 100)}%</p>
                      <p className="text-[10px] text-neutral-500">{c.converted}/{c.delivered}</p>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DrillDownView({
  customers,
  deliveryLog,
  effectivenessData,
}: {
  customers: Customer[];
  deliveryLog: DeliveryRecord[];
  effectivenessData: Record<string, import('../types').EffectivenessRecord>;
}) {
  const t = useT();
  const byId = new Map(customers.map((c) => [c.id, c]));
  return (
    <div className="mt-5 max-h-96 overflow-y-auto rounded-md border border-neutral-200">
      <table className="min-w-full text-xs">
        <thead className="bg-neutral-50 text-[10px] uppercase tracking-wide text-neutral-500">
          <tr>
            <th className="px-3 py-2 text-left">{t('dash.drill.customer')}</th>
            <th className="px-3 py-2 text-left">{t('dash.drill.segment')}</th>
            <th className="px-3 py-2 text-left">{t('dash.drill.format')}</th>
            <th className="px-3 py-2 text-center">{t('dash.drill.opened')}</th>
            <th className="px-3 py-2 text-center">{t('dash.drill.clicked')}</th>
            <th className="px-3 py-2 text-center">{t('dash.drill.converted')}</th>
            <th className="px-3 py-2 text-left">{t('dash.drill.dropoff')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {deliveryLog.map((d) => {
            const c = byId.get(d.customerId);
            const eff = effectivenessData[d.customerId];
            if (!c || !eff) return null;
            return (
              <tr key={d.customerId} className={eff.converted ? 'bg-emerald-50/50' : ''}>
                <td className="px-3 py-2">
                  <p className="font-medium text-neutral-900">{c.name}</p>
                  <p className="font-mono text-[10px] text-neutral-400">{c.id}</p>
                </td>
                <td className="px-3 py-2 text-neutral-700">{c.segment}</td>
                <td className="px-3 py-2 text-neutral-700">{d.format}</td>
                <td className="px-3 py-2 text-center">{eff.opened ? '✓' : '—'}</td>
                <td className="px-3 py-2 text-center">{eff.clicked ? '✓' : '—'}</td>
                <td className="px-3 py-2 text-center font-semibold">
                  {eff.converted ? <span className="text-emerald-700">✓</span> : '—'}
                </td>
                <td className="px-3 py-2 text-[10px] text-neutral-500">
                  {eff.watchTimeSeconds !== null && <span>~{eff.watchTimeSeconds}s</span>}
                  {eff.dropOffPoint && <span className="ml-1">· {eff.dropOffPoint}</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Phase 5 — Feedback Loop
// ---------------------------------------------------------------------------

function FeedbackLoopPanel({
  customers,
  deliveryLog,
  effectivenessData,
  learnedInsights,
  anthropicKey,
  locale,
  brief,
  briefCache,
  generatedAssets,
  brand,
  runVersion,
  onInsight,
}: {
  customers: Customer[];
  deliveryLog: DeliveryRecord[];
  effectivenessData: Record<string, import('../types').EffectivenessRecord>;
  learnedInsights: string[];
  anthropicKey: string;
  locale: ReturnType<typeof useAppStore.getState>['locale'];
  brief: ReturnType<typeof useAppStore.getState>['brief'];
  briefCache: Record<string, any>;
  generatedAssets: Record<string, GeneratedAssetSet>;
  brand: ReturnType<typeof useAppStore.getState>['brand'];
  runVersion: number;
  onInsight: (text: string) => void;
}) {
  const t = useT();
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [downloading, setDownloading] = useState(false);
  const [reportResult, setReportResult] = useState<ReportResult | null>(null);

  async function run() {
    if (!anthropicKey.trim()) {
      setError({ message: t('feedback.keyMissing') });
      return;
    }
    setError(null);
    setRunning(true);
    try {
      const insight = await extractLearnedInsight({
        customers,
        deliveryLog,
        effectivenessData,
        apiKey: anthropicKey,
        locale,
      });
      onInsight(insight);
    } catch (err) {
      setError(err);
    } finally {
      setRunning(false);
    }
  }

  async function downloadReport() {
    setDownloading(true);
    try {
      const result = await downloadCampaignReport({
        brief,
        customers,
        briefCache,
        generatedAssets,
        deliveryLog,
        effectivenessData,
        learnedInsights,
        runVersion,
        brand,
      });
      setReportResult(result);
    } catch (err) {
      setError(err);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <section className="rounded-lg border border-rule bg-gradient-to-br from-emerald-50 via-white to-white p-6">
      <div>
        <h4 className="text-base font-semibold tracking-tight text-ink">{t('feedback.heading')}</h4>
        <p className="mt-1 max-w-2xl text-sm text-ink-soft">{t('feedback.subtitle')}</p>
      </div>

      {error !== null && (
        <div className="mt-4">
          <InlineError error={error} onRetry={() => void run()} />
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void run()}
          disabled={running}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:bg-neutral-400"
        >
          {running ? t('feedback.running') : t('feedback.run')}
        </button>
        <span className="text-xs text-neutral-500">{t('feedback.runNote')}</span>
      </div>

      {learnedInsights.length > 0 && (
        <div className="mt-5 space-y-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-emerald-700">
            {t('feedback.appliedLabel')}
          </p>
          {learnedInsights.map((insight, i) => (
            <div
              key={i}
              className="rounded-md border border-emerald-200 bg-white p-3 text-sm leading-relaxed text-neutral-800"
            >
              <p className="text-[10px] font-mono uppercase tracking-wide text-emerald-600">
                v{i + 1}
              </p>
              <p className="mt-1">{insight}</p>
            </div>
          ))}
        </div>
      )}

      {/* Campaign report download — closes the audience-console loop with
          a takeaway deliverable. Zero API cost; pure data export. */}
      <div className="mt-6 border-t border-emerald-100 pt-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="max-w-xl">
            <p className="text-sm font-medium text-neutral-900">{t('report.heading')}</p>
            <p className="mt-1 text-xs leading-relaxed text-neutral-600">{t('report.subtitle')}</p>
          </div>
          <button
            type="button"
            onClick={() => void downloadReport()}
            disabled={downloading}
            className="rounded-md border border-emerald-300 bg-white px-3.5 py-1.5 text-sm font-medium text-emerald-800 transition-colors hover:bg-emerald-50 disabled:opacity-50"
          >
            {downloading ? t('report.packaging') : t('report.download')}
          </button>
        </div>
        {reportResult && (
          <p className="mt-3 text-xs text-emerald-700">
            <span className="font-mono">{reportResult.filename}</span>
            {' · '}
            {t('report.fileCount', { n: reportResult.fileCount })}
          </p>
        )}
      </div>
    </section>
  );
}
