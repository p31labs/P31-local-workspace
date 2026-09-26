import { useEffect, useRef, type ReactNode } from 'react';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  /** Heading text; wired to aria-labelledby. Required — modals must be named. */
  title: string;
  children: ReactNode;
  /** Rendered in the footer (actions) */
  actions?: ReactNode;
  className?: string;
}

/**
 * Dialog with overlay. Escape closes; clicking the overlay closes;
 * focus moves into the panel on open and returns on close.
 * Crisis mode renders the overlay fully opaque via CSS.
 */
export function Modal({ open, onClose, title, children, actions, className = '' }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement as HTMLElement;
    panelRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      restoreRef.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={`modal ${className}`.trim()}
        style={{ outline: 'none' }}
      >
        <h3 style={{ marginTop: 0, fontSize: 'var(--p31-scale-md)', fontWeight: 'var(--p31-font-weight-emphasis, 500)' }}>{title}</h3>
        {children}
        {actions && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 'var(--p31-space-lg)' }}>
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
