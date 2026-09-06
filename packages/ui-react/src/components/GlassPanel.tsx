import React from 'react';
import type { ReactNode, CSSProperties } from 'react';

type PaddingSize = 'sm' | 'md' | 'lg';
const PADDING_CLASSES: Record<PaddingSize, string> = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export interface GlassPanelProps {
  children?: ReactNode;
  className?: string;
  /** Padding size (spec). Defaults to "md". */
  padding?: PaddingSize;
  /** Use stronger glass opacity (spec). */
  strong?: boolean;
  /** @deprecated use strong */
  hover?: boolean;
  style?: CSSProperties;
}

export function GlassPanel({ children, className = '', padding = 'md', strong = false, hover, style }: GlassPanelProps) {
  const classes = [
    strong ? 'glass-strong' : 'glass-panel',
    hover ? 'glass-panel--hover' : '',
    PADDING_CLASSES[padding],
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} style={style}>{children}</div>
  );
}

export default GlassPanel;
