import React from 'react';
import type { ReactNode, CSSProperties } from 'react';

export interface TopbarProps {
  brand?: ReactNode;
  /** Left section (spec). Alias for `brand` in legacy usage. */
  left?: ReactNode;
  center?: ReactNode;
  right?: ReactNode;
  className?: string;
  /** Apply glassmorphic background (default true). */
  glass?: boolean;
  style?: CSSProperties;
}

export function Topbar({ brand, left, center, right, className = '', glass = true, style }: TopbarProps) {
  const cls = ['topbar', glass ? 'glass-navbar' : '', className].filter(Boolean).join(' ');

  return (
    <header className={cls} style={style}>
      <div className="topbar-left">{brand ?? left}</div>
      {center && <div className="topbar-center">{center}</div>}
      <div className="topbar-right">{right}</div>
    </header>
  );
}

export default Topbar;
