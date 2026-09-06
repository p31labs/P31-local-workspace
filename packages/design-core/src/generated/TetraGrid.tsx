/**
 * @file TetraGrid — 4-column responsive grid for tetrahedral content layouts.
 * Auto-generated from components.yml.
 *
 * @a2ui-component TetraGrid
 * @a2ui-props children array<object> - Child components
 * @a2ui-example {"component":"TetraGrid","children":[{"component":"GlassCard","title":"One"}]}
 */

import type { ReactNode } from 'react';

export interface TetraGridProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function TetraGrid({ children, className, style }: TetraGridProps) {
  const cls = `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className || ''}`;
  return <div className={cls} style={style}>{children}</div>;
}

export default TetraGrid;
