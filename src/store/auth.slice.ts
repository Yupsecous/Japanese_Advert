import type { StateCreator } from 'zustand';
import type { SessionUser } from '../services/authApi';

// Auth state is NOT persisted — the httpOnly session cookie is the source of
// truth. On load we hydrate by calling /api/auth/me (see AuthGate).
export type AuthStatus = 'loading' | 'authed' | 'anon';

export type AuthSlice = {
  authStatus: AuthStatus;
  user: SessionUser | null;
  setSession: (user: SessionUser | null) => void;
  setAuthLoading: () => void;
};

export const createAuthSlice: StateCreator<AuthSlice, [], [], AuthSlice> = (set) => ({
  authStatus: 'loading',
  user: null,
  setSession: (user) => set({ user, authStatus: user ? 'authed' : 'anon' }),
  setAuthLoading: () => set({ authStatus: 'loading' }),
});
