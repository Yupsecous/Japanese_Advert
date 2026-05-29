import { useEffect } from 'react';
import { useAppStore, snapshotState, type AppState } from '../store';
import { projectsApi } from './projectsApi';

// Drives the account-scoped ad history: hydrates the sidebar list on sign-in,
// and auto-saves the current ad (debounced) to the server as it changes —
// creating a project on first edit, then updating it. Reset/"New ad" detaches
// from the current project so the next ad starts a fresh history entry.

function isRealUser(id: string | undefined | null): boolean {
  return !!id && id !== 'public';
}

// Cheap reference compare of the snapshot-relevant slices, so the hook's own
// writes (projects list / currentProjectId) and unrelated UI state (drawer,
// etc.) don't trigger redundant saves or a feedback loop.
function snapshotChanged(a: AppState, b: AppState): boolean {
  return (
    a.brief !== b.brief ||
    a.briefSubmitted !== b.briefSubmitted ||
    a.steps !== b.steps ||
    a.variantCache !== b.variantCache ||
    a.customers !== b.customers ||
    a.briefCache !== b.briefCache ||
    a.deliveryLog !== b.deliveryLog ||
    a.effectivenessData !== b.effectivenessData ||
    a.learnedInsights !== b.learnedInsights ||
    a.runVersion !== b.runVersion ||
    a.locale !== b.locale
  );
}

export function useProjectSync(): void {
  const userId = useAppStore((s) => s.user?.id);

  useEffect(() => {
    if (!isRealUser(userId)) return;
    const { setProjects, setCurrentProjectId, upsertProject } = useAppStore.getState();

    void projectsApi.list().then((r) => {
      if (r.ok) setProjects(r.data.projects);
    });

    let timer: ReturnType<typeof setTimeout> | undefined;
    let creating = false;

    async function createNew(title: string, locale: string, state: unknown, now: string) {
      if (creating) return;
      creating = true;
      const r = await projectsApi.create({ title, locale, state });
      creating = false;
      if (r.ok) {
        setCurrentProjectId(r.data.id);
        upsertProject({ id: r.data.id, title, updatedAt: now });
      }
    }

    async function saveNow() {
      const s = useAppStore.getState();
      if (!s.briefSubmitted) return;
      const title = (s.brief.productName || '').trim() || 'Untitled ad';
      const state = snapshotState(s);
      const now = new Date().toISOString();
      const cid = s.currentProjectId;
      if (cid) {
        const r = await projectsApi.update(cid, { title, locale: s.locale, state });
        if (r.ok) upsertProject({ id: cid, title, updatedAt: now });
        else if (r.code === 'project/not-found') await createNew(title, s.locale, state, now);
      } else {
        await createNew(title, s.locale, state, now);
      }
    }

    const unsub = useAppStore.subscribe((s, prev) => {
      // "New ad" / sign-out reset: detach from the current project, don't save the cleared state.
      if (prev.briefSubmitted && !s.briefSubmitted) {
        setCurrentProjectId(null);
        return;
      }
      if (!s.briefSubmitted) return;
      if (!snapshotChanged(prev, s)) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void saveNow(), 1200);
    });

    return () => {
      if (timer) clearTimeout(timer);
      unsub();
    };
  }, [userId]);
}
