import { useState, useEffect, type FormEvent } from 'react';
import { useAppStore } from '../store';
import { useT } from '../i18n/hooks';
import { authApi, GOOGLE_START_URL } from '../services/authApi';
import { LanguageSwitcher } from './LanguageSwitcher';

type Mode = 'login' | 'signup' | 'forgot' | 'reset';

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
// Hide "Continue with Google" where OAuth can't work (e.g. the bare-IP/HTTP
// preview — Google requires an HTTPS domain). Default: shown.
const GOOGLE_ENABLED = import.meta.env.VITE_GOOGLE_ENABLED !== '0';

// Reads any redirect params the backend appended (verify-email, OAuth
// callback, reset link), returns the initial mode + a banner, then cleans the
// URL so a refresh doesn't replay them.
function readInitial(): { mode: Mode; resetToken: string; banner: string; bannerKind: 'ok' | 'error' } {
  if (typeof window === 'undefined') return { mode: 'login', resetToken: '', banner: '', bannerKind: 'ok' };
  const { pathname, search } = window.location;
  const params = new URLSearchParams(search);
  let result = { mode: 'login' as Mode, resetToken: '', banner: '', bannerKind: 'ok' as 'ok' | 'error' };

  if (pathname.startsWith('/reset-password') && params.get('token')) {
    result = { mode: 'reset', resetToken: params.get('token') ?? '', banner: '', bannerKind: 'ok' };
  } else if (params.get('verified') === '1') {
    result = { mode: 'login', resetToken: '', banner: 'auth.verifiedBanner', bannerKind: 'ok' };
  } else if (params.get('verified') === '0') {
    result = { mode: 'login', resetToken: '', banner: 'auth.verifyFailedBanner', bannerKind: 'error' };
  } else if (params.get('oauth')) {
    const o = params.get('oauth');
    result = {
      mode: 'login',
      resetToken: '',
      banner: o === 'link' ? 'auth.googleLinkError' : 'auth.googleError',
      bannerKind: 'error',
    };
  }

  if (search || pathname !== '/') {
    window.history.replaceState(null, '', '/');
  }
  return result;
}

