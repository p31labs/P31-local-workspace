/**
 * @file LandingShell — Marketing/informational page layout.
 * Canonical structural shell for p31ca, phosphorus31.
 * Enforces: sticky SiteNav, centered max-width content, footer.
 */

import type { ReactNode } from 'react';
import { SiteNav } from '../chrome/SiteNav';
import type { SiteNavLink } from '../chrome/SiteNav';
import { LayoutFooter } from './LayoutFooter';

export interface LandingShellProps {
  children: ReactNode;
  navLinks: SiteNavLink[];
  brand?: 'p31ca' | 'phosphorus' | 'phos' | 'willow';
  onNavClick?: (href: string) => void;
  footerCopyright?: string;
  spoonMode?: 'compact' | 'icon' | 'full' | 'pips' | 'button';
  showAuth?: boolean;
  showMenu?: boolean;
  gitRepoUrl?: string;
}

export function LandingShell({
  children,
  navLinks,
  brand = 'p31ca',
  onNavClick,
  footerCopyright,
  spoonMode = 'full',
  showAuth = true,
  showMenu = true,
  gitRepoUrl = 'https://github.com/p31labs',
}: LandingShellProps) {
  return (
    <div
      className="flex flex-col min-h-screen w-full overflow-x-hidden"
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
      />

      <main
        id="main-content"
        className="flex-1 flex flex-col min-w-0"
        style={{
          maxWidth: 'var(--p31-max-width-lg, 1200px)',
          width: '100%',
          margin: '0 auto',
          paddingTop: 'var(--p31-space-xl, 40px)',
          paddingBottom: 'var(--p31-space-xl, 40px)',
          paddingLeft: 'var(--p31-space-md, 16px)',
          paddingRight: 'var(--p31-space-md, 16px)',
        }}
      >
        {children}
      </main>

      <LayoutFooter
        copyright={footerCopyright}
        style={{
          borderTop: '1px solid var(--p31-glass-border, rgba(255,255,255,0.08))',
        }}
      />
    </div>
  );
}

export default LandingShell;
