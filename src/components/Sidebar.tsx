import { useEffect, useRef, useState } from 'react';
import { useAppStore, loadSnapshot } from '../store';
import { useT } from '../i18n/hooks';
import { authApi } from '../services/authApi';
import { projectsApi } from '../services/projectsApi';
import { TIER_LABELS } from '../tiers';
import { BrandMark } from './BrandMark';

function Icon({ d, size = 18 }: { d: string; size?: number }) {
  return (
    <svg viewBox="0 0 20 20" width={size} height={size} aria-hidden="true" className="shrink-0">
      <path fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}
const ICON = {
  plus: 'M10 4.5v11M4.5 10h11',
  gear: 'M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM10 2.5v2M10 15.5v2M2.5 10h2M15.5 10h2M4.7 4.7l1.4 1.4M13.9 13.9l1.4 1.4M15.3 4.7l-1.4 1.4M6.1 13.9l-1.4 1.4',
  spark: 'M10 3l1.8 3.7L15.5 8.5 11.8 10.3 10 14l-1.8-3.7L4.5 8.5 8.2 6.7Z',
  chevronL: 'M12.5 5l-5 5 5 5',
  chevronR: 'M7.5 5l5 5-5 5',
  signOut: 'M12.5 6.5V5a1.5 1.5 0 0 0-1.5-1.5H5A1.5 1.5 0 0 0 3.5 5v10A1.5 1.5 0 0 0 5 16.5h6a1.5 1.5 0 0 0 1.5-1.5v-1.5M8 10h9m0 0-2.5-2.5M17 10l-2.5 2.5',
};

function tierBadgeClass(tier: string): string {
  if (tier === 'ultra') return 'border-violet-300 bg-violet-50 text-violet-700';
  if (tier === 'pro') return 'border-emerald-300 bg-emerald-50 text-emerald-700';
  return 'border-rule-strong bg-canvas-deep text-ink-soft';
}

export function Sidebar({
  collapsed,
  onToggleCollapse,
  onUpgrade,
}: {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onUpgrade: () => void;
}) {
  const t = useT();
  const user = useAppStore((s) => s.user);
  const projects = useAppStore((s) => s.projects);
  const currentProjectId = useAppStore((s) => s.currentProjectId);
  const setCurrentProjectId = useAppStore((s) => s.setCurrentProjectId);
  const removeProject = useAppStore((s) => s.removeProject);
  const openDrawer = useAppStore((s) => s.openDrawer);
  const resetBrief = useAppStore((s) => s.resetBrief);
  const resetSteps = useAppStore((s) => s.resetSteps);
  const resetAudience = useAppStore((s) => s.resetAudience);
  const setSession = useAppStore((s) => s.setSession);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  function newAd() {
    resetBrief();
    resetSteps();
  }
  async function openProject(id: string) {
    if (id === currentProjectId) return;
    const r = await projectsApi.get(id);
    if (r.ok) {
      setCurrentProjectId(id);
      loadSnapshot(r.data.project.state);
    }
  }
  async function removeAd(id: string) {
    const wasCurrent = id === currentProjectId;
    removeProject(id); // optimistic
    await projectsApi.remove(id).catch(() => undefined);
    if (wasCurrent) {
      resetBrief();
      resetSteps();
    }
  }
  async function signOut() {
    await authApi.logout().catch(() => undefined);
    resetBrief();
    resetSteps();
    resetAudience();
    setMenuOpen(false);
    setSession(null);
  }

  const tier = user?.tier ?? 'free';
  const name = user?.displayName?.trim() || user?.email || 'Account';
  const initial = (user?.displayName?.trim() || user?.email || '?').charAt(0).toUpperCase();

  const navBtn =
    'flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm text-ink-soft transition-colors hover:bg-canvas-deep hover:text-ink';

  const todayStr = new Date().toDateString();
  const groups = [
    { label: t('nav.today'), items: projects.filter((p) => new Date(p.updatedAt).toDateString() === todayStr) },
    { label: t('nav.earlier'), items: projects.filter((p) => new Date(p.updatedAt).toDateString() !== todayStr) },
  ].filter((g) => g.items.length > 0);

  return (
    <aside
      className={`flex h-full shrink-0 flex-col border-r border-rule bg-paper transition-[width] duration-200 ${
        collapsed ? 'w-[68px]' : 'w-64'
      }`}
    >
      {/* Logo + collapse toggle */}
      <div className={`flex items-center px-3 py-4 ${collapsed ? 'justify-center' : 'justify-between'}`}>
        {collapsed ? (
          <BrandMark size={26} />
        ) : (
          <BrandMark size={26} withWordmark />
        )}
        {!collapsed && (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={t('nav.collapse')}
            title={t('nav.collapse')}
            className="rounded-md p-1 text-ink-faint transition-colors hover:bg-canvas-deep hover:text-ink"
          >
            <Icon d={ICON.chevronL} size={16} />
          </button>
        )}
      </div>
      {collapsed && (
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={t('nav.expand')}
          title={t('nav.expand')}
          className="mx-auto mb-1 rounded-md p-1 text-ink-faint transition-colors hover:bg-canvas-deep hover:text-ink"
        >
          <Icon d={ICON.chevronR} size={16} />
        </button>
      )}

      {/* Primary actions */}
      <nav className="space-y-0.5 px-2.5">
        <button type="button" onClick={newAd} className={`${navBtn} ${collapsed ? 'justify-center px-0' : ''}`} title={t('nav.newAd')}>
          <Icon d={ICON.plus} />
          {!collapsed && <span className="font-medium text-ink">{t('nav.newAd')}</span>}
        </button>
        <button type="button" onClick={openDrawer} className={`${navBtn} ${collapsed ? 'justify-center px-0' : ''}`} title={t('nav.settings')}>
          <Icon d={ICON.gear} />
          {!collapsed && <span>{t('nav.settings')}</span>}
        </button>
        <button type="button" onClick={onUpgrade} className={`${navBtn} ${collapsed ? 'justify-center px-0' : ''}`} title={t('nav.upgrade')}>
          <Icon d={ICON.spark} />
          {!collapsed && <span>{t('nav.upgrade')}</span>}
        </button>
      </nav>

      {/* History */}
      {!collapsed && (
        <div className="mt-5 min-h-0 flex-1 overflow-y-auto px-2.5">
          <p className="px-2.5 pb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
            {t('nav.history')}
          </p>
          {projects.length === 0 ? (
            <p className="px-2.5 text-xs text-ink-faint">{t('nav.noRecent')}</p>
          ) : (
            <div className="space-y-3">
              {groups.map((g) => (
                <div key={g.label}>
                  <p className="px-2.5 pb-0.5 text-[10px] uppercase tracking-wide text-ink-faint/70">
                    {g.label}
                  </p>
                  <div className="space-y-0.5">
                    {g.items.map((p) => {
                      const active = p.id === currentProjectId;
                      return (
                        <div
                          key={p.id}
                          className={`group flex items-center gap-1 rounded-lg pr-1 ${
                            active ? 'bg-canvas-deep' : 'hover:bg-canvas-deep'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => void openProject(p.id)}
                            className="flex min-w-0 flex-1 items-center gap-2 px-2.5 py-1.5 text-left text-sm text-ink"
                            title={p.title || t('nav.untitledAd')}
                          >
                            {active && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />}
                            <span className="truncate">{p.title || t('nav.untitledAd')}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => void removeAd(p.id)}
                            aria-label={t('nav.deleteAd')}
                            title={t('nav.deleteAd')}
                            className="rounded p-1 text-ink-faint opacity-0 transition-opacity hover:text-red-600 group-hover:opacity-100"
                          >
                            <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
                              <path fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" d="M4 4l8 8M12 4l-8 8" />
                            </svg>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {collapsed && <div className="flex-1" />}

      {/* Account */}
      <div ref={menuRef} className="relative border-t border-rule p-2.5">
        {menuOpen && (
          <div className="absolute bottom-full left-2.5 right-2.5 mb-2 overflow-hidden rounded-xl border border-rule bg-paper py-1 shadow-lg">
            <button type="button" onClick={() => { openDrawer(); setMenuOpen(false); }} className={navBtn}>
              <Icon d={ICON.gear} />
              <span>{t('nav.settings')}</span>
            </button>
            <button type="button" onClick={() => { onUpgrade(); setMenuOpen(false); }} className={navBtn}>
              <Icon d={ICON.spark} />
              <span>{t('nav.upgradePlan')}</span>
            </button>
            <div className="my-1 border-t border-rule" />
            <button type="button" onClick={() => void signOut()} className={`${navBtn} hover:text-red-600`}>
              <Icon d={ICON.signOut} />
              <span>{t('nav.signOut')}</span>
            </button>
          </div>
        )}
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className={`flex w-full items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-left transition-colors hover:bg-canvas-deep ${collapsed ? 'justify-center px-0' : ''}`}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          title={name}
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-semibold text-white">
            {initial}
          </span>
          {!collapsed && (
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-ink">{name}</span>
              {user?.displayName && <span className="block truncate text-xs text-ink-faint">{user.email}</span>}
            </span>
          )}
          {!collapsed && (
            <span className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${tierBadgeClass(tier)}`}>
              {TIER_LABELS[tier]}
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}
