import React, { useEffect } from 'react';
import '@p31/design-core/crisis-overlay';
import type { ReactNode, CSSProperties } from 'react';

export interface CrisisOverlayProps {
  /** Message shown to the user. */
  message?: string;
  /** Label for the exit button. */
  buttonLabel?: string;
  /** Callback when user dismisses the overlay. */
  onReady?: () => void;
  visible?: boolean;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

export function CrisisOverlay({
  message = 'Rest. Breathe. The mesh holds.',
  buttonLabel = "I'm Ready",
  onReady,
  visible = true,
  className = '',
  style,
}: CrisisOverlayProps) {
  const elementId = 'p31-crisis-overlay-react';
  const ref = (el: HTMLDivElement | null) => {
    if (!el) return;
    const wc = el as any;
    if (message) wc.setAttribute('message', message);
    if (buttonLabel) wc.setAttribute('button-label', buttonLabel);
    wc.addEventListener('p31-ready', () => onReady?.(), { once: true });
  };

  useEffect(() => {
    if (visible && typeof window !== 'undefined') {
      const html = document.documentElement as HTMLElement;
      html.setAttribute('data-spoons', '0');
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      ref={ref as any}
      id={elementId}
      className={className}
      style={style}
      data-testid="crisis-overlay"
    />
  );
}

export default CrisisOverlay;
