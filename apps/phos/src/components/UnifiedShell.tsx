import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useAtmosphere } from './AtmosphereProvider';
import { SpoonSlider } from './ui/SpoonSlider';
import { StatusBadge } from './ui/StatusBadge';
import { AccentToggle } from './ui/AccentToggle';
import { DyslexiaToggle } from './ui/DyslexiaToggle';
import { AmbientManager } from './AmbientManager';
import type { SpoonLevel } from '../hooks/useSpoonMotion';

type Role = 'family' | 'caregiver' | 'operator' | 'developer';

interface RoleConfig {
  label: string;
  surfaces: string[];
  description: string;
}

const ROLES: Record<Role, RoleConfig> = {
  family: {
    label: 'Family',
    surfaces: ['PASSPORT', 'PQC_KEYS', 'CARE_MINT', 'SANCTUARY', 'HEARTH', 'SETTINGS'],
    description: 'Sovereign care interface for families',
  },
  caregiver: {
    label: 'Caregiver',
    surfaces: ['PASSPORT', 'PQC_KEYS', 'CARE_MINT', 'HEARTH', 'ATTEST', 'FEEDBACK', 'SETTINGS'],
    description: 'Care attestation and monitoring',
  },
  operator: {
    label: 'Operator',
    surfaces: ['DASHBOARD', 'GOVERNANCE', 'LEDGER', 'ARCADE', 'WAREHOUSE', 'SETTINGS'],
    description: 'Pilot dashboard and operations',
  },
  developer: {
    label: 'Developer',
    surfaces: [
      'GREETING', 'IGNITION', 'BONDING', 'THE_BUFFER', 'VAULT', 'GRID',
      'NODE_ZERO', 'LEDGER', 'HEARTH', 'ARCADE', 'COMPASS', 'SETTINGS',
      'WAREHOUSE', 'PQC_KEYS', 'DASHBOARD', 'ATTEST', 'PASSPORT',
    ],
    description: 'Full access to all surfaces',
  },
};

const SURFACE_LABELS: Record<string, string> = {
  GREETING: 'Welcome',
  IGNITION: 'Launch',
  BONDING: 'Bonding',
  THE_BUFFER: 'Buffer',
  VAULT: 'Vault',
  GRID: 'Grid',
  NODE_ZERO: 'Node 0',
  LEDGER: 'Ledger',
  HEARTH: 'Hearth',
  ARCADE: 'Arcade',
  COMPASS: 'Compass',
  SETTINGS: 'Settings',
  WAREHOUSE: 'Warehouse',
  PASSPORT: 'Passport',
  PQC_KEYS: 'PQC Keys',
  CARE_MINT: 'Care Mint',
  SANCTUARY: 'Sanctuary',
  DASHBOARD: 'Dashboard',
  GOVERNANCE: 'Governance',
  ATTEST: 'Attest',
  FEEDBACK: 'Feedback',
};

function getInitialRole(): Role {
  try {
    const stored = localStorage.getItem('p31-role');
    if (stored && stored in ROLES) return stored as Role;
  } catch { /* noop */ }
  return 'family';
}

function getInitialAccent(): 'cyan' | 'violet' | 'emerald' | 'amber' {
  try {
    const stored = localStorage.getItem('p31-accent');
    if (stored && ['cyan', 'violet', 'emerald', 'amber'].includes(stored)) {
      return stored as 'cyan' | 'violet' | 'emerald' | 'amber';
    }
  } catch { /* noop */ }
  return 'cyan';
}

/**
 * UnifiedShell — single entry point for the P31 ecosystem.
 * Merges PHOS (sovereign UX) + Pilot Dashboard + Sovereign Agent
 * into one role-based, responsive, spoon-aware interface.
 */
