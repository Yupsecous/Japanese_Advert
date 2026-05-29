import { useEffect, type ReactNode } from 'react';
import { useAppStore } from '../store';
import { authApi } from '../services/authApi';
import { setSessionExpiredHandler } from '../services/backendClient';
import { AuthScreen } from './AuthScreen';
import { useT } from '../i18n/hooks';

// Real auth gate. On mount we hydrate the session from the httpOnly cookie
// via /api/auth/me. A mid-session 401 on any backend call flips us back to
// the sign-in screen (registered handler). Children render only when authed.
const OPEN_ACCESS = import.meta.env.VITE_OPEN_ACCESS === '1';

export function AuthGate({ children }: { children: ReactNode }) {
  const authStatus = useAppStore((s) => s.authStatus);
  const setSession = useAppStore((s) => s.setSession);
  const t = useT();

  useEffect(() => {
    // Open-preview mode: no sign-in — drop everyone straight into the app as
    // a guest. (Backend runs with OPEN_ACCESS=1 to match.)
    if (OPEN_ACCESS) {
      setSession({ id: 'public', email: '', displayName: 'Guest', emailVerified: true, tier: 'free' });
      return;
    }
    let cancelled = false;
    setSessionExpiredHandler(() => setSession(null));
    void authApi.me().then((res) => {
      if (cancelled) return;
      setSession(res.ok ? res.data.user : null);
    });
    return () => {
      cancelled = true;
      setSessionExpiredHandler(null);
    };
  }, [setSession]);

  if (OPEN_ACCESS) return <>{children}</>;

  if (authStatus === 'loading') {
    return (
      <div className="flex min-h-full items-center justify-center bg-canvas-deep">
        <p className="text-sm text-ink-soft">{t('auth.loading')}</p>
      </div>
    );
  }
  if (authStatus === 'anon') return <AuthScreen />;
  return <>{children}</>;
}
