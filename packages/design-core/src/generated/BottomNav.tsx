/**
 * @file BottomNav — Fixed bottom navigation bar for mobile-first apps.
 * Auto-generated from components.yml.
 */

import type { ReactNode } from 'react';

export interface NavItem {
  icon: ReactNode;
  label: string;
  href: string;
  active?: boolean;
}

export interface BottomNavProps {
  items: NavItem[];
  activeIndex?: number;
  className?: string;
}

export function BottomNav({ items, activeIndex = 0, className }: BottomNavProps) {
  return (
    <nav className={`bottom-nav ${className || ''}`} role="navigation" aria-label="Main">
      {items.map((item, i) => (
        <a
          key={i}
          href={item.href}
          className={`nav-item ${i === activeIndex ? 'active' : ''}`}
          aria-current={i === activeIndex ? 'page' : undefined}
        >
          {item.icon}
          <span>{item.label}</span>
        </a>
      ))}
    </nav>
  );
}

export default BottomNav;
