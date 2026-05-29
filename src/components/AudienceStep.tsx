import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../store';
import {
  generateIndividualBriefBatch,
  loadSampleAudience,
  type BatchProgress,
} from '../services/audienceService';
import { InlineError } from './InlineError';
import { AudienceConsole } from './AudienceConsole';
import { useT } from '../i18n/hooks';
import { buttonClass } from './ui/Button';
import type { Customer } from '../types';

// AudienceStep is STEP_ORDER[0] of the new 6-step pipeline. Optional: the
// user can either upload an audience + convert each customer to an
// individual brief (which Phase 2 BatchGenerator consumes), OR skip
// entirely and continue with the single campaign brief.

type Phase = 'idle' | 'converting' | 'ready' | 'error';

// Minimal CSV parser tolerant of quoted values and the column set we expect.
// We don't pull in a CSV library because the file format is small + we know
// the schema. The function returns `null` on any parse error so the UI
// surfaces a helpful message instead of dumping a stack trace.
function parseCsv(text: string): Customer[] | null {
  const lines = text.replace(/\r\n/g, '\n').split('\n').filter((l) => l.length > 0);
  if (lines.length < 2) return null;
  const headers = lines[0]!.split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  const idx = (name: string) => headers.indexOf(name);
  const required = [
    'id',
    'name',
    'age',
    'gender',
    'location',
    'segment',
    'recentInterest',
    'recentPurchase',
    'socialSignalSummary',
  ];
  for (const r of required) {
    if (idx(r) === -1) return null;
  }
  const out: Customer[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i]!);
    if (cells.length < headers.length) continue;
    const ageRaw = cells[idx('age')]!.trim();
    const age = Number.parseInt(ageRaw, 10);
    if (Number.isNaN(age)) continue;
    out.push({
      id: cells[idx('id')]!.trim(),
      name: cells[idx('name')]!.trim(),
      age,
      gender: normalizeGender(cells[idx('gender')]!.trim()),
      location: cells[idx('location')]!.trim(),
      segment: cells[idx('segment')]!.trim(),
      recentInterest: cells[idx('recentInterest')]!.trim(),
      recentPurchase: cells[idx('recentPurchase')]!.trim(),
      socialSignalSummary: cells[idx('socialSignalSummary')]!.trim(),
    });
  }
  return out;
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (c === ',' && !inQuotes) {
      out.push(current);
      current = '';
      continue;
    }
    current += c;
  }
  out.push(current);
  return out;
}

function normalizeGender(raw: string): Customer['gender'] {
  const v = raw.toLowerCase();
  if (v === 'female' || v === 'f') return 'female';
  if (v === 'male' || v === 'm') return 'male';
  if (v === 'nonbinary' || v === 'nb' || v === 'non-binary') return 'nonbinary';
  return 'unspecified';
}

function parseJson(text: string): Customer[] | null {
  try {
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) return null;
    return parsed
      .filter(
        (r) =>
          r &&
          typeof r === 'object' &&
          typeof r.id === 'string' &&
          typeof r.name === 'string' &&
          typeof r.age === 'number',
      )
      .map((r) => ({
        id: r.id,
        name: r.name,
        age: r.age,
        gender: normalizeGender(String(r.gender ?? '')),
        location: String(r.location ?? ''),
        segment: String(r.segment ?? ''),
        recentInterest: String(r.recentInterest ?? ''),
        recentPurchase: String(r.recentPurchase ?? ''),
        socialSignalSummary: String(r.socialSignalSummary ?? ''),
      }));
  } catch {
    return null;
  }
}

