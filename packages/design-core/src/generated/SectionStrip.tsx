/**
 * @file SectionStrip — Desktop pill navigation strip.
 * Auto-generated from components.yml. Router-agnostic: shell owns active state + navigation.
 */

import type { ReactNode, CSSProperties } from 'react';

export interface SectionItem {
  id: string;
  label: string;
  icon?: ReactNode;
  active?: boolean;
}

export interface SectionStripProps {
  items: SectionItem[];
  onSelect?: (id: string) => void;
  className?: string;
  style?: CSSProperties;
}

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
