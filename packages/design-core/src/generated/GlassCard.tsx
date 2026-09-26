/**
 * @file GlassCard — Shared glassmorphic card (all 4 apps).
 * Uses design-core glass tokens. 'strong' variant for darker, more opaque glass.
 */

import type { ReactNode } from 'react';

export interface GlassCardProps {
  children: ReactNode;
  className?: string;
  strong?: boolean;
  style?: React.CSSProperties;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}

export function GlassCard({ children, className, strong, style, onClick }: GlassCardProps) {
  const cls = `rounded-2xl border border-white/[0.06] backdrop-blur-xl ${strong ? 'bg-void-raised/80 shadow-[0_8px_32px_color-mix(in_oklch,var(--p31-void)_40%,transparent)]' : 'bg-void-raised/60 shadow-[0_4px_16px_color-mix(in_oklch,var(--p31-void)_30%,transparent)]'} ${className || ''}`;
  return <div onClick={onClick} className={cls} style={style}>{children}</div>;
}

export default GlassCard;
