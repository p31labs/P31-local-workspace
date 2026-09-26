/**
 * @file Topbar — Fixed glass navigation header.
 * Auto-generated from components.yml.
 */

import type { ReactNode } from 'react';

export interface TopbarProps {
  brand?: ReactNode;
  left?: ReactNode;
  center?: ReactNode;
  right?: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function Topbar({ brand, left, center, right, className, style }: TopbarProps) {
  const cls = `topbar glass-navbar ${className || ''}`;
  return (
    <header className={cls} style={style}>
      <div className="topbar-left">{brand || left}</div>
      <div className="topbar-center">{center}</div>
      <div className="topbar-right">{right}</div>
    </header>
  );
}

export default Topbar;
