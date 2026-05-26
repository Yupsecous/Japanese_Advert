import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setToken } from '../services/backend';
import type {
  Brief,
  CopyVariant,
  ImageQualityTier,
  ImageVariant,
  ScriptVariant,
} from '@advert/shared';

// Slimmed-down store for v1. Web app's slices will port over in
// subsequent sessions; for now only what auth + brief + copy + image
// touch.

const TOKEN_KEY = 'advert.token';
const TIER_KEY = 'advert.imageQualityTier';

export type AppState = {
  // Auth
  token: string | null;
  authed: boolean;
  hydrating: boolean;
  setAuth: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
  hydrate: () => Promise<void>;

  // Brief
  brief: Brief;
  setBrief: (b: Brief) => void;
  resetBrief: () => void;

  // Copy step
  copyVariants: CopyVariant[];
  copyIndex: number | null;
  setCopyVariants: (v: CopyVariant[]) => void;
  appendCopyVariants: (v: CopyVariant[]) => void;
  pickCopy: (index: number) => void;
  resetCopy: () => void;

  // Image step
  imageVariants: ImageVariant[];
  imageIndex: number | null;
  setImageVariants: (v: ImageVariant[]) => void;
  appendImageVariants: (v: ImageVariant[]) => void;
  pickImage: (index: number) => void;
  resetImage: () => void;

  // Script step
  scriptVariants: ScriptVariant[];
  scriptIndex: number | null;
  setScriptVariants: (v: ScriptVariant[]) => void;
  appendScriptVariants: (v: ScriptVariant[]) => void;
  pickScript: (index: number) => void;
  resetScript: () => void;

  // Generation settings (durable)
  imageQualityTier: ImageQualityTier;
  setImageQualityTier: (t: ImageQualityTier) => Promise<void>;
};

const emptyBrief: Brief = { productName: '', targetAudience: '', adAngle: '' };

function parseStoredTier(v: string | null): ImageQualityTier {
  if (v === 'balanced' || v === 'realistic') return v;
  return 'fast';
}

export const useAppStore = create<AppState>((set) => ({
  token: null,
  authed: false,
  hydrating: true,
  setAuth: async (token) => {
    setToken(token);
    await AsyncStorage.setItem(TOKEN_KEY, token);
    set({ token, authed: true });
  },
  signOut: async () => {
    setToken(null);
    await AsyncStorage.removeItem(TOKEN_KEY);
    set({
      token: null,
      authed: false,
      brief: emptyBrief,
      copyVariants: [],
      copyIndex: null,
      imageVariants: [],
      imageIndex: null,
      scriptVariants: [],
      scriptIndex: null,
    });
  },
  hydrate: async () => {
    const [token, tier] = await Promise.all([
      AsyncStorage.getItem(TOKEN_KEY),
      AsyncStorage.getItem(TIER_KEY),
    ]);
    if (token) {
      setToken(token);
    }
    set({
      token,
      authed: !!token,
      imageQualityTier: parseStoredTier(tier),
      hydrating: false,
    });
  },

  brief: emptyBrief,
  setBrief: (b) => set({ brief: b }),
  resetBrief: () =>
    set({
      brief: emptyBrief,
      copyVariants: [],
      copyIndex: null,
      imageVariants: [],
      imageIndex: null,
      scriptVariants: [],
      scriptIndex: null,
    }),

  copyVariants: [],
  copyIndex: null,
  setCopyVariants: (v) => set({ copyVariants: v, copyIndex: null }),
  appendCopyVariants: (v) =>
    set((s) => ({ copyVariants: [...s.copyVariants, ...v] })),
  pickCopy: (index) => set({ copyIndex: index }),
  resetCopy: () => set({ copyVariants: [], copyIndex: null }),

  imageVariants: [],
  imageIndex: null,
  setImageVariants: (v) => set({ imageVariants: v, imageIndex: null }),
  appendImageVariants: (v) =>
    set((s) => ({ imageVariants: [...s.imageVariants, ...v] })),
  pickImage: (index) => set({ imageIndex: index }),
  resetImage: () => set({ imageVariants: [], imageIndex: null }),

  scriptVariants: [],
  scriptIndex: null,
  setScriptVariants: (v) => set({ scriptVariants: v, scriptIndex: null }),
  appendScriptVariants: (v) =>
    set((s) => ({ scriptVariants: [...s.scriptVariants, ...v] })),
  pickScript: (index) => set({ scriptIndex: index }),
  resetScript: () => set({ scriptVariants: [], scriptIndex: null }),

  imageQualityTier: 'fast',
  setImageQualityTier: async (tier) => {
    await AsyncStorage.setItem(TIER_KEY, tier);
    set({ imageQualityTier: tier });
  },
}));
