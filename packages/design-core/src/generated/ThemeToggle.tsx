/**
 * @file ThemeToggle — Dark/light theme toggle button. Persists to localStorage under p31:theme.
 * Auto-generated from components.yml.
 */

import type { ReactNode } from 'react';

export interface ThemeToggleProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function ThemeToggle({ children, className, style }: ThemeToggleProps) {
  return <div className={className} style={style}>{children}</div>;
}

export default ThemeToggle;
