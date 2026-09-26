/**
 * @file CandyHeader — Canonical P31 candy-pill header bar with phosphorous-green glass, cyan border, and glow shadow.
 * Auto-generated from components.yml.
 */

import type { ReactNode } from 'react';

export interface CandyHeaderProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function CandyHeader({ children, className, style }: CandyHeaderProps) {
  return <div className={className} style={style}>{children}</div>;
}

export default CandyHeader;
