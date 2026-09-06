/**
 * @file GlassPanel — Glassmorphic elevated surface with backdrop blur.
 * Auto-generated from components.yml.
 *
 * @a2ui-component GlassPanel
 * @a2ui-props children ReactNode - Panel contents
 * @a2ui-props padding "sm" | "md" | "lg" - Padding tier
 * @a2ui-example {"component":"GlassPanel","padding":"lg","children":[{"component":"CandyHeader"}]}
 */

import type { ReactNode } from 'react';

export interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  style?: React.CSSProperties;
}

export function GlassPanel({ children, className, padding = 'md', style }: GlassPanelProps) {
  const paddingClasses = { sm: 'p-4', md: 'p-6', lg: 'p-8' };
  const cls = `${paddingClasses[padding]} rounded-2xl border border-white/[0.06] backdrop-blur-xl bg-void-raised/60 shadow-[0_4px_16px_rgba(0,0,0,0.3)] ${className || ''}`;
  return <div className={cls} style={style}>{children}</div>;
}

export default GlassPanel;
