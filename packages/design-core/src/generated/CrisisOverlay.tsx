/**
 * @file CrisisOverlay — Full-screen crisis mode overlay.
 * Auto-generated from components.yml.
 */

import type { ReactNode } from 'react';

export interface CrisisOverlayProps {
  onReady?: () => void;
  message?: string;
  className?: string;
}

export function CrisisOverlay({ onReady, message = 'Rest. Breathe. The mesh holds.', className }: CrisisOverlayProps) {
  return (
    <div className={`crisis-overlay ${className || ''}`} data-spoons="0">
      <div className="flex flex-col items-center justify-center gap-6 p-10 min-h-screen">
        <p className="text-xl font-light text-center" style={{ color: 'var(--p31-text)' }}>
          {message}
        </p>
        <button
          type="button"
          onClick={onReady}
          className="btn btn-primary"
        >
          I'm Ready
        </button>
      </div>
    </div>
  );
}

export default CrisisOverlay;
