/**
 * @file CrisisOverlay — Full-screen breathing overlay shown when spoons=0.
 * Auto-generated from components.yml.
 *
 * @a2ui-component CrisisOverlay
 * @a2ui-props message string - Display text
 * @a2ui-props onDismiss string - Action ID to exit crisis mode
 * @a2ui-props visible boolean - Controls overlay visibility
 * @a2ui-example {"component":"CrisisOverlay","message":"Take a moment. Breathe.","onDismiss":"exit-crisis","visible":true}
 */

import type { ReactNode } from 'react';

export interface CrisisOverlayProps {
  message?: string;
  buttonLabel?: string;
  onReady?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export function CrisisOverlay({
  message = 'Rest. Breathe. The mesh holds.',
  buttonLabel = "I'm Ready",
  onReady,
  className,
  style
}: CrisisOverlayProps) {
  return (
    <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-void/90 backdrop-blur-sm ${className || ''}`} style={style}>
      <div className="text-center">
        <p className="text-2xl font-light text-text mb-2">{message}</p>
      </div>
      {onReady && (
        <button
          onClick={onReady}
          className="px-6 py-3 rounded-lg bg-accent text-void font-medium hover:bg-accent/90 transition-colors min-h-[44px]"
        >
          {buttonLabel}
        </button>
      )}
    </div>
  );
}

export default CrisisOverlay;
