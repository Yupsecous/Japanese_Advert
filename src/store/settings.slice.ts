import type { StateCreator } from 'zustand';
import type { ApiKeys, BrandDictionary, Provider, Validations } from '../types';
import { EMPTY_BRAND_DICTIONARY } from '../types';
import type { Locale } from '../i18n';
import { llmService } from '../services/llmService';

// Brand dictionary persists in localStorage (not sessionStorage). It's
// per-browser, not per-tab, and survives across sessions so a marketer can
// configure it once and reuse it for every campaign. API keys stay in
// sessionStorage by design — sensitive, tab-scoped.
const BRAND_STORAGE_KEY = 'demo-v2-brand';

function loadStoredBrand(): BrandDictionary {
  if (typeof window === 'undefined') return EMPTY_BRAND_DICTIONARY;
  try {
    const raw = window.localStorage.getItem(BRAND_STORAGE_KEY);
    if (!raw) return EMPTY_BRAND_DICTIONARY;
    const parsed = JSON.parse(raw) as Partial<BrandDictionary>;
    return {
      name: typeof parsed.name === 'string' ? parsed.name : '',
      bannedTerms: Array.isArray(parsed.bannedTerms) ? parsed.bannedTerms.filter((t) => typeof t === 'string') : [],
      preferredTerms: Array.isArray(parsed.preferredTerms) ? parsed.preferredTerms.filter((t) => typeof t === 'string') : [],
      voiceCharacter: typeof parsed.voiceCharacter === 'string' ? parsed.voiceCharacter : '',
      visualRules: typeof parsed.visualRules === 'string' ? parsed.visualRules : '',
      audienceRefinement: typeof parsed.audienceRefinement === 'string' ? parsed.audienceRefinement : '',
    };
  } catch {
    return EMPTY_BRAND_DICTIONARY;
  }
}

function persistBrand(brand: BrandDictionary): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(BRAND_STORAGE_KEY, JSON.stringify(brand));
  } catch {
    // Quota or denied — silent. Brand still works in-memory.
  }
}

export type SettingsSlice = {
  keys: ApiKeys;
  validations: Validations;
  drawerOpen: boolean;
  validating: boolean;
  locale: Locale;
  brand: BrandDictionary;
  // Session-scoped auth gate. Soft-gate only — the check runs client-side
  // and is bypassable by anyone reading the JS bundle. Used to keep the
  // demo URL behind a shared credential for prospect previews.
  authed: boolean;
  setKey: (provider: Provider, value: string) => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  validateAll: () => Promise<void>;
  clearKeys: () => void;
  setLocale: (locale: Locale) => void;
  setBrand: (brand: BrandDictionary) => void;
  clearBrand: () => void;
  setAuthed: (v: boolean) => void;
  signOut: () => void;
};

const emptyKeys: ApiKeys = { fal: '', eleven: '', openai: '', anthropic: '' };
const emptyValidations: Validations = {
  fal: 'unchecked',
  eleven: 'unchecked',
  openai: 'unchecked',
  anthropic: 'unchecked',
};

function defaultLocale(): Locale {
  if (typeof navigator === 'undefined') return 'en';
  const lang = (navigator.language || '').toLowerCase();
  if (lang.startsWith('ja')) return 'ja';
  if (lang.startsWith('pt')) return 'pt';
  if (lang.startsWith('es')) return 'es';
  if (lang.startsWith('fr')) return 'fr';
  if (lang.startsWith('de')) return 'de';
  return 'en';
}

export const createSettingsSlice: StateCreator<SettingsSlice, [], [], SettingsSlice> = (set, get) => ({
  keys: emptyKeys,
  validations: emptyValidations,
  drawerOpen: false,
  validating: false,
  locale: defaultLocale(),
  brand: loadStoredBrand(),
  authed: false,
  setKey: (provider, value) =>
    set((s) => ({
      keys: { ...s.keys, [provider]: value },
      validations: { ...s.validations, [provider]: 'unchecked' },
    })),
  openDrawer: () => set({ drawerOpen: true }),
  closeDrawer: () => set({ drawerOpen: false }),
  validateAll: async () => {
    const providers: Provider[] = ['fal', 'eleven', 'openai', 'anthropic'];
    set({
      validating: true,
      validations: providers.reduce<Validations>((acc, p) => {
        acc[p] = 'validating';
        return acc;
      }, { ...emptyValidations }),
    });
    const results = await llmService.validateAll(get().keys);
    set({
      validating: false,
      validations: {
        fal: results.fal.ok ? 'ok' : 'fail',
        eleven: results.eleven.ok ? 'ok' : 'fail',
        openai: results.openai.ok ? 'ok' : 'fail',
        anthropic: results.anthropic.ok ? 'ok' : 'fail',
      },
    });
  },
  clearKeys: () => set({ keys: emptyKeys, validations: emptyValidations }),
  setLocale: (locale) => set({ locale }),
  setBrand: (brand) => {
    persistBrand(brand);
    set({ brand });
  },
  clearBrand: () => {
    persistBrand(EMPTY_BRAND_DICTIONARY);
    set({ brand: EMPTY_BRAND_DICTIONARY });
  },
  setAuthed: (v) => set({ authed: v }),
  signOut: () => set({ authed: false, drawerOpen: false }),
});
