/**
 * @file GlassStrong — High-opacity glass surface with strong blur.
 * Auto-generated from components.yml.
 */

import type { ReactNode } from 'react';

export interface GlassStrongProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function GlassStrong({ children, className, style }: GlassStrongProps) {
  const cls = `rounded-2xl border border-white/[0.08] backdrop-blur-2xl bg-void-raised/80 shadow-[0_8px_32px_color-mix(in_oklch,var(--p31-void)_40%,transparent)] ${className || ''}`;
  return <div className={cls} style={style}>{children}</div>;
}

export default GlassStrong;
