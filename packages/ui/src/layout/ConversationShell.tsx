/**
 * @file ConversationShell — Chat/AI companion layout.
 * Canonical structural shell for willow.
 * Enforces: 100dvh lock, sticky SiteNav, scrollable middle, docked input bar.
 */

import type { ReactNode } from 'react';
import { SiteNav } from '../chrome/SiteNav';
import type { SiteNavLink } from '../chrome/SiteNav';

export interface ConversationShellProps {
  children: ReactNode;
  navLinks: SiteNavLink[];
  brand?: 'p31ca' | 'phosphorus' | 'phos' | 'willow';
  onNavClick?: (href: string) => void;
  inputBar?: ReactNode;
  spoonMode?: 'compact' | 'icon' | 'full' | 'pips' | 'button';
  showAuth?: boolean;
  showMenu?: boolean;
  gitRepoUrl?: string;
}

export function ConversationShell({
  children,
  navLinks,
  brand = 'willow',
  onNavClick,
  inputBar,
  spoonMode = 'icon',
  showAuth = true,
  showMenu = true,
  gitRepoUrl = 'https://github.com/p31labs',
}: ConversationShellProps) {
  return (
    <div
      className="flex flex-col h-dvh w-full overflow-hidden"
      style={{
        backgroundColor: 'var(--p31-void, #0A0A0F)',
        color: 'var(--p31-text-primary, #F5F5F7)',
      }}
      data-mcp-tool="conversationShell"
      data-mcp-state="ready"
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
        className="flex-1 overflow-y-auto min-w-0 flex flex-col"
        style={{
          padding: 'var(--p31-space-md, 16px)',
        }}
        data-mcp-tool="conversationRegion"
        data-mcp-target="chat-messages"
      >
        <div
          className="flex flex-col gap-4 min-w-0 w-full"
          style={{
            maxWidth: 'var(--p31-conversation-w, 720px)',
            margin: '0 auto',
          }}
        >
          {children}
        </div>
      </main>

      {inputBar && (
        <footer
          className="w-full shrink-0"
          style={{
            borderTop: '1px solid var(--p31-glass-border, rgba(255,255,255,0.08))',
          }}
          data-mcp-tool="chatInputBar"
          data-mcp-target="chat-input-bar"
        >
          <div
            className="w-full"
            style={{
              maxWidth: 'var(--p31-conversation-w, 720px)',
              margin: '0 auto',
              padding: 'var(--p31-space-sm, 8px) var(--p31-space-md, 16px)',
            }}
          >
            {inputBar}
          </div>
        </footer>
      )}
    </div>
  );
}

export default ConversationShell;
