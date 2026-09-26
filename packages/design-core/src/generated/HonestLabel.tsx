/**
 * @file HonestLabel — Disclaimer badge for contested-science content.
 * Auto-generated from components.yml.
 */

import type { ReactNode } from 'react';

export interface HonestLabelProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function HonestLabel({ children, className, style }: HonestLabelProps) {
  return <div className={className} style={style}>{children}</div>;
}

export default HonestLabel;
