import { useAppStore } from '../store';
import { useT } from '../i18n/hooks';
import { authApi } from '../services/authApi';
import { BrandSettings } from './BrandSettings';
import { GenerationSettings } from './GenerationSettings';

export function SettingsDrawer() {
  const open = useAppStore((s) => s.drawerOpen);
  const closeDrawer = useAppStore((s) => s.closeDrawer);
  const user = useAppStore((s) => s.user);
  const setSession = useAppStore((s) => s.setSession);
  const resetBrief = useAppStore((s) => s.resetBrief);
  const resetSteps = useAppStore((s) => s.resetSteps);
  const resetAudience = useAppStore((s) => s.resetAudience);
  const t = useT();

  // Sign out: revoke the server session, clear local auth, and wipe all
  // session-scoped state (brief, steps, cache, AND audience) so the next user
  // on this machine doesn't inherit the previous campaign. Brand stays — it's
  // brand-level (localStorage), not session-level.
  async function signOut() {
    await authApi.logout().catch(() => undefined);
    resetBrief();
    resetSteps();
    resetAudience();
    closeDrawer();
    setSession(null);
  }

  return (
    <>
      <div
        aria-hidden={!open}
        onClick={closeDrawer}
        className={`fixed inset-0 z-30 bg-neutral-900/20 transition-opacity ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      />
      <aside
        role="dialog"
        aria-label="Settings"
        className={`fixed right-0 top-0 z-40 flex h-full w-full max-w-md flex-col border-l border-neutral-200 bg-white shadow-xl transition-transform ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <header className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold">{t('settings.title')}</h2>
            <p className="text-xs text-neutral-500">{t('settings.subtitle')}</p>
          </div>
          <button
            type="button"
            onClick={closeDrawer}
            className="rounded-md border border-neutral-200 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50"
          >
            {t('settings.close')}
          </button>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          {user && (
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                {t('auth.account')}
              </p>
              <p className="text-xs text-neutral-500">{t('auth.signedInAs')}</p>
              <p className="text-sm font-medium text-neutral-800">
                {user.displayName ? `${user.displayName} · ${user.email}` : user.email}
              </p>
            </div>
          )}

          <div className="space-y-2 border-t border-neutral-200 pt-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
              {t('settings.generationSection')}
            </p>
            <GenerationSettings />
          </div>

          <div className="space-y-2 border-t border-neutral-200 pt-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
              {t('settings.brandSection')}
            </p>
            <BrandSettings />
          </div>
        </div>

        <footer className="flex items-center justify-end border-t border-neutral-200 px-6 py-4">
          <button
            type="button"
            onClick={signOut}
            className="rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-900"
          >
            {t('settings.signOut')}
          </button>
        </footer>
      </aside>
    </>
  );
}
