/**
 * @file GlassSubtle — Low-opacity glass surface with subtle blur.
 * Auto-generated from components.yml.
 */

import type { ReactNode } from 'react';

export interface GlassSubtleProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function GlassSubtle({ children, className, style }: GlassSubtleProps) {
  const cls = `rounded-2xl border border-white/[0.06] backdrop-blur-xl bg-void-raised/60 shadow-[0_4px_16px_color-mix(in_oklch,var(--p31-void)_30%,transparent)] ${className || ''}`;
  return <div className={cls} style={style}>{children}</div>;
}

export default GlassSubtle;
