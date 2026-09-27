/**
 * @file WillowShell.tsx — WILLOW mobile shell (canonical ConversationShell).
 *
 * Uses the canonical ConversationShell layout from @p31ca/ui.
 * Starfield + tab routing + CrisisOverlay + CaregiverPortal.
 * Single-screen tab state (home, draw, portal, quests, buddy).
 */

import { useEffect, useRef, useState } from 'react';
import { mountStarfield } from '@p31ca/design-core/starfield';
import type { StarfieldInstance } from '@p31ca/design-core';
import { useWillowStore } from '../store/willowStore';
import { ConversationShell } from '@p31ca/ui';
import { CrisisOverlay } from './CrisisOverlay';
import { DrawScreen } from '../features/draw/DrawScreen';
import { PortalScreen } from '../features/portal/PortalScreen';
import { QuestsScreen } from '../features/quests/QuestsScreen';
import { CompanionChat } from '../features/buddy/CompanionChat';
import { ChatSurface } from '../features/chat/components/ChatSurface';
import { PinGate } from './PinGate';
import { CaregiverPortal } from '../features/portal/CaregiverPortal';
import { EphemeralProvider } from '@p31ca/ui';

type TabId = 'home' | 'draw' | 'portal' | 'quests' | 'buddy';
type PortalStage = 'closed' | 'pin' | 'open';

const TAB_LINKS: Array<{ href: string; label: string }> = [
  { href: '/', label: 'Chat' },
  { href: '/draw', label: 'Draw' },
  { href: '/portal', label: 'Portal' },
  { href: '/quests', label: 'Quests' },
  { href: '/buddy', label: 'Buddy' },
];

function hrefToTab(href: string): TabId {
  const map: Record<string, TabId> = {
    '/': 'home',
    '/draw': 'draw',
    '/portal': 'portal',
    '/quests': 'quests',
    '/buddy': 'buddy',
  };
  return map[href] || 'home';
}

function hashToTab(hash: string): TabId {
  if (hash.startsWith('#')) hash = hash.slice(1);
  const map: Record<string, TabId> = {
    '': 'home',
    home: 'home',
    draw: 'draw',
    portal: 'portal',
    quests: 'quests',
    buddy: 'buddy',
  };
  return map[hash] || 'home';
}

function tabToHash(tab: TabId): string {
  const map: Record<TabId, string> = {
    home: '#',
    draw: '#draw',
    portal: '#portal',
    quests: '#quests',
    buddy: '#buddy',
  };
  return map[tab] || '#';
}

export function WillowShell() {
  const [tab, setTab] = useState<TabId>(() => {
    if (typeof window !== 'undefined') return hashToTab(window.location.hash);
    return 'home';
  });
  const [portalStage, setPortalStage] = useState<PortalStage>('closed');
  const sfRef = useRef<StarfieldInstance | null>(null);
  const spoons = useWillowStore((s) => s.spoons);

  const starfieldRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sfRef.current && starfieldRef.current) {
      sfRef.current = mountStarfield(starfieldRef.current, { spoons });
      sfRef.current.setConfig({ baseAlpha: 0.85, count: 180, speed: 0.12, connR: 110, tealGlowA: 0.15, hearthA: 0.25 });
    }
    return () => { sfRef.current?.destroy(); sfRef.current = null; };
  }, []);

  useEffect(() => {
    sfRef.current?.setSpoons(spoons);
    if (spoons >= 2 && sfRef.current) {
      sfRef.current.setConfig({ baseAlpha: 0.85, count: 180, speed: 0.12, connR: 110, tealGlowA: 0.15, hearthA: 0.25 });
    }
  }, [spoons]);

  useEffect(() => {
    const onReady = () => useWillowStore.getState().setSpoons(3);
    document.addEventListener('p31-ready', onReady as EventListener);
    return () => document.removeEventListener('p31-ready', onReady as EventListener);
  }, []);

  // Hash routing — sync browser history with tab state
  useEffect(() => {
    const onHashChange = () => setTab(hashToTab(window.location.hash));
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const handleNavClick = (href: string) => {
    const nextTab = hrefToTab(href);
    setTab(nextTab);
    window.location.hash = tabToHash(nextTab);
  };

  return (
    <div
      className="min-h-screen flex flex-col font-sans"
      style={{
        position: 'relative',
        background: 'var(--p31-void, #0A0A0F)',
        color: 'var(--p31-text-primary, #F5F5F7)',
        overflowX: 'hidden',
      }}
    >
      {/* Starfield — full viewport, behind everything */}
      <div ref={starfieldRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', opacity: 1 }} />

      {/* Canonical ConversationShell — handles SiteNav + content area */}
      <ConversationShell
        brand="willow"
        navLinks={TAB_LINKS}
        onNavClick={handleNavClick}
        spoonMode="compact"
        showAuth={true}
        showMenu={true}
        gitRepoUrl="https://github.com/p31labs"
      >
        <EphemeralProvider ambientMode="soft">
          {tab === 'home' && <ChatSurface />}
          {tab === 'draw' && <DrawScreen />}
          {tab === 'portal' && <PortalScreen />}
          {tab === 'quests' && <QuestsScreen />}
          {tab === 'buddy' && <CompanionChat />}
        </EphemeralProvider>
      </ConversationShell>

      <CrisisOverlay />

      {portalStage === 'pin' && (
        <PinGate
          onUnlock={() => setPortalStage('open')}
          onClose={() => setPortalStage('closed')}
        />
      )}
      {portalStage === 'open' && (
        <CaregiverPortal onClose={() => setPortalStage('closed')} />
      )}
    </div>
  );
}
