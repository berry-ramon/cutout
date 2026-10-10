/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENABLE_STRICT_MODE?: "true" | "false";
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
