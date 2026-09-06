/**
 * @file AppNav — Canonical header for P31 SPAs (PHOS + WILLOW).
 *
 * Identical across both apps. BrandMark + optional nav links + SpoonDial + companion trigger.
 */

import type { ReactNode } from 'react';
import { BrandMark } from './BrandMark';
import { SpoonDial } from './SpoonDial';

export interface AppNavProps {
  appName: string;
  tagline?: string;
  icon?: string;
  spoons: number;
  setSpoons: (n: number) => void;
  onCompanion: () => void;
  navLinks?: ReactNode;
}

export function AppNav({ appName, tagline, icon, spoons, setSpoons, onCompanion, navLinks }: AppNavProps) {
  return (
    <nav
      className="ui-chrome glass-strong fixed top-0 left-0 right-0 z-50 px-6 py-3 flex items-center justify-between"
      style={{ borderRadius: 0, height: 'var(--p31-nav-h)' }}
    >
      <a href="/" className="group" style={{ textDecoration: 'none' }}>
        <BrandMark appName={appName} tagline={tagline} icon={icon} />
      </a>

      {navLinks && (
        <div className="hidden md:flex items-center gap-5 text-sm font-mono">
          {navLinks}
        </div>
      )}

      <div className="flex items-center gap-2">
        <SpoonDial spoons={spoons} setSpoons={setSpoons} />
        <button
          onClick={onCompanion}
          aria-label="Open companion"
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-cloud/20 text-mist hover:text-ink hover:border-quantum-cyan/40 transition-all text-sm"
        >
          ?
        </button>
      </div>
    </nav>
  );
}

export default AppNav;
