/**
 * @file Badge — Compact status or metric badge with optional dot indicator.
 * Auto-generated from components.yml.
 */

import type { ReactNode } from 'react';

export interface BadgeProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function Badge({ children, className, style }: BadgeProps) {
  return <div className={className} style={style}>{children}</div>;
}

export default Badge;
