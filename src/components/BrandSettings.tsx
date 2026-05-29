import { useEffect, useState } from 'react';
import { useAppStore } from '../store';
import { useT } from '../i18n/hooks';
import { EMPTY_BRAND_DICTIONARY, isBrandDictionaryEmpty, type BrandDictionary } from '../types';
import { Button } from './ui/Button';

// Parses a newline-separated text field into a clean array (trimmed,
// deduplicated, non-empty).
function parseList(raw: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t) continue;
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out;
}

function joinList(items: string[]): string {
  return items.join('\n');
}

// Local form state, hydrated from the persisted brand on mount. Saving
// writes back to the store + localStorage. The form does NOT live-sync
// because that would feel jittery while typing a banned-terms list.
export function BrandSettings() {
  const brand = useAppStore((s) => s.brand);
  const setBrand = useAppStore((s) => s.setBrand);
  const clearBrand = useAppStore((s) => s.clearBrand);
  const t = useT();

  const [open, setOpen] = useState(() => !isBrandDictionaryEmpty(brand));
  const [draft, setDraft] = useState<{
    name: string;
    bannedRaw: string;
    preferredRaw: string;
    voiceCharacter: string;
    visualRules: string;
    audienceRefinement: string;
  }>(() => ({
    name: brand.name,
    bannedRaw: joinList(brand.bannedTerms),
    preferredRaw: joinList(brand.preferredTerms),
    voiceCharacter: brand.voiceCharacter,
    visualRules: brand.visualRules,
    audienceRefinement: brand.audienceRefinement,
  }));
  const [dirty, setDirty] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  // Keep the draft in sync if the brand is reset from elsewhere (e.g. Clear).
  useEffect(() => {
    if (!dirty) {
      setDraft({
        name: brand.name,
        bannedRaw: joinList(brand.bannedTerms),
        preferredRaw: joinList(brand.preferredTerms),
        voiceCharacter: brand.voiceCharacter,
        visualRules: brand.visualRules,
        audienceRefinement: brand.audienceRefinement,
      });
    }
  }, [brand, dirty]);

  function update<K extends keyof typeof draft>(key: K, value: string) {
    setDraft((d) => ({ ...d, [key]: value }));
    setDirty(true);
    setSavedFlash(false);
  }

  function save() {
    const next: BrandDictionary = {
      name: draft.name.trim(),
      bannedTerms: parseList(draft.bannedRaw),
      preferredTerms: parseList(draft.preferredRaw),
      voiceCharacter: draft.voiceCharacter.trim(),
      visualRules: draft.visualRules.trim(),
      audienceRefinement: draft.audienceRefinement.trim(),
      // learnedInsights are populated by the feedback loop, not the user.
      // Preserve any existing entries so editing the form doesn't wipe
      // accumulated learnings.
      learnedInsights: [...brand.learnedInsights],
    };
    setBrand(next);
    setDirty(false);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1800);
  }

  function reset() {
    clearBrand();
    setDraft({
      name: '',
      bannedRaw: '',
      preferredRaw: '',
      voiceCharacter: '',
      visualRules: '',
      audienceRefinement: '',
    });
    setDirty(false);
  }

  const active = !isBrandDictionaryEmpty(brand);
  const totalRules =
    brand.bannedTerms.length +
    brand.preferredTerms.length +
    (brand.voiceCharacter ? 1 : 0) +
    (brand.visualRules ? 1 : 0) +
    (brand.audienceRefinement ? 1 : 0);

  return (
    <section className="rounded-lg border border-neutral-200 bg-neutral-50">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-neutral-100"
        aria-expanded={open}
      >
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium text-neutral-900">{t('brandSettings.heading')}</span>
          {active && (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
              {t('brandSettings.active', { n: totalRules })}
            </span>
          )}
        </div>
        <span aria-hidden="true" className="text-xs text-neutral-500">
          {open ? '▾' : '▸'}
        </span>
      </button>

      {open && (
        <div className="space-y-4 border-t border-neutral-200 bg-white px-4 py-4">
          <p className="text-xs leading-relaxed text-neutral-500">{t('brandSettings.intro')}</p>

          <div className="space-y-1.5">
            <label htmlFor="brand-name" className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              {t('brandSettings.name')}
            </label>
            <input
              id="brand-name"
              type="text"
              value={draft.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder={t('brandSettings.namePlaceholder')}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="brand-voice" className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              {t('brandSettings.voice')}
            </label>
            <textarea
              id="brand-voice"
              value={draft.voiceCharacter}
              onChange={(e) => update('voiceCharacter', e.target.value)}
              placeholder={t('brandSettings.voicePlaceholder')}
              rows={3}
              className="w-full resize-none rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="brand-banned" className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              {t('brandSettings.banned')}
            </label>
            <textarea
              id="brand-banned"
              value={draft.bannedRaw}
              onChange={(e) => update('bannedRaw', e.target.value)}
              placeholder={t('brandSettings.bannedPlaceholder')}
              rows={3}
              className="w-full resize-none rounded-md border border-neutral-300 px-3 py-2 text-sm font-mono outline-none focus:border-neutral-900"
            />
            <p className="text-[11px] text-neutral-500">{t('brandSettings.bannedHint')}</p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="brand-preferred" className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              {t('brandSettings.preferred')}
            </label>
            <textarea
              id="brand-preferred"
              value={draft.preferredRaw}
              onChange={(e) => update('preferredRaw', e.target.value)}
              placeholder={t('brandSettings.preferredPlaceholder')}
              rows={3}
              className="w-full resize-none rounded-md border border-neutral-300 px-3 py-2 text-sm font-mono outline-none focus:border-neutral-900"
            />
            <p className="text-[11px] text-neutral-500">{t('brandSettings.preferredHint')}</p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="brand-visual" className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              {t('brandSettings.visualRules')}
            </label>
            <textarea
              id="brand-visual"
              value={draft.visualRules}
              onChange={(e) => update('visualRules', e.target.value)}
              placeholder={t('brandSettings.visualRulesPlaceholder')}
              rows={3}
              className="w-full resize-none rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="brand-audience" className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              {t('brandSettings.audience')}
            </label>
            <textarea
              id="brand-audience"
              value={draft.audienceRefinement}
              onChange={(e) => update('audienceRefinement', e.target.value)}
              placeholder={t('brandSettings.audiencePlaceholder')}
              rows={2}
              className="w-full resize-none rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-neutral-100 pt-3">
            <Button
              variant="pill"
              size="sm"
              onClick={reset}
              disabled={isBrandDictionaryEmpty({
                ...EMPTY_BRAND_DICTIONARY,
                name: draft.name,
                bannedTerms: parseList(draft.bannedRaw),
                preferredTerms: parseList(draft.preferredRaw),
                voiceCharacter: draft.voiceCharacter,
                visualRules: draft.visualRules,
                audienceRefinement: draft.audienceRefinement,
              }) && isBrandDictionaryEmpty(brand)}
            >
              {t('brandSettings.reset')}
            </Button>
            <div className="flex items-center gap-2">
              {savedFlash && (
                <span className="text-xs text-success-700">{t('brandSettings.saved')}</span>
              )}
              <Button variant="solid" onClick={save} disabled={!dirty}>
                {dirty ? t('brandSettings.save') : t('brandSettings.saved')}
              </Button>
            </div>
          </div>

          <p className="text-[10px] uppercase tracking-wide text-neutral-400">
            {t('brandSettings.persistenceNote')}
          </p>
        </div>
      )}
    </section>
  );
}
