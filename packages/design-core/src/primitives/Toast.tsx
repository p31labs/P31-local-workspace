import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';

export type ToastTone = 'success' | 'error' | 'info' | 'warning';

export interface ToastOptions {
  tone?: ToastTone;
  /** Auto-dismiss ms; 0 = sticky (dismiss only by action) */
  duration?: number;
}

interface ToastEntry {
  id: number;
  message: ReactNode;
  tone: ToastTone;
  sticky: boolean;
}

interface ToastApi {
  toast: (message: ReactNode, options?: ToastOptions) => void;
}

const ToastCtx = createContext<ToastApi | null>(null);

/** Returns `{ toast }`. Must be used inside `<ToastProvider>`. */
export function useToast(): ToastApi {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useToast() requires <ToastProvider>');
  return ctx;
}

const TONE_CLASS: Record<ToastTone, string> = {
  success: 'toast-success',
  error: 'toast-error',
  info: 'toast-info',
  warning: 'toast-warning',
};

/**
 * Renders a `role="status"` region and exposes `useToast()` to descendants.
 * Crisis mode forces opaque surfaces + zero animation via CSS.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<ToastEntry[]>([]);
  const seq = useRef(0);

  const dismiss = useCallback((id: number) => {
    setEntries((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: ReactNode, options: ToastOptions = {}) => {
    const { tone = 'info', duration = 4000 } = options;
    const id = ++seq.current;
    setEntries((prev) => [...prev.slice(-3), { id, message, tone, sticky: duration === 0 }]);
    if (duration > 0) setTimeout(() => dismiss(id), duration);
  }, [dismiss]);

  const api = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className="toast-region" role="status" aria-live="polite">
        {entries.map((t) => (
          <div key={t.id} className={`toast ${TONE_CLASS[t.tone]}`}>
            <span style={{ flex: 1 }}>{t.message}</span>
            {t.sticky && (
              <button
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notification"
                className="btn btn-ghost btn-sm"
                style={{ minHeight: 28 }}
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
