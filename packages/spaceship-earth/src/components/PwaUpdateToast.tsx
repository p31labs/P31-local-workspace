/**
 * @file PwaUpdateToast — "New version available" banner for PWA updates.
 *
 * Appears when a new service worker is waiting to activate (vite-plugin-pwa,
 * registerType: 'prompt'). User can defer (dismiss) or reload immediately.
 *
 * useRegisterSW is provided by vite-plugin-pwa's virtual module.
 * It exposes `needRefresh`, `updateServiceWorker`, etc.
 *
 * Mounts at the root (App.tsx), always present but hidden until update ready.
 * CSS entrance: `@starting-style` slide-up (Chrome 117+, graceful fallback).
 */

import { useRegisterSW } from 'virtual:pwa-register/react';

const NEON = '#00FFFF';
const VOID = 'rgba(3, 3, 8, 0.95)';

export function PwaUpdateToast() {
  const { needRefresh: [needRefresh, setNeedRefresh], updateServiceWorker } = useRegisterSW({
    onRegisteredSW(swUrl: string, r: ServiceWorkerRegistration | undefined) {
      // Poll for updates every 60 minutes when app is in background
      if (r) {
        setInterval(() => {
          if (!(!r.installing && navigator.onLine)) return;
          r.update().catch(console.error);
        }, 60 * 60 * 1000);
      }
      console.log('[PWA] SW registered:', swUrl);
    },
    onRegisterError(error: unknown) {
      console.error('[PWA] SW registration error:', error);
    },
  });

  if (!needRefresh) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: 72,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9000,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 16px',
        background: VOID,
        backdropFilter: 'blur(12px)',
        border: `1px solid ${NEON}33`,
        borderRadius: 8,
        boxShadow: `0 0 20px ${NEON}11`,
        whiteSpace: 'nowrap',
        fontFamily: "'Space Mono', monospace",
        fontSize: 12,
        letterSpacing: '0.08em',
      }}
    >
      <span style={{ color: NEON, opacity: 0.7 }}>UPDATE READY</span>
      <button
        type="button"
        onClick={() => updateServiceWorker(true)}
        style={{
          background: `${NEON}18`,
          border: `1px solid ${NEON}66`,
          color: NEON,
          padding: '6px 14px',
          borderRadius: 5,
          cursor: 'pointer',
          fontFamily: 'inherit',
          fontSize: 11,
          letterSpacing: '0.1em',
        }}
      >
        RELOAD
      </button>
      <button
        type="button"
        onClick={() => setNeedRefresh(false)}
        aria-label="Dismiss update notification"
        style={{
          background: 'transparent',
          border: 'none',
          color: 'rgba(255,255,255,0.3)',
          cursor: 'pointer',
          fontSize: 16,
          padding: '4px 8px',
          lineHeight: 1,
        }}
      >
        ✕
      </button>
    </div>
  );
}
