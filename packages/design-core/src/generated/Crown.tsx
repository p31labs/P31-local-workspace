/**
 * @file Crown — Animated tetrahedral crown brand glyph for header and brand surfaces.
 * Auto-generated from components.yml.
 */

import type { ReactNode } from 'react';

export interface CrownProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function Crown({ children, className, style }: CrownProps) {
  return <div className={className} style={style}>{children}</div>;
}

export default Crown;
