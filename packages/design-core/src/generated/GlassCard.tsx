/**
 * @file GlassCard — Shared glassmorphic card (all 4 apps).
 * Uses design-core glass tokens. 'strong' variant for darker, more opaque glass.
 *
 * @a2ui-component GlassCard
 * @a2ui-props children ReactNode - Card contents
 * @a2ui-props className string - Optional CSS classes
 * @a2ui-props strong boolean - High-opacity variant
 * @a2ui-example {"component":"GlassCard","title":"Welcome","description":"Glass card body","color":"accent","actions":[{"label":"Learn More","action":"learn"}]}
 */

import type { ReactNode } from 'react';

export interface GlassCardProps {
  children: ReactNode;
  className?: string;
  strong?: boolean;
  style?: React.CSSProperties;
}

export function GlassCard({ children, className, strong, style }: GlassCardProps) {
  const cls = `rounded-2xl border border-white/[0.06] backdrop-blur-xl ${strong ? 'bg-void-raised/80 shadow-[0_8px_32px_rgba(0,0,0,0.4)]' : 'bg-void-raised/60 shadow-[0_4px_16px_rgba(0,0,0,0.3)]'} ${className || ''}`;
  return <div className={cls} style={style}>{children}</div>;
}

export default GlassCard;
