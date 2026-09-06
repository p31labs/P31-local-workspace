import { useEffect } from 'react';

interface RestOverlayProps {
  onDismiss: () => void;
}

export default function RestOverlay({ onDismiss }: RestOverlayProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onDismiss]);

  return (
    <div id="rest-overlay" role="presentation">
      <button id="rest-return" onClick={onDismiss} aria-label="Return to interface (Escape)">
        ↩ Return
      </button>
    </div>
  );
}
