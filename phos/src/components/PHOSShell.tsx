import React, { useState, useEffect, useCallback } from 'react';
import { useAtmosphere, AtmosphereProvider } from './AtmosphereProvider';
import PHOSOrb from './PHOSOrb';
import TheGuardian from './TheGuardian';
import { SurfaceContent } from './SurfaceContent';
import { SurfaceErrorBoundary } from './SurfaceErrorBoundary';
import { DemoController } from './DemoController';
import { GrantNarrativeOverlay } from './GrantNarrativeOverlay';
import { getBiologicalTheme } from '../lib/themeEngine';
import { EscapeHatch } from './EscapeHatch';

export { getBiologicalTheme };

const VALID_SURFACES = new Set([
  'GREETING', 'IGNITION', 'BONDING', 'THE_BUFFER', 'VAULT', 'GRID',
  'NODE_ZERO', 'LEDGER', 'LOVE', 'HEARTH', 'ARCADE', 'ARCHIVE',
  'COMPASS', 'SETTINGS',
]);

function hydrateFromURL(): { spoons: number; surface: string } {
  try {
    const params = new URLSearchParams(window.location.search);
    const spoonsParam = params.get('spoons');
    const surfaceParam = params.get('surface');
    const spoons = spoonsParam !== null
      ? Math.max(0, Math.min(5, parseInt(spoonsParam, 10) || 0))
      : 3;
    const surface = surfaceParam !== null && VALID_SURFACES.has(surfaceParam.toUpperCase())
      ? surfaceParam.toUpperCase()
      : 'GREETING';
    return { spoons, surface };
  } catch {
    return { spoons: 3, surface: 'GREETING' };
  }
}

/* v8 ignore start */
function PHOSShellInner({ skipLoading = false }: { skipLoading?: boolean }) {
  const { spoons, setSpoons, grayRock, currentSurface, setSurface } = useAtmosphere();
  const [hudOpen, setHudOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(!skipLoading);
  const theme = getBiologicalTheme(spoons, grayRock);

  useEffect(() => {
    if (skipLoading) return;
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, [skipLoading]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setHudOpen(false);
      if (spoons === 0) setSpoons(3);
    }
    if (e.key === 'h' || e.key === 'H') {
      if (!e.ctrlKey && !e.metaKey && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        setHudOpen(prev => !prev);
      }
    }
    if (e.key === '0') {
      e.preventDefault();
      setSpoons(0);
    }
  }, [spoons, setSpoons]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (spoons === 0 || grayRock) {
    return <TheGuardian />;
  }

  const surfaceNames: Record<string, string> = {
    GREETING: 'Greeting', IGNITION: 'Ignition', BONDING: 'Bonding', THE_BUFFER: 'Buffer',
    VAULT: 'Vault', GRID: 'Grid', NODE_ZERO: 'Node Zero', LEDGER: 'Ledger', LOVE: 'Love',
    HEARTH: 'Hearth', ARCADE: 'Arcade', ARCHIVE: 'Archive', COMPASS: 'Compass', SETTINGS: 'Settings',
  };

  if (isLoading) {
    return (
      <div className={`h-screen w-screen overflow-hidden flex flex-col transition-all duration-1000 select-none ${theme.wrapper}`}>
        <div className="flex-1 overflow-y-auto pt-28 pb-12 px-4 flex flex-col items-center justify-start">
          <div className="mb-10"><PHOSOrb /></div>
          <div className={`w-full ${theme.container}`}>
            <div className="space-y-4 w-full">
              <div className="flex items-center gap-3 mb-2"><div className="animate-pulse bg-white/5 rounded h-4 w-32" /><div className="animate-pulse bg-white/5 rounded h-3 w-16 ml-auto" /></div>
              <div className="animate-pulse bg-white/5 rounded h-6 w-3/4" />
              <div className="animate-pulse bg-white/5 rounded h-4 w-full" />
              <div className="animate-pulse bg-white/5 rounded h-4 w-5/6" />
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="animate-pulse bg-white/5 rounded h-20" />
                <div className="animate-pulse bg-white/5 rounded h-20" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-screen w-screen overflow-hidden flex flex-col transition-all duration-1000 select-none ${theme.wrapper}`}>
      <style>{`
        @keyframes biomimetic-breath {
          0%, 100% { transform: scale(0.96); opacity: 0.8; box-shadow: 0 0 35px rgba(251,146,60,0.15); }
          50% { transform: scale(1.04); opacity: 1; box-shadow: 0 0 70px rgba(251,146,60,0.5); }
        }
        .animate-biomimetic-breath { animation: biomimetic-breath 6s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        @media (prefers-reduced-motion: reduce) {
          .animate-biomimetic-breath, .animate-pulse, .transition-all { animation: none !important; transition: none !important; }
        }
        *:focus-visible { outline: 2px solid rgba(52, 211, 153, 0.6); outline-offset: 2px; }
      `}</style>

      <GrantNarrativeOverlay />

      <EscapeHatch
        theme={theme}
        hudOpen={hudOpen}
        currentSurface={currentSurface}
        spoons={spoons}
        surfaceNames={surfaceNames}
        onToggleHud={() => setHudOpen(!hudOpen)}
        onSetSpoons={(s) => { setSpoons(s); setHudOpen(false); }}
        onSetSurface={(s) => { setSurface(s); setHudOpen(false); }}
      />

      <main className="flex-1 overflow-y-auto pt-28 pb-32 px-4 flex flex-col items-center justify-start z-10 relative" aria-live="polite" aria-label={`${surfaceNames[currentSurface] || currentSurface} surface`}>
        <div className="mb-10 flex flex-col items-center justify-center">
          <PHOSOrb />
        </div>
        <div className={`w-full transition-all duration-700 ${theme.container}`}>
          <SurfaceErrorBoundary surfaceName={currentSurface}>
            <SurfaceContent currentSurface={currentSurface} setSurface={setSurface} spoons={spoons} theme={theme} />
          </SurfaceErrorBoundary>
        </div>
      </main>

      <div className="relative z-50 flex justify-center pb-4">
        <DemoController />
      </div>
    </div>
  );
}

export default function PHOSShell() {
  const { spoons, surface } = hydrateFromURL();
  return (
    <AtmosphereProvider initialSpoons={spoons} initialSurface={surface}>
      <PHOSShellInner skipLoading={spoons !== 3 || surface !== 'GREETING'} />
    </AtmosphereProvider>
  );
}
/* v8 ignore stop */
