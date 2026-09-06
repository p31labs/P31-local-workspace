/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TETRA_HUB_URL?: string;
  readonly VITE_USE_MOCK_TELEMETRY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