export function UnifiedShell() {
  const { spoons, setSpoons, currentSurface, setSurface } = useAtmosphere();
  const [role, setRole] = useState<Role>(getInitialRole);
  const [accent, setAccent] = useState<'cyan' | 'violet' | 'emerald' | 'amber'>(getInitialAccent);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const surfaces = useMemo(() => ROLES[role].surfaces, [role]);

  useEffect(() => {
    try { localStorage.setItem('p31-role', role); } catch { /* noop */ }
  }, [role]);

  useEffect(() => {
    try { localStorage.setItem('p31-accent', accent); } catch { /* noop */ }
  }, [accent]);

  const handleSurfaceClick = useCallback((surface: string) => {
    setSurface(surface);
    setSidebarOpen(false);
  }, [setSurface]);

  return (
    <div className="min-h-screen bg-void text-text-primary font-sans flex flex-col">
      {/* Skip link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[10000]
          focus:px-4 focus:py-2 focus:bg-quantum-cyan focus:text-void focus:rounded-[12px]"
      >
        Skip to main content
      </a>

      {/* Ambient effects */}
      <AmbientManager spoons={spoons as SpoonLevel} onCrisisExit={() => setSpoons(3)} />

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/[0.04] backdrop-blur-[12px] border-b border-white/[0.08]">
        <div className="max-w-[1200px] mx-auto px-4 h-14 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden w-10 h-10 flex items-center justify-center rounded-[12px] hover:bg-white/5 transition-colors"
              aria-label={sidebarOpen ? 'Close navigation' : 'Open navigation'}
              aria-expanded={sidebarOpen}
            >
              <span className="text-lg" aria-hidden="true">{sidebarOpen ? '✕' : '☰'}</span>
            </button>
            <span className="font-mono text-sm text-quantum-cyan tracking-tight">P31</span>
          </div>

          {/* Role selector */}
          <div className="hidden sm:flex items-center gap-1">
            {(Object.keys(ROLES) as Role[]).map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`
                  px-3 py-1.5 text-[12px] font-mono rounded-full transition-all duration-200
                  ${r === role
                    ? 'bg-quantum-cyan/15 text-quantum-cyan border border-quantum-cyan/30'
                    : 'text-white/40 hover:text-white/60 border border-transparent'}
                `}
                aria-pressed={r === role}
              >
                {ROLES[r].label}
              </button>
            ))}
          </div>

          {/* Spoon slider + status */}
          <div className="hidden md:flex items-center gap-4">
            <SpoonSlider value={spoons} onChange={(v) => setSpoons(v as SpoonLevel)} />
            <StatusBadge status="ok" label="Connected" />
          </div>
        </div>
      </header>

      {/* ── Layout ───────────────────────────────────────────────────────── */}
      <div className="flex-1 flex max-w-[1200px] mx-auto w-full">
        {/* Sidebar */}
        <nav
          className={`
            fixed lg:static inset-y-14 left-0 z-40 w-64
            bg-white/[0.03] backdrop-blur-[12px] border-r border-white/[0.06]
            transform transition-transform duration-300 lg:transform-none
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            overflow-y-auto
          `}
          role="navigation"
          aria-label="P31 surfaces"
        >
          <div className="p-4 space-y-1">
            {surfaces.map((s) => (
              <button
                key={s}
                onClick={() => handleSurfaceClick(s)}
                className={`
                  w-full text-left px-3 py-2.5 rounded-[12px] text-sm font-sans
                  transition-all duration-200 min-h-[44px] flex items-center
                  ${s === currentSurface
                    ? 'bg-quantum-cyan/10 text-quantum-cyan border border-quantum-cyan/20'
                    : 'text-white/50 hover:text-white/80 hover:bg-white/5 border border-transparent'}
                `}
                aria-current={s === currentSurface ? 'page' : undefined}
              >
                {SURFACE_LABELS[s] ?? s}
              </button>
            ))}
          </div>

          {/* Mobile role selector */}
          <div className="sm:hidden p-4 border-t border-white/[0.06]">
            <span className="text-[10px] uppercase tracking-[0.05em] text-white/30 mb-2 block">Role</span>
            <div className="flex flex-wrap gap-1">
              {(Object.keys(ROLES) as Role[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={`
                    px-2 py-1 text-[11px] font-mono rounded-full transition-colors
                    ${r === role
                      ? 'bg-quantum-cyan/15 text-quantum-cyan'
                      : 'text-white/30 hover:text-white/50'}
                  `}
                  aria-pressed={r === role}
                >
                  {ROLES[r].label}
                </button>
              ))}
            </div>
          </div>

          {/* Settings in sidebar */}
          <div className="p-4 border-t border-white/[0.06] space-y-3">
            <AccentToggle accent={accent} onChange={setAccent} />
            <DyslexiaToggle />
          </div>
        </nav>

        {/* Main content */}
        <main
          id="main-content"
          className="flex-1 min-h-[calc(100vh-56px)] p-4 md:p-6 lg:p-8"
          role="main"
        >
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-white/90">
              {SURFACE_LABELS[currentSurface] ?? currentSurface}
            </h1>
            <p className="text-sm text-white/40 mt-1">
              {ROLES[role].description}
            </p>
          </div>

          {/* Surface content placeholder — surfaces render here */}
          <div className="space-y-6">
            <div className="bg-white/[0.04] backdrop-blur-[12px] border border-white/[0.08] rounded-[24px] p-6">
              <p className="text-sm text-white/50">
                Surface: <span className="text-quantum-cyan font-mono">{currentSurface}</span>
              </p>
              <p className="text-sm text-white/30 mt-2">
                Role: <span className="font-mono">{role}</span> — {surfaces.length} surfaces available
              </p>
            </div>
          </div>
        </main>
      </div>

      {/* ── Status bar ───────────────────────────────────────────────────── */}
      <footer className="sticky bottom-0 z-40 bg-white/[0.03] backdrop-blur-[12px] border-t border-white/[0.06]">
        <div className="max-w-[1200px] mx-auto px-4 h-8 flex items-center justify-between text-[10px] font-mono text-white/30">
          <span>Surface: {currentSurface}</span>
          <span>Spoons: {spoons}/5</span>
          <span>Role: {role}</span>
        </div>
      </footer>
    </div>
  );
}