export function AuthScreen() {
  const setSession = useAppStore((s) => s.setSession);
  const t = useT();

  const [initial] = useState(readInitial);
  const [mode, setMode] = useState<Mode>(initial.mode);
  const [resetToken] = useState(initial.resetToken);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [banner, setBanner] = useState(initial.banner);
  const [bannerKind] = useState(initial.bannerKind);
  // When login fails due to an unverified email, surface a resend affordance.
  const [showResend, setShowResend] = useState(false);
  // After signup, switch to a "check your email" panel.
  const [verifySentTo, setVerifySentTo] = useState('');

  // Clear transient messages when the user switches mode.
  useEffect(() => {
    setError('');
    setInfo('');
    setShowResend(false);
  }, [mode]);

  function mapLoginError(code: string): string {
    if (code === 'auth/bad-credentials') return t('auth.invalidCredentials');
    if (code === 'auth/email-unverified') {
      setShowResend(true);
      return t('auth.unverifiedError');
    }
    if (code === 'auth/rate-limited') return t('auth.rateLimited');
    return t('auth.genericError');
  }

  async function onLogin(e: FormEvent) {
    e.preventDefault();
    if (!EMAIL_RE.test(email)) return setError(t('auth.emailRequired'));
    setBusy(true);
    setError('');
    setInfo('');
    setShowResend(false);
    const res = await authApi.login({ email: email.trim(), password });
    setBusy(false);
    if (res.ok) {
      setSession(res.data.user);
      return;
    }
    setError(mapLoginError(res.code));
  }

  async function onSignup(e: FormEvent) {
    e.preventDefault();
    if (!EMAIL_RE.test(email)) return setError(t('auth.emailRequired'));
    if (password.length < 8) return setError(t('auth.passwordTooShort'));
    if (password !== confirm) return setError(t('auth.passwordMismatch'));
    setBusy(true);
    setError('');
    const res = await authApi.signup({
      email: email.trim(),
      password,
      ...(displayName.trim() ? { displayName: displayName.trim() } : {}),
    });
    setBusy(false);
    if (res.ok) {
      // Auto-verify preview mode returns the user already logged in.
      if (res.data.user) {
        setSession(res.data.user);
        return;
      }
      setVerifySentTo(email.trim());
      return;
    }
    setError(res.code === 'auth/rate-limited' ? t('auth.rateLimited') : t('auth.genericError'));
  }

  async function onForgot(e: FormEvent) {
    e.preventDefault();
    if (!EMAIL_RE.test(email)) return setError(t('auth.emailRequired'));
    setBusy(true);
    setError('');
    const res = await authApi.forgotPassword(email.trim());
    setBusy(false);
    if (res.ok) setInfo(t('auth.forgotSent'));
    else setError(res.code === 'auth/rate-limited' ? t('auth.rateLimited') : t('auth.genericError'));
  }

  async function onReset(e: FormEvent) {
    e.preventDefault();
    if (password.length < 8) return setError(t('auth.passwordTooShort'));
    if (password !== confirm) return setError(t('auth.passwordMismatch'));
    setBusy(true);
    setError('');
    const res = await authApi.resetPassword(resetToken, password);
    setBusy(false);
    if (res.ok) {
      setMode('login');
      setBanner('auth.resetDone');
      setPassword('');
      setConfirm('');
    } else {
      setError(res.code === 'auth/rate-limited' ? t('auth.rateLimited') : t('auth.resetInvalid'));
    }
  }

  async function onResend() {
    if (!EMAIL_RE.test(email)) return setError(t('auth.emailRequired'));
    setBusy(true);
    await authApi.resendVerification(email.trim());
    setBusy(false);
    setShowResend(false);
    setInfo(t('auth.verifyResent'));
  }

  const inputCls =
    'w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-900 disabled:opacity-50';
  const labelCls = 'text-xs font-medium uppercase tracking-wide text-neutral-500';
  const primaryBtn =
    'w-full rounded-md bg-brand px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-ink-faint';

  // "Check your email" panel after signup.
  if (verifySentTo) {
    return (
      <Shell t={t}>
        <h1 className="font-serif text-2xl font-medium tracking-tight text-ink sm:text-3xl">
          {t('auth.verifyHeading')}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          {t('auth.verifyBody', { email: verifySentTo })}
        </p>
        {info && <p className="mt-3 text-xs text-emerald-700">{info}</p>}
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            setEmail(verifySentTo);
            void onResend();
          }}
          className="mt-4 text-sm font-medium text-brand hover:underline disabled:opacity-50"
        >
          {t('auth.verifyResend')}
        </button>
        <button
          type="button"
          onClick={() => {
            setVerifySentTo('');
            setMode('login');
          }}
          className="mt-6 block text-sm text-ink-soft hover:text-ink"
        >
          {t('auth.backToLogin')}
        </button>
      </Shell>
    );
  }

  const heading =
    mode === 'signup'
      ? t('auth.signupHeading')
      : mode === 'forgot'
        ? t('auth.forgotHeading')
        : mode === 'reset'
          ? t('auth.resetHeading')
          : t('auth.heading');
  const subtitle =
    mode === 'signup' ? t('auth.signupSubtitle') : mode === 'forgot' ? t('auth.forgotSubtitle') : t('auth.subtitle');

  return (
    <Shell t={t}>
      <h1 className="font-serif text-2xl font-medium leading-tight tracking-tight text-ink sm:text-3xl">
        {heading}
      </h1>
      {(mode === 'login' || mode === 'signup' || mode === 'forgot') && (
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">{subtitle}</p>
      )}

      {banner && (
        <p className={`mt-4 rounded-md px-3 py-2 text-xs ${bannerKind === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
          {t(banner)}
        </p>
      )}

      {/* Google — available on login + signup (when configured) */}
      {(mode === 'login' || mode === 'signup') && GOOGLE_ENABLED && (
        <>
          <a
            href={GOOGLE_START_URL}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-md border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-800 transition-colors hover:bg-neutral-50"
          >
            <GoogleGlyph />
            {t('auth.googleSignIn')}
          </a>
          <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-wide text-ink-faint">
            <span className="h-px flex-1 bg-rule" />
            {t('auth.or')}
            <span className="h-px flex-1 bg-rule" />
          </div>
        </>
      )}

      <form
        className="space-y-4"
        onSubmit={mode === 'login' ? onLogin : mode === 'signup' ? onSignup : mode === 'forgot' ? onForgot : onReset}
        noValidate
      >
        {(mode === 'login' || mode === 'signup' || mode === 'forgot') && (
          <div className="space-y-1.5">
            <label htmlFor="auth-email" className={labelCls}>{t('auth.email')}</label>
            <input
              id="auth-email"
              type="email"
              autoComplete="email"
              autoCapitalize="off"
              spellCheck={false}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={busy}
              className={inputCls}
              required
            />
          </div>
        )}

        {mode === 'signup' && (
          <div className="space-y-1.5">
            <label htmlFor="auth-name" className={labelCls}>{t('auth.displayName')}</label>
            <input
              id="auth-name"
              type="text"
              autoComplete="name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={busy}
              className={inputCls}
            />
          </div>
        )}

        {(mode === 'login' || mode === 'signup' || mode === 'reset') && (
          <div className="space-y-1.5">
            <label htmlFor="auth-password" className={labelCls}>{t('auth.password')}</label>
            <input
              id="auth-password"
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={busy}
              className={inputCls}
              required
            />
          </div>
        )}

        {(mode === 'signup' || mode === 'reset') && (
          <div className="space-y-1.5">
            <label htmlFor="auth-confirm" className={labelCls}>{t('auth.confirmPassword')}</label>
            <input
              id="auth-confirm"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              disabled={busy}
              className={inputCls}
              required
            />
          </div>
        )}

        {error && (
          <p role="alert" className="text-xs text-red-600">
            {error}
            {showResend && (
              <button type="button" onClick={onResend} disabled={busy} className="ml-2 font-medium underline">
                {t('auth.verifyResend')}
              </button>
            )}
          </p>
        )}
        {info && <p className="text-xs text-emerald-700">{info}</p>}

        {mode === 'login' && (
          <div className="text-right">
            <button type="button" onClick={() => setMode('forgot')} className="text-xs text-ink-soft hover:text-ink">
              {t('auth.forgotLink')}
            </button>
          </div>
        )}

        <button type="submit" disabled={busy} className={primaryBtn}>
          {busy
            ? mode === 'signup'
              ? t('auth.signingUp')
              : t('auth.signingIn')
            : mode === 'signup'
              ? t('auth.signUp')
              : mode === 'forgot'
                ? t('auth.forgotCta')
                : mode === 'reset'
                  ? t('auth.resetCta')
                  : t('auth.signIn')}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-ink-soft">
        {mode === 'login' && (
          <>
            {t('auth.noAccount')}{' '}
            <button type="button" onClick={() => setMode('signup')} className="font-medium text-brand hover:underline">
              {t('auth.toSignup')}
            </button>
          </>
        )}
        {(mode === 'signup' || mode === 'forgot' || mode === 'reset') && (
          <button type="button" onClick={() => setMode('login')} className="text-ink-soft hover:text-ink">
            {t('auth.backToLogin')}
          </button>
        )}
      </div>
    </Shell>
  );
}

function Shell({ t, children }: { t: (k: string, v?: Record<string, string | number>) => string; children: React.ReactNode }) {
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
        <div className="rounded-xl border border-rule bg-paper p-6 shadow-sm sm:p-8">{children}</div>
        <p className="mt-5 text-center text-[11px] leading-relaxed text-ink-faint">{t('auth.footnote')}</p>
      </div>
    </div>
  );
}

function GoogleGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.58A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
    </svg>
  );
}
