import React from 'react';
import type { ReactNode, CSSProperties } from 'react';

export interface NavItem {
  icon?: ReactNode;
  label: string;
  href?: string;
  onClick?: () => void;
  active?: boolean;
}

export interface BottomNavProps {
  /** Structured navigation items (spec). */
  items?: NavItem[];
  /** Currently active item index. */
  activeIndex?: number;
  onChange?: (index: number) => void;
  className?: string;
  style?: CSSProperties;
  /** @deprecated pass children for legacy usage */
  children?: ReactNode;
}

export function BottomNav({ items, activeIndex = 0, onChange, className = '', style, children }: BottomNavProps) {
  if (children) {
    return (
      <nav className={`bottom-nav ${className}`.trim()} aria-label="Primary" style={style}>
        {children}
      </nav>
    );
  }

  const safeActive = Math.min(activeIndex, (items || []).length - 1);

  return (
    <nav className={`bottom-nav ${className}`.trim()} role="tablist" aria-label="Primary" style={style}>
      {(items || []).map((item, i) => {
        const isActive = i === safeActive;
        const common = {
          className: `nav-item${isActive ? ' active' : ''}`,
          'aria-current': isActive ? ('page' as const) : undefined,
          onClick: () => {
            onChange?.(i);
            item.onClick?.();
          },
        };
        if (item.href) {
          return <a key={i} href={item.href} {...common}>{item.icon}{item.label}</a>;
        }
        return <button key={i} type="button" {...common}>{item.icon}{item.label}</button>;
      })}
    </nav>
  );
}

export default BottomNav;
