/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Optional override for the backend API base URL. Empty/undefined means
  // same-origin (production) or the Vite dev proxy (local) — both relative.
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
