import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setToken } from '../services/backend';
import type { Brief, CopyVariant } from '@advert/shared';

// Slimmed-down store for v1. Web app's slices will port over in
// subsequent sessions; for now only what auth + brief + copy screen
// touch.

const TOKEN_KEY = 'advert.token';

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
};

const emptyBrief: Brief = { productName: '', targetAudience: '', adAngle: '' };

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
    });
  },
  hydrate: async () => {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (token) {
      setToken(token);
      set({ token, authed: true });
    }
    set({ hydrating: false });
  },

  brief: emptyBrief,
  setBrief: (b) => set({ brief: b }),
  resetBrief: () => set({ brief: emptyBrief, copyVariants: [], copyIndex: null }),

  copyVariants: [],
  copyIndex: null,
  setCopyVariants: (v) => set({ copyVariants: v, copyIndex: null }),
  appendCopyVariants: (v) =>
    set((s) => ({ copyVariants: [...s.copyVariants, ...v] })),
  pickCopy: (index) => set({ copyIndex: index }),
  resetCopy: () => set({ copyVariants: [], copyIndex: null }),
}));
