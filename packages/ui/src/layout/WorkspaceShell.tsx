/**
 * @file WorkspaceShell — Tool/dashboard layout.
 * Canonical structural shell for phos.
 * Enforces: sticky SiteNav, optional docked sidebar, scrollable content.
 */

import { useState } from 'react';
import { SiteNav } from '../chrome/SiteNav';
import type { SiteNavLink } from '../chrome/SiteNav';

export interface WorkspaceShellProps {
  children: ReactNode;
  navLinks: SiteNavLink[];
  brand?: 'p31ca' | 'phosphorus' | 'phos' | 'willow';
  onNavClick?: (href: string) => void;
  sidebar?: ReactNode;
  spoonMode?: 'compact' | 'icon' | 'full' | 'pips' | 'button';
  showAuth?: boolean;
  showMenu?: boolean;
  gitRepoUrl?: string;
}

export function WorkspaceShell({
  children,
  navLinks,
  brand = 'phos',
  onNavClick,
  sidebar,
  spoonMode = 'icon',
  showAuth = true,
  showMenu = true,
  gitRepoUrl = 'https://github.com/p31labs',
}: WorkspaceShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div
      className="flex flex-col h-dvh w-full overflow-hidden"
      style={{
        backgroundColor: 'var(--p31-void, #0A0A0F)',
        color: 'var(--p31-text-primary, #F5F5F7)',
      }}
    >
      <SiteNav
        navLinks={navLinks}
        brand={brand}
        onNavClick={onNavClick}
        spoonMode={spoonMode}
        showAuth={showAuth}
        showMenu={showMenu}
        gitRepoUrl={gitRepoUrl}
        headerActions={
          sidebar ? (
            <button
              className="md:hidden p-2.5 rounded-lg border border-white/10 text-white/80 hover:bg-white/5 transition-colors min-h-[48px] min-w-[48px] flex items-center justify-center"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M3 5h14M3 10h14M3 15h10" />
              </svg>
            </button>
          ) : undefined
        }
      />

      <div className="flex flex-1 min-h-0 w-full overflow-hidden">
        {/* Desktop sidebar */}
        {sidebar && (
          <aside
            className="flex-col border-r overflow-y-auto shrink-0 hidden md:flex"
            style={{
              width: 'var(--p31-sidebar-w, 260px)',
              backgroundColor: 'var(--p31-surface, #12121A)',
              borderColor: 'var(--p31-glass-border, rgba(255,255,255,0.08))',
            }}
          >
            {sidebar}
          </aside>
        )}

        {/* Mobile sidebar overlay */}
        {sidebar && sidebarOpen && (
          <div
            className="md:hidden fixed inset-0 z-[var(--p31-z-nav-drawer,50)] bg-black/60"
            onClick={() => setSidebarOpen(false)}
          >
            <aside
              className="absolute left-0 top-14 bottom-0 w-64 overflow-y-auto border-r"
              style={{
                backgroundColor: 'var(--p31-surface, #12121A)',
                borderColor: 'var(--p31-glass-border, rgba(255,255,255,0.08))',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {sidebar}
            </aside>
          </div>
        )}

        <main
          id="main-content"
          className="flex-1 overflow-y-auto min-w-0 flex flex-col"
          style={{
            padding: 'var(--p31-space-md, 16px)',
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

export default WorkspaceShell;
