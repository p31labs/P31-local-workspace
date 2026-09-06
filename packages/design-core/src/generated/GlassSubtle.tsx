/**
 * @file GlassSubtle — Low-opacity glass surface with subtle blur.
 * Auto-generated from components.yml.
 *
 * @a2ui-component GlassSubtle
 * @a2ui-props children ReactNode - Surface contents
 * @a2ui-example {"component":"GlassSubtle","children":[{"component":"Button","label":"OK"}]}
 */

import type { ReactNode } from 'react';

export interface GlassSubtleProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function GlassSubtle({ children, className, style }: GlassSubtleProps) {
  const cls = `rounded-2xl border border-white/[0.04] backdrop-blur-lg bg-void-raised/40 shadow-[0_2px_8px_rgba(0,0,0,0.2)] ${className || ''}`;
  return <div className={cls} style={style}>{children}</div>;
}

export default GlassSubtle;