function CustomerCard({
  customer,
  briefSnippet,
  briefTone,
  briefFormat,
}: {
  customer: Customer;
  briefSnippet?: string;
  briefTone?: string;
  briefFormat?: string;
}) {
  const t = useT();
  return (
    <article className="flex flex-col gap-2 rounded-md border border-neutral-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-mono text-[10px] text-neutral-400">{customer.id}</span>
        <span className="text-[10px] uppercase tracking-wide text-neutral-500">
          {customer.age} · {customer.gender}
        </span>
      </div>
      <h4 className="text-sm font-semibold tracking-tight text-neutral-900">{customer.name}</h4>
      <p className="text-[11px] text-neutral-500">
        <span className="font-medium text-neutral-700">{customer.segment}</span> · {customer.location}
      </p>
      <p className="line-clamp-2 text-[11px] text-neutral-600">
        {customer.socialSignalSummary}
      </p>
      {briefSnippet && (
        <div className="mt-1 border-t border-neutral-100 pt-2">
          <p className="text-[10px] uppercase tracking-wide text-emerald-700">
            {t('audience.briefPreview')}
          </p>
          {briefTone && (
            <p className="mt-1 text-[11px]">
              <span className="text-neutral-500">{t('audience.cardTone')}: </span>
              <span className="text-neutral-800">{briefTone}</span>
            </p>
          )}
          {briefFormat && (
            <p className="text-[11px]">
              <span className="text-neutral-500">{t('audience.cardFormat')}: </span>
              <code className="rounded bg-neutral-100 px-1 font-mono text-[10px]">{briefFormat}</code>
            </p>
          )}
          {briefSnippet && (
            <p className="mt-1 line-clamp-2 text-[11px] text-neutral-600">
              <span className="text-neutral-500">{t('audience.cardRationale')}: </span>
              {briefSnippet}
            </p>
          )}
        </div>
      )}
    </article>
  );
}

