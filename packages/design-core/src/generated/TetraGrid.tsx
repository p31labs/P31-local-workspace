/**
 * @file TetraGrid — 4-column responsive grid for tetrahedral content layouts.
 * Auto-generated from components.yml.
 */

import type { ReactNode } from 'react';

export interface TetraGridProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function TetraGrid({ children, className, style }: TetraGridProps) {
  return <div className={className} style={style}>{children}</div>;
}

export default TetraGrid;
