import React from 'react';
import type { CSSProperties } from 'react';

export interface CrownProps {
  /** Optional visible label beside the mark. */
  label?: string;
  className?: string;
  style?: CSSProperties;
}

/**
 * Crown — the P31 crown mark (decorative). The SVG is aria-hidden; if a
 * `label` is provided it is the accessible content of the element.
 */
export function Crown({ label, className = '', style }: CrownProps) {
  return (
    <span className={`crown ${className}`.trim()} style={style}>
      <svg viewBox="0 0 64 48" width="36" height="28" aria-hidden="true">
        <path d="M8 40 L12 20 L24 30 L32 8 L40 30 L52 20 L56 40 Z" fill="currentColor" />
        <rect x="8" y="41" width="48" height="6" rx="3" fill="currentColor" />
        <circle cx="12" cy="14" r="2.5" fill="currentColor" />
        <circle cx="32" cy="6" r="2.5" fill="currentColor" />
        <circle cx="52" cy="14" r="2.5" fill="currentColor" />
      </svg>
      {label && <span className="crown__label">{label}</span>}
    </span>
  );
}

export default Crown;