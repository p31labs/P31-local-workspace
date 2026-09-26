/**
 * @file PinKey — PIN pad key for the willow companion PIN overlay.
 * Auto-generated from components.yml.
 */

import type { ReactNode } from 'react';

export interface PinKeyProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function PinKey({ children, className, style }: PinKeyProps) {
  return <div className={className} style={style}>{children}</div>;
}

export default PinKey;
