import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAtmosphere, AtmosphereProvider } from './AtmosphereProvider';
import { DeviceProvider } from '../context/DeviceContext';
import { useDevice } from '../hooks/useDevice';
import { PWAInstallPrompt } from './PWAInstallPrompt';
import { listenForOnline, processQueue } from '../lib/offlineQueue';
import PHOSOrb from './PHOSOrb';
import TheGuardian from './TheGuardian';
import { SurfaceContent } from './SurfaceContent';
import { SurfaceErrorBoundary } from './SurfaceErrorBoundary';
import { DemoController } from './DemoController';
import { GrantNarrativeOverlay } from './GrantNarrativeOverlay';
import { SuperpositionSurface } from './SuperpositionSurface';
import { getBiologicalTheme } from '../lib/themeEngine';
import { EscapeHatch } from './EscapeHatch';
import TerminalStatusBar from './TerminalStatusBar';
import TerminalOmnibar from './TerminalOmnibar';
import TerminalFooter from './TerminalFooter';

export { getBiologicalTheme };

const VALID_SURFACES = new Set([
  'GREETING', 'IGNITION', 'BONDING', 'THE_BUFFER', 'VAULT', 'GRID',
  'NODE_ZERO', 'LEDGER', 'LOVE', 'HEARTH', 'ARCADE', 'ARCHIVE',
  'COMPASS', 'SETTINGS', 'WAREHOUSE',
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
  const { currentDevice, inferredLevel, isSuperposition } = useDevice();
  const [hudOpen, setHudOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(!skipLoading);
  const [helpToast, setHelpToast] = useState('');
  const effectiveLevel = currentDevice?.level ?? inferredLevel;
  const theme = useMemo(
    () => getBiologicalTheme(spoons, grayRock, effectiveLevel),
    [spoons, grayRock, effectiveLevel]
  );

  useEffect(() => {
    if (skipLoading) return;
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, [skipLoading]);

  const showHelp = useCallback(() => {
    setHelpToast('go <surface> | spoons <0-5> | audio on/off | hud | status | panic | /help');
    setTimeout(() => setHelpToast(''), 5000);
  }, []);

  const showStatus = useCallback(() => {
    setHelpToast(`SURFACE: ${currentSurface}  |  SPOONS: ${spoons}/5  |  MODE: ${theme.name}`);
    setTimeout(() => setHelpToast(''), 4000);
  }, [currentSurface, spoons, theme.name]);

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

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw-hearth.js').catch(() => {});
      navigator.serviceWorker.addEventListener('message', (e) => {
        if (e.data?.type === 'SYNC_ACTIONS') {
          processQueue();
        }
      });
    }
    listenForOnline();
  }, []);

  if (spoons === 0 || grayRock) {
    return <TheGuardian />;
  }

  const surfaceNames: Record<string, string> = {
    GREETING: 'Greeting', IGNITION: 'Ignition', BONDING: 'Bonding', THE_BUFFER: 'Buffer',
    VAULT: 'Vault', GRID: 'Grid', NODE_ZERO: 'Node Zero', LEDGER: 'Ledger', LOVE: 'Love',
    HEARTH: 'Hearth', ARCADE: 'Arcade', ARCHIVE: 'Archive', COMPASS: 'Compass', SETTINGS: 'Settings',
  };

  const isDesktopGreeting = currentSurface === 'GREETING' && theme.name === 'QUANTUM';

  const mainContent = isLoading ? (
    <main className="flex-1 flex flex-col items-center justify-start z-10 relative pb-24" aria-label="Loading">
      <div className={theme.container}>
        <div className="flex flex-col items-center justify-center mb-10 mt-12">
          <div className="animate-pulse bg-white/5 w-20 h-20 rounded-full" />
        </div>
        <div className="space-y-4 w-full max-w-3xl mx-auto">
          <div className="animate-pulse bg-white/5 h-6 w-3/4" />
          <div className="animate-pulse bg-white/5 h-4 w-full" />
          <div className="animate-pulse bg-white/5 h-4 w-5/6" />
        </div>
      </div>
    </main>
  ) : (
    <main className={`flex-1 ${theme.container} pb-24`} aria-live="polite" aria-label={`${surfaceNames[currentSurface] || currentSurface} surface`}>
      {theme.name !== 'QUANTUM' && (
        <div className="flex flex-col items-center justify-center mb-10 mt-12">
          <PHOSOrb />
        </div>
      )}

      {isDesktopGreeting && (
        <>
          <div className="mt-8 ml-8 sm:mt-12 sm:ml-12 max-w-lg bg-[#050505]/60 backdrop-blur-md border border-white/5 rounded-2xl p-6 shadow-2xl z-20 relative">
            <div className="flex items-center gap-2 text-emerald-500/60 font-mono text-[9px] mb-4 uppercase tracking-widest">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              {new Date().toLocaleTimeString('en-US', { hour12: true })}
            </div>
            <div className="font-mono text-[11px] leading-relaxed text-zinc-300">
              <div className="text-emerald-400 font-bold mb-2">&gt; PHOS_CORE // TAURI BRIDGE INITIALIZED.</div>
              <div>Native Rust environment detected.</div>
              <div>Hardware acceleration: Bypassed (Software Renderer Active).</div>
              <div className="mt-3 text-zinc-500">Type /help for native execution commands.</div>
            </div>
          </div>
          {isSuperposition && <SuperpositionSurface theme={theme} spoons={spoons} />}
        </>
      )}

      <div className={`transition-all duration-700 w-full max-w-3xl mx-auto ${isDesktopGreeting ? 'hidden' : 'block'}`}>
        <SurfaceErrorBoundary surfaceName={currentSurface}>
          <SurfaceContent currentSurface={currentSurface} setSurface={setSurface} spoons={spoons} theme={theme} />
        </SurfaceErrorBoundary>
      </div>

      <div className="mt-6 flex justify-center">
        <DemoController />
      </div>
    </main>
  );

  return (
    <>
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
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>

        <TerminalStatusBar themeName={theme.name} spoons={spoons} />

        {mainContent}

        {helpToast && (
          <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-50 px-5 py-3 bg-black/90 border border-emerald-800/40 rounded-[2rem] text-emerald-400 font-mono text-xs tracking-wider shadow-lg whitespace-nowrap backdrop-blur-xl">
            {helpToast}
          </div>
        )}

        <TerminalOmnibar
          spoons={spoons}
          onSetSurface={setSurface}
          onSetSpoons={setSpoons}
          onToggleHud={() => setHudOpen(prev => !prev)}
          onShowHelp={showHelp}
          onShowStatus={showStatus}
        />

        <TerminalFooter />
      </div>

      <PWAInstallPrompt />
    </>
  );
}

export default function PHOSShell() {
  const { spoons, surface } = hydrateFromURL();
  return (
    <DeviceProvider>
      <AtmosphereProvider initialSpoons={spoons} initialSurface={surface}>
        <PHOSShellInner skipLoading={spoons !== 3 || surface !== 'GREETING'} />
      </AtmosphereProvider>
    </DeviceProvider>
  );
}
/* v8 ignore stop */
