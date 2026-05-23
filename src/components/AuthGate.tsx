import { useState, type FormEvent, type ReactNode } from 'react';
import { useAppStore } from '../store';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useT } from '../i18n/hooks';

// Soft-gate auth. Renders a credential form when not authed; renders
// children otherwise. The check is intentionally client-side and is NOT
// secure against a determined attacker — anyone reading the JS bundle
// can find the check and bypass it. Use this only for "casual visitors
// shouldn't land on the demo cold" scenarios, not for protecting secrets.
//
// Credentials are SHA-256 hashed so the plaintext doesn't appear in the
// bundle. The comparison runs in the browser via SubtleCrypto.

const USERNAME_HASH = 'b25d1febd5234a4b91364e07cf109d030eac93dc6b66e64d2d63e8cf391256a6';
const PASSWORD_HASH = '72c131843a0b883ce4d7bae0cb020ab30c900420fa328f695a14f08fde0a0645';

// Web Crypto's SubtleCrypto is only available in secure contexts (HTTPS or
// localhost). On plain HTTP it's undefined and any digest call throws — so
// we detect that explicitly and surface a specific error rather than the
// generic "invalid credentials" message, which would mislead the user.
class InsecureContextError extends Error {}

async function sha256Hex(s: string): Promise<string> {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    throw new InsecureContextError(
      'crypto.subtle is not available in this context. The app must be served over HTTPS or from localhost.',
    );
  }
  const data = new TextEncoder().encode(s);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function AuthGate({ children }: { children: ReactNode }) {
  const authed = useAppStore((s) => s.authed);
  const setAuthed = useAppStore((s) => s.setAuthed);
  const t = useT();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (authed) return <>{children}</>;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const [u, p] = await Promise.all([sha256Hex(username), sha256Hex(password)]);
      // Constant-time-ish compare. Not a real defense — the hash is in the
      // bundle anyway — but avoids timing leaks on the literal string compare.
      if (u.length !== USERNAME_HASH.length || p.length !== PASSWORD_HASH.length) {
        throw new Error('bad-input');
      }
      let diff = 0;
      for (let i = 0; i < u.length; i++) diff |= u.charCodeAt(i) ^ USERNAME_HASH.charCodeAt(i);
      for (let i = 0; i < p.length; i++) diff |= p.charCodeAt(i) ^ PASSWORD_HASH.charCodeAt(i);
      if (diff !== 0) {
        setError(t('auth.invalid'));
        return;
      }
      setAuthed(true);
      setPassword('');
    } catch (err) {
      if (err instanceof InsecureContextError) {
        setError(t('auth.insecureContext'));
      } else {
        setError(t('auth.invalid'));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-canvas-deep px-4 py-12">
      <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
          <p className="text-xs uppercase tracking-[0.2em] text-ink-soft">{t('app.title')}</p>
        </div>

        <div className="rounded-xl border border-rule bg-paper p-6 shadow-sm sm:p-8">
          <h1 className="font-serif text-2xl font-medium leading-tight tracking-tight text-ink sm:text-3xl">
            {t('auth.heading')}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">{t('auth.subtitle')}</p>

          <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
            <div className="space-y-1.5">
              <label htmlFor="auth-username" className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                {t('auth.username')}
              </label>
              <input
                id="auth-username"
                type="text"
                autoComplete="username"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={busy}
                className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-900 disabled:opacity-50"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="auth-password" className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                {t('auth.password')}
              </label>
              <input
                id="auth-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={busy}
                className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-900 disabled:opacity-50"
                required
              />
            </div>

            {error && (
              <p role="alert" className="text-xs text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy || username.length === 0 || password.length === 0}
              className="w-full rounded-md bg-brand px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-ink-faint"
            >
              {busy ? t('auth.signingIn') : t('auth.signIn')}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-[11px] leading-relaxed text-ink-faint">
          {t('auth.footnote')}
        </p>
      </div>
    </div>
  );
}
