import React from 'react';
import type { ReactNode, CSSProperties } from 'react';

export interface SectionItem {
  id: string;
  label: string;
  icon?: ReactNode;
  active?: boolean;
}

export interface SectionStripProps {
  /** Navigation sections (spec). */
  items: SectionItem[];
  /** Called with the section id when the user selects one. */
  onSelect?: (id: string) => void;
  className?: string;
  style?: CSSProperties;
}

/**
 * Desktop pill navigation — the "section strip".
 * Router-agnostic: pass active state + selection callback from the shell.
 * Mobile UIs use BottomNav instead (by recipe).
 */
export function SectionStrip({ items, onSelect, className = '', style }: SectionStripProps) {
  return (
    <nav className={`section-strip ${className}`.trim()} aria-label="Design system sections" style={style}>
      {items.map((s) => (
        <button
          key={s.id}
          type="button"
          className={`section-tab${s.active ? ' is-active' : ''}`}
          onClick={() => onSelect?.(s.id)}
          aria-current={s.active ? 'page' : undefined}
        >
          {s.icon}
          {s.label}
        </button>
      ))}
    </nav>
  );
}

export default SectionStrip;