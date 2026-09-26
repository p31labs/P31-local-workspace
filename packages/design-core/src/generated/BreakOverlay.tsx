/**
 * @file BreakOverlay — Full-screen break timer overlay for the willow companion.
 * Auto-generated from components.yml.
 */

import type { ReactNode } from 'react';

export interface BreakOverlayProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function BreakOverlay({ children, className, style }: BreakOverlayProps) {
  return <div className={className} style={style}>{children}</div>;
}

export default BreakOverlay;
