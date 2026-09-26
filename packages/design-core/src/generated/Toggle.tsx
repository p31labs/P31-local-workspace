/**
 * @file Toggle — Binary toggle switch for settings pages.
 * Auto-generated from components.yml.
 */

import type { ReactNode } from 'react';

export interface ToggleProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function Toggle({ children, className, style }: ToggleProps) {
  return <div className={className} style={style}>{children}</div>;
}

export default Toggle;
