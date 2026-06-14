import * as React from 'react';
import { cn } from './utils';

export interface NavItem {
  label: string;
  href: string;
  active?: boolean;
  icon?: React.ReactNode;
}

export interface NavbarProps extends React.HTMLAttributes<HTMLElement> {
  items: NavItem[];
  brand?: React.ReactNode;
  actions?: React.ReactNode;
  variant?: 'hub' | 'org';
}

export const Navbar = React.forwardRef<HTMLElement, NavbarProps>(
  ({ className, items, brand, actions, variant = 'hub', ...props }, ref) => {
    const [mobileOpen, setMobileOpen] = React.useState(false);

    return (
      <nav
        ref={ref}
        className={cn(
          'sticky top-0 z-sticky w-full backdrop-blur-md border-b',
          variant === 'hub'
            ? 'bg-hub-void/80 border-hub-cloud/10'
            : 'bg-org-void/80 border-org-cloud/10',
          className
        )}
        aria-label="Main navigation"
        {...props}
      >
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          {/* Brand */}
          {brand && <div className="flex-shrink-0">{brand}</div>}

          {/* Desktop nav */}
          <div className="hidden md:flex md:items-center md:gap-1">
            {items.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal/50',
                  item.active
                    ? variant === 'hub'
                      ? 'bg-hub-surface2 text-hub-cloud'
                      : 'bg-org-surface2 text-org-ink'
                    : 'text-hub-muted hover:text-hub-cloud hover:bg-hub-surface2'
                )}
                aria-current={item.active ? 'page' : undefined}
              >
                {item.icon}
                {item.label}
              </a>
            ))}
          </div>

          {/* Actions */}
          {actions && <div className="hidden md:flex md:items-center md:gap-2">{actions}</div>}

          {/* Mobile hamburger */}
          <button
            className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-hub-muted hover:text-hub-cloud hover:bg-hub-surface2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal/50"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-expanded={mobileOpen}
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-hub-cloud/10 bg-hub-void/95 backdrop-blur-md">
            <div className="space-y-1 px-4 py-3">
              {items.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'block rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    item.active
                      ? 'bg-hub-surface2 text-hub-cloud'
                      : 'text-hub-muted hover:text-hub-cloud hover:bg-hub-surface2'
                  )}
                  aria-current={item.active ? 'page' : undefined}
                >
                  <span className="flex items-center gap-2">
                    {item.icon}
                    {item.label}
                  </span>
                </a>
              ))}
              {actions && <div className="flex flex-col gap-2 pt-2">{actions}</div>}
            </div>
          </div>
        )}
      </nav>
    );
  }
);
Navbar.displayName = 'Navbar';
