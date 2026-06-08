/// <reference types="vite/client" />

declare module "*.scss";
declare module "*.css";
declare module "*.svg" {
  const src: string;
  export default src;
}

interface ImportMetaEnv {
  readonly VITE_POSTHOG_KEY?: string;
  readonly VITE_POSTHOG_HOST?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Navigator {
  readonly deviceMemory?: number;
}

interface Window {
  webkitAudioContext?: typeof AudioContext;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      revealMaterial: Record<string, unknown>;
      revealBasicMaterial: Record<string, unknown>;
      paintRevealMaterial: Record<string, unknown>;
    }
  }
}

export {};
