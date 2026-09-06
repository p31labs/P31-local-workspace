/// <reference types="vite/client" />

declare module '*.tsx' {
  const content: React.ReactNode;
  export default content;
}

declare module '*.jsx' {
  const content: React.ReactNode;
  export default content;
}

declare global {
  interface ImportMeta {
    readonly env: {
      readonly VITE_API_URL?: string;
      readonly VITE_WS_URL?: string;
      readonly MODE: string;
      readonly PROD: boolean;
      readonly DEV: boolean;
    };
  }
}
