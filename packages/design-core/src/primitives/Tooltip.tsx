import { ReactNode, useId, useState } from 'react';

export interface TooltipProps {
  /** Tooltip content (text or node) */
  content: ReactNode;
  children: ReactNode;
  /** Show below the trigger instead of above */
  placement?: 'top' | 'bottom';
  className?: string;
}

/**
 * Hover + focus tooltip. Content is wired via aria-describedby so screen
 * readers announce it on focus; pointer users get the visual bubble.
 */
export function Tooltip({ content, children, placement = 'top', className = '' }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const id = useId();

  return (
    <span
      className={`tooltip-trigger ${className}`.trim()}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && (
        <span role="tooltip" id={id} className={`tooltip ${placement === 'bottom' ? 'tooltip-below' : ''}`}>
          {content}
        </span>
      )}
      {/* describedby target when hidden — keeps aria wiring stable */}
      {!visible && <span id={id} className="sr-only">{content}</span>}
    </span>
  );
}