export function AudienceStep() {
  const brief = useAppStore((s) => s.brief);
  const apiKey = useAppStore((s) => s.keys.anthropic);
  const locale = useAppStore((s) => s.locale);
  const brand = useAppStore((s) => s.brand);
  const customers = useAppStore((s) => s.customers);
  const briefCache = useAppStore((s) => s.briefCache);
  const setCustomers = useAppStore((s) => s.setCustomers);
  const clearCustomers = useAppStore((s) => s.clearCustomers);
  const setBriefCache = useAppStore((s) => s.setBriefCache);
  const approveStep = useAppStore((s) => s.approveStep);
  const openDrawer = useAppStore((s) => s.openDrawer);
  const t = useT();

  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState<unknown>(null);
  const [progress, setProgress] = useState<BatchProgress | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // If the user already has a populated brief cache from a previous session,
  // jump straight to 'ready' so the cards render with brief data.
  useEffect(() => {
    if (Object.keys(briefCache).length > 0 && phase === 'idle') {
      setPhase('ready');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleFileUpload(file: File) {
    setUploadError(null);
    const text = await file.text();
    let parsed: Customer[] | null = null;
    if (file.name.toLowerCase().endsWith('.json')) {
      parsed = parseJson(text);
    } else {
      parsed = parseCsv(text);
    }
    if (!parsed || parsed.length === 0) {
      setUploadError(t('audience.uploadError'));
      return;
    }
    setCustomers(parsed);
    setPhase('idle');
  }

  async function handleLoadSample() {
    setUploadError(null);
    const sample = await loadSampleAudience();
    if (!sample || sample.length === 0) {
      setUploadError(t('audience.uploadError'));
      return;
    }
    setCustomers(sample);
    setPhase('idle');
  }

  async function handleConvert() {
    if (customers.length === 0) return;
    if (!apiKey.trim()) {
      setError({ message: t('audience.keyMissingBody') });
      setPhase('error');
      return;
    }
    setError(null);
    setProgress({ completed: 0, total: customers.length, succeeded: 0, failed: 0, inFlight: 0 });
    setPhase('converting');
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const result = await generateIndividualBriefBatch({
        brief,
        customers,
        apiKey,
        locale,
        brand,
        signal: ctrl.signal,
        onProgress: (p) => setProgress(p),
      });
      setBriefCache(result.briefs);
      setPhase('ready');
    } catch (err) {
      setError(err);
      setPhase('error');
    } finally {
      abortRef.current = null;
    }
  }

  function handleSkip() {
    // Skip approves audience with no customer data — single-brief mode.
    approveStep('audience');
  }

  function handleApprove() {
    approveStep('audience');
  }

  function handleClear() {
    clearCustomers();
    setPhase('idle');
    setProgress(null);
  }

  const convertedCount = Object.keys(briefCache).length;
  const apiKeyMissing = apiKey.trim().length === 0;

  return (
    <section className="space-y-5">
      <header className="flex items-baseline justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{t('audience.heading')}</h2>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-neutral-500">
            {t('audience.subtitle')}
          </p>
        </div>
        <span className="text-xs uppercase tracking-wide text-neutral-500">
          {customers.length > 0
            ? t('audience.summary', { count: customers.length, s: customers.length === 1 ? '' : 's' })
            : t('audience.empty')}
        </span>
      </header>

      {apiKeyMissing && customers.length > 0 && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-medium">{t('audience.keyMissingTitle')}</p>
          <p className="mt-1">{t('audience.keyMissingBody')}</p>
          <button
            type="button"
            onClick={openDrawer}
            className="mt-3 rounded-md border border-amber-300 bg-white px-3 py-1.5 text-sm font-medium text-amber-800 hover:bg-amber-100"
          >
            {t('common.openSettings')}
          </button>
        </div>
      )}

      {phase === 'error' && <InlineError error={error} onRetry={handleConvert} />}

      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-md border border-neutral-200 bg-neutral-50 p-3">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.json,application/json,text/csv"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFileUpload(file);
            e.target.value = ''; // allow re-upload of same name
          }}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={buttonClass('pill', 'sm')}
        >
          {t('audience.uploadCta')}
        </button>
        <button
          type="button"
          onClick={() => void handleLoadSample()}
          className={buttonClass('pill', 'sm')}
        >
          {t('audience.loadSample')}
        </button>
        {customers.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className="rounded-md border border-neutral-200 bg-white px-3.5 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
          >
            {t('audience.clear')}
          </button>
        )}
        <span className="ml-auto text-xs text-neutral-500">{t('audience.uploadHint')}</span>
      </div>

      {uploadError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {uploadError}
        </div>
      )}

      {/* Conversion progress */}
      {phase === 'converting' && progress && (
        <div className="rounded-md border border-neutral-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-neutral-900">
              {t('audience.convertingProgress', {
                completed: progress.completed,
                total: progress.total,
              })}
            </p>
            <span className="text-xs text-neutral-500">
              {t('audience.convertingInFlight', { inFlight: progress.inFlight })}
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
            <div
              className="h-full bg-brand transition-all"
              style={{ width: `${Math.round((progress.completed / progress.total) * 100)}%` }}
            />
          </div>
          {progress.failed > 0 && (
            <p className="mt-1 text-xs text-amber-700">
              {t('audience.failed', { n: progress.failed, s: progress.failed === 1 ? '' : 's' })}
            </p>
          )}
        </div>
      )}

      {/* Convert / Approve actions */}
      {customers.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          {convertedCount === 0 && phase !== 'converting' && (
            <button
              type="button"
              onClick={handleConvert}
              disabled={apiKeyMissing}
              className={buttonClass('solid')}
            >
              {t('audience.convert')}
            </button>
          )}
          {convertedCount > 0 && (
            <>
              <button
                type="button"
                onClick={handleApprove}
                className={buttonClass('solid')}
              >
                {t('audience.approve')}
              </button>
              <span className="text-xs text-neutral-500">
                {t('audience.convertedCount', {
                  converted: convertedCount,
                  total: customers.length,
                })}
              </span>
            </>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleSkip}
          className="text-sm font-medium text-neutral-500 underline-offset-4 hover:text-neutral-900 hover:underline"
        >
          {t('audience.skip')}
        </button>
      </div>

      {/* Customer card grid */}
      {customers.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {customers.map((c) => {
            const ib = briefCache[c.id];
            return (
              <CustomerCard
                key={c.id}
                customer={c}
                {...(ib ? { briefSnippet: ib.rationale, briefTone: ib.tone, briefFormat: ib.recommendedFormat } : {})}
              />
            );
          })}
        </div>
      )}

      {/* Phase 2-5: full Audience Console — gates on briefCache being populated */}
      <AudienceConsole />
    </section>
  );
}
