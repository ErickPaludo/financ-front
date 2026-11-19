/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Adicione isso para resolver o erro do App.css
declare module "*.css";

// Versão do package.json, injetada pelo define do vite.config.ts.
declare const __APP_VERSION__: string;
