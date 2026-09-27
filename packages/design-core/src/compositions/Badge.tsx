import React from 'react';
import type { CSSProperties, ReactNode } from 'react';

export type BadgeTone = 'success' | 'warning' | 'error' | 'info' | 'neutral';

export interface BadgeProps {
  /** Semantic tone — maps to a tinted pill (success/gold/red/accent/neutral). */
  tone?: BadgeTone;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

/**
 * Badge — compact status pill. Uses the shared `.badge` recipe base + a
 * data-tone modifier for the tint (crisis mode keeps colors but forces
 * opaque surfaces via the canon crisis rules).
 */
export function Badge({ tone = 'neutral', children, className = '', style }: BadgeProps) {
  return (
    <span className={`badge ${className}`.trim()} data-tone={tone} style={style}>
      {children}
    </span>
  );
}

export default Badge;