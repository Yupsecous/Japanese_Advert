import type { StateCreator } from 'zustand';
import type { ProjectListItem } from '../services/projectsApi';

// History state: which saved ad is currently loaded, and the sidebar list.
// The list is hydrated from the server (see useProjectSync) and kept in sync
// as the current ad auto-saves.
export type ProjectsSlice = {
  currentProjectId: string | null;
  projects: ProjectListItem[];
  setCurrentProjectId: (id: string | null) => void;
  setProjects: (list: ProjectListItem[]) => void;
  upsertProject: (item: ProjectListItem) => void;
  removeProject: (id: string) => void;
};

export const createProjectsSlice: StateCreator<ProjectsSlice, [], [], ProjectsSlice> = (set) => ({
  currentProjectId: null,
  projects: [],
  setCurrentProjectId: (id) => set({ currentProjectId: id }),
  setProjects: (list) => set({ projects: list }),
  upsertProject: (item) =>
    set((s) => ({ projects: [item, ...s.projects.filter((p) => p.id !== item.id)] })),
  removeProject: (id) =>
    set((s) => ({
      projects: s.projects.filter((p) => p.id !== id),
      currentProjectId: s.currentProjectId === id ? null : s.currentProjectId,
    })),
});
