/// <reference types="vite/client" />

declare module 'virtual:pwa-register/react' {
  import type { RegisterSWOptions } from 'virtual:pwa-register';

  export interface useRegisterSWOptions extends RegisterSWOptions {}

  export function useRegisterSW(options?: useRegisterSWOptions): {
    needRefresh: [boolean, (value?: boolean) => void];
    updateServiceWorker: (reloadPage?: boolean) => Promise<void>;
    offlineReady: [boolean, (value?: boolean) => void];
    registrationError: [Error | null, (error: Error | null) => void];
  };
}