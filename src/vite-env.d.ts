/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Optional override for the backend API base URL. Empty/undefined means
  // same-origin (production) or the Vite dev proxy (local) — both relative.
  readonly VITE_API_BASE_URL?: string;
  // '1' enables open-preview mode: the sign-in gate is skipped so anyone can
  // use the app without an account (paired with backend OPEN_ACCESS=1). Used
  // for the pre-DNS IP preview only; unset for the real accounts deploy.
  readonly VITE_OPEN_ACCESS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
