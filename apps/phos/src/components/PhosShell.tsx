/**
 * @file PhosShell.tsx — PHOS adult-workspace shell (Track B, CWP-2026-072).
 *
 * Uses the canonical WorkspaceShell layout from @p31ca/ui.
 * Crisis overlay is the design-core web component, always rendered (visibility
 * controlled by data-spoons via CSS). Starfield, device-class, and the p31-ready
 * listener remain at the App root (see main.tsx).
 */

import { Outlet, useNavigate } from 'react-router-dom';
import { SkipLink } from '../shared/ui';
import { WorkspaceShell } from '@p31ca/ui';
import type { SiteNavLink } from '@p31ca/ui/chrome';
import { EphemeralProvider } from '@p31ca/ui';

const NAV_LINKS: SiteNavLink[] = [
  { href: '/', label: 'Conversation' },
  { href: '/hearth', label: 'Hearth' },
  { href: '/passport', label: 'Passport' },
  { href: '/vault', label: 'Vault' },
  { href: '/ledger', label: 'Ledger' },
];

export function PhosShell() {
  const navigate = useNavigate();

  return (
    <>
      <SkipLink />
      <WorkspaceShell
        brand="phos"
        navLinks={NAV_LINKS}
        onNavClick={(href) => navigate(href)}
        spoonMode="icon"
        showAuth={true}
        showMenu={true}
        gitRepoUrl="https://github.com/p31labs"
      >
        <EphemeralProvider ambientMode="soft">
          <Outlet />
        </EphemeralProvider>
      </WorkspaceShell>
      <p31-crisis-overlay
        message="Take a breath. The mesh holds. You're safe."
        button-label="I'm ready"
      />
    </>
  );
}
