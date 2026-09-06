/**
 * @file GlassStrong — High-opacity glass surface with strong blur.
 * Auto-generated from components.yml.
 *
 * @a2ui-component GlassStrong
 * @a2ui-props children ReactNode - Surface contents
 * @a2ui-example {"component":"GlassStrong","children":[{"component":"Button","label":"Confirm"}]}
 */

import type { ReactNode } from 'react';

export interface GlassStrongProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function GlassStrong({ children, className, style }: GlassStrongProps) {
  const cls = `rounded-2xl border border-white/[0.08] backdrop-blur-2xl bg-void-raised/80 shadow-[0_8px_32px_rgba(0,0,0,0.4)] ${className || ''}`;
  return <div className={cls} style={style}>{children}</div>;
}

export default GlassStrong;
