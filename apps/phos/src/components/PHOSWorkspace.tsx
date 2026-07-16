import React, { useState, useEffect, useSyncExternalStore, useRef, useCallback, lazy, Suspense } from 'react';
import { spoonsStore } from '../store/spoons';
import { densityStore, DENSITY_LEVELS, type DensityLevel } from '../store/density';
import { identityStore, type IdentityState } from '../store/identity';
import { SURFACE_NAV, SURFACE_IDS } from '../config/surfaces';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { getBiologicalTheme, getThemeName } from '../lib/themeEngine';
import { AtmosphereProvider, useAtmosphere } from './AtmosphereProvider';
import { SurfaceContent } from './SurfaceContent';
import { Starfield } from './Starfield';
import PHOSSidebar from './PHOSSidebar';
import PHOSMagicDrawer from './PHOSMagicDrawer';
import CommandPalette from './CommandPalette';
import { CrisisOverlay } from '@p31/interface-generator';
import MobileNav from './MobileNav';
import PHOSPromptBar from './PHOSPromptBar';
import { VoiceInputButton } from './VoiceInputButton';
import { PWAInstallPrompt } from './PWAInstallPrompt';
const PGliteProvider = lazy(() => import('../providers/PGliteProvider').then(m => ({ default: m.PGliteProvider })));
import { useChatMessages } from '../hooks/useChatMessages';
import { useSovereignBrain } from '../hooks/useSovereignBrain';
import { mintCreditsAtomic } from '../lib/KarmaEngine';
import type { RoutingOverride } from '../lib/llm';
import { loadPrivateKey } from '../store/identity';
import { PassportWizard } from '../surfaces/PassportWizard';
import { PHOSOnboardingWizard } from './PHOSOnboardingWizard';
import { useRouting } from './SurfaceRouter';

type SpoonsState = 0 | 1 | 2 | 3 | 4 | 5;

const UnifiedSpoonAwareStyles = () => (
  <style>{`
    :root {
      --phos-glass-bg: var(--p31-glass-bg-value);
      --phos-glass-border: var(--p31-surface-border);
      --phos-glass-blur: var(--p31-glass-blur-value);
    }
    [data-reduced-motion="true"] { --phos-motion: 0ms linear !important; }
    [data-dyslexia="true"] { letter-spacing: 0.05em !important; line-height: 1.8 !important; }
    [data-density] { font-size: calc(16px * var(--phos-font-scale, 1)); }
    .phos-text-scrim { text-shadow: 0px 2px 12px rgba(0,0,0,0.8); }
  `}</style>
);

export default function PHOSWorkspace() {
  const spoons = useSyncExternalStore(
    (cb) => spoonsStore.subscribe(cb),
    () => spoonsStore.get(),
    () => 4,
  );
  const identity: IdentityState = useSyncExternalStore(
    (cb) => identityStore.subscribe(cb),
    () => identityStore.get(),
    () => ({ did: '', displayName: '', publicKey: '', isRegistered: 'false', joinedAt: '', keysGenerated: 'false' }),
  );
  const { pathToSurface, navigateToSurface, currentPath, isGenerative, intentPrompt } = useRouting();
  const [keyLoaded, setKeyLoaded] = useState(false);
  const [guestBypass, setGuestBypass] = useState(false);
  const [initialSurface, setInitialSurface] = useState(() => pathToSurface() || 'CHAT');

  useEffect(() => {
    if (identity.keysGenerated !== 'true') {
      setKeyLoaded(true);
      return;
    }
    loadPrivateKey()
      .then((key) => {
        if (key) console.log('🔑 Sovereign key restored from vault');
        else console.warn('⚠️ Private key not found in vault');
        setKeyLoaded(true);
      })
      .catch(() => setKeyLoaded(true));
  }, []);

  if (spoons === 0) return <CrisisOverlay onReady={() => spoonsStore.set(1)} />;
  if (!keyLoaded) return null;

  if (!guestBypass && (identity.isRegistered === 'false' || identity.keysGenerated === 'false')) {
    return (
      <AtmosphereProvider initialSpoons={spoons} initialSurface={initialSurface}>
      <Suspense fallback={<div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',color:'#00F0FF',fontSize:'14px'}}>Loading...</div>}>
        <PGliteProvider>
          <PassportWizard onComplete={() => setGuestBypass(true)} />
        </PGliteProvider>
      </Suspense>
      </AtmosphereProvider>
    );
  }

  return (
    <AtmosphereProvider initialSpoons={spoons} initialSurface={initialSurface}>
      <Suspense fallback={<div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',color:'#00F0FF',fontSize:'14px'}}>Loading...</div>}>
        <PGliteProvider>
          <WorkspaceShell identity={identity} isGuest={guestBypass} />
        </PGliteProvider>
      </Suspense>
    </AtmosphereProvider>
  );
}

function WorkspaceShell({ identity, isGuest }: { identity: IdentityState; isGuest: boolean }) {
  const context = useAtmosphere();
  const { spoons: s, currentSurface: cs, setSurface: ss } = context;
  const { isGenerative, intentPrompt } = useRouting();
  const density: DensityLevel = useSyncExternalStore(
    (cb) => densityStore.subscribe(cb),
    () => densityStore.get(),
    () => 'moderate',
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>(() => localStorage.getItem('phos:llm-model') || 'deepseek-chat');
  const isMobile = useMediaQuery('(max-width: 768px)');

  const { messages, sendMessage, clearAll, isLoading: isChatLoading } = useChatMessages(200);
  const {
    status: brainStatus,
    progress: brainProgress,
    tier: brainTier,
    isLocalReady: brainReady,
    generateResponse,
    currentRoute,
  } = useSovereignBrain();

  const [isProcessing, setIsProcessing] = useState(false);
  const [llmError, setLlmError] = useState<string | null>(null);
  const [routingOverride, setRoutingOverride] = useState<RoutingOverride>('force-edge');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [showOnboarding, setShowOnboarding] = useState(false);
  useEffect(() => {
    if (!localStorage.getItem('phos:onboarded')) setShowOnboarding(true);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.spoons = s.toString();
    document.documentElement.dataset.theme = getThemeName(s);
  }, [s]);

  const { navigateToSurface: navToSurface, pathToSurface: pts, currentPath } = useRouting();
  useEffect(() => { navToSurface(cs); }, [cs]);
  useEffect(() => {
    const synced = pts();
    if (synced && synced !== cs) ss(synced);
  }, [currentPath]);

  useEffect(() => {
    if (cs === 'CHAT') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, cs]);

  const handleSend = useCallback(async (text: string) => {
    if (!text.trim() || s === 0) return;
    const userMsg = await sendMessage('user', text.trim());
    if (!userMsg) return;
    setIsProcessing(true);
    setLlmError(null);

    try {
      const contextLength = messages.reduce((acc, m) => acc + Math.ceil(m.content.length / 4), 0);
      const response = await generateResponse(text, contextLength, {
        override: routingOverride,
        model: selectedModel !== 'deepseek-chat' ? selectedModel : undefined,
        spoonLevel: s,
      });
      await sendMessage('system', response);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Response failed';
      setLlmError(msg);
      await sendMessage('system', '⚠️ Connection issue. Try again in a moment.');
    } finally {
      setIsProcessing(false);
      setRoutingOverride('force-edge');
    }
  }, [sendMessage, s, generateResponse, messages, routingOverride, selectedModel]);

  const handleVoiceTranscript = useCallback((text: string) => {
    if (text.trim()) handleSend(text.trim());
  }, [handleSend]);

  const getGreeting = () => {
    const name = identity.displayName || '';
    if (s <= 2) return "How are you feeling?";
    if (s === 3) return "What's on your mind?";
    return name ? `What's next, ${name}?` : "What's next?";
  };
  const getSubGreeting = () => s <= 2 ? "Take your time. There's no rush." : s === 3 ? "Everything is quiet." : "Your space is secure.";

  return (
    <div className="fixed inset-0 overflow-hidden font-sans flex bg-[var(--phos-bg)] text-[var(--phos-text)] transition-colors duration-1000 h-screen h-[100dvh]" data-density={density}>
      {showOnboarding && <PHOSOnboardingWizard onComplete={() => {
        setShowOnboarding(false);
        if (messages.length === 0) {
          sendMessage('system', '✦ Welcome to PHOS. Try asking me a question or explore the surfaces on the left sidebar.');
          mintCreditsAtomic(42, 'welcome').catch(() => {});
        }
      }} />}

      <UnifiedSpoonAwareStyles />

      <div className="absolute inset-0 pointer-events-none transition-all duration-1000" style={{ backgroundImage: 'var(--phos-glow)' }} />
      <Starfield spoons={s} theme={getThemeName(s)} activeNodes={[]} />

      <CommandPalette
        surfaces={SURFACE_NAV}
        onSurfaceSelect={ss}
        onSetSpoons={(n) => spoonsStore.set(n as SpoonsState)}
        onClearChat={clearAll}
      />

      <PHOSMagicDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        spoons={s}
        selectedModel={selectedModel}
        onSetModel={setSelectedModel}
      />

      {!isMobile && (
        <div className="w-16 md:w-20 z-30 flex-shrink-0 border-r border-white/5 bg-black/20 backdrop-blur-md">
          <PHOSSidebar surfaces={SURFACE_NAV} active={cs} onSelect={ss} spoons={s} />
        </div>
      )}

      <main id="main-content" className="flex-1 flex flex-col relative z-10 w-full" style={{ paddingBottom: isMobile ? '64px' : '0' }}>

        <header className="flex items-center justify-between px-6 py-4 flex-shrink-0 z-20 pointer-events-none">
          <div className="flex items-center gap-3 pointer-events-auto">
              <div className="flex gap-2">
                {[0, 1, 2, 3, 4, 5].map(sp => (
                <button
                  key={sp}
                  onClick={() => spoonsStore.set(sp as SpoonsState)}
                  className="w-2.5 h-2.5 rounded-full transition-all duration-500 hover:scale-150"
                  style={{
                    backgroundColor: s >= sp ? 'var(--phos-primary)' : 'rgba(255,255,255,0.1)',
                    boxShadow: s >= sp && s > 0 ? '0 0 6px var(--phos-primary)' : 'none',
                  }}
                  aria-label={`Energy level ${sp}`}
                />
              ))}
            </div>
            <div className="flex gap-1 ml-2">
              {[0, 2, 3, 5].map(level => (
                <button
                  key={level}
                  onClick={() => spoonsStore.set(level as SpoonsState)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-all border ${
                    s === level
                      ? 'bg-phos-primary text-phos-bg border-phos-primary shadow-[0_0_6px_var(--p31-accent-primary-dim)]'
                      : 'bg-phos-card text-phos-mute border-phos-border hover:border-phos-primary hover:text-phos-text'
                  }`}
                  aria-label={`Set spoons to ${level}`}
                >
                  {level}
                </button>
              ))}
            </div>
            <div className="flex gap-1 ml-2" role="radiogroup" aria-label="Information density">
              {DENSITY_LEVELS.map((level) => (
                <button
                  key={level}
                  onClick={() => densityStore.set(level)}
                  className={`px-1.5 py-0.5 rounded text-[9px] font-mono transition-all border ${
                    density === level
                      ? 'bg-white/10 text-white/90 border-white/20'
                      : 'bg-transparent text-white/30 border-transparent hover:text-white/50'
                  }`}
                  role="radio"
                  aria-checked={density === level}
                  aria-label={`Density: ${level}`}
                  title={`Information density: ${level}`}
                >
                  {level[0].toUpperCase()}
                </button>
              ))}
            </div>
            <div
              className="w-1.5 h-1.5 rounded-full transition-colors duration-500"
              style={{
                backgroundColor: currentRoute === 'edge' ? '#FFB347' : brainReady ? 'var(--phos-primary)' : 'rgba(255,255,255,0.15)',
                boxShadow: currentRoute === 'edge'
                  ? '0 0 6px #FFB347'
                  : brainReady ? '0 0 4px var(--phos-primary)' : 'none',
              }}
              title={
                currentRoute === 'edge'
                  ? 'Edge Mesh active'
                  : brainReady
                    ? `Local Brain active (${brainTier})`
                    : brainStatus === 'unsupported'
                      ? 'AI unavailable'
                      : 'Awaiting input'
              }
            />
          </div>
          <button
            onClick={() => setDrawerOpen(true)}
            className="min-w-[48px] min-h-[48px] p-2 rounded-full hover:bg-white/5 phos-glass pointer-events-auto transition-colors flex items-center justify-center"
            aria-label="Open Telemetry Drawer"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
            </svg>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto w-full px-4 md:px-8 flex flex-col relative z-10">
          {cs !== 'CHAT' ? (
            <div className="max-w-6xl mx-auto w-full h-full pb-8 animate-slide-fade-in">
              <SurfaceContent currentSurface={cs} setSurface={ss} spoons={s} theme={getBiologicalTheme(s, false)} isGuest={isGuest} isGenerative={isGenerative} intentPrompt={intentPrompt} />
            </div>
          ) : (
            <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col justify-end pb-4">
              {messages.length === 0 && !isProcessing ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-20">
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-light tracking-wide phos-text-scrim text-center transition-all duration-700">
                    {getGreeting()}
                  </h1>
                  <p className="mt-4 text-xs md:text-sm opacity-60 font-light tracking-wider transition-all duration-700">
                    {getSubGreeting()}
                  </p>
                </div>
              ) : (
                <div className="w-full space-y-6 pt-20" aria-live="polite" aria-atomic="false">
                  {messages.map(msg => (
                    <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <div className={`px-5 py-3 max-w-[85%] font-light leading-relaxed text-sm ${
                        msg.role === 'user'
                          ? 'phos-glass glass-text-scrim rounded-2xl rounded-tr-sm text-white/80'
                          : 'text-[var(--phos-primary)]/70'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {brainStatus === 'downloading' && (
                    <div className="flex flex-col items-center w-full py-4">
                      <div className="w-full max-w-xs space-y-2">
                        <div className="w-full h-1 rounded-full bg-white/5 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[var(--phos-primary)] transition-all duration-300"
                            style={{ width: `${Math.round(brainProgress * 100)}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-center text-white/70 font-light">
                          Loading local AI model... {Math.round(brainProgress * 100)}%
                        </p>
                      </div>
                    </div>
                  )}
                  {isProcessing && !llmError && (
                    <div className="flex flex-col items-start">
                      <div className={`text-xs font-light tracking-wide text-white/40 ${currentRoute === 'edge' ? 'text-[#FFB347]/70' : 'text-[var(--phos-primary)]/50'}`}>
                        {currentRoute === 'edge'
                          ? 'Escalating to Edge Mesh...'
                          : 'Synthesizing locally...'}
                      </div>
                    </div>
                  )}
                  {llmError && (
                    <div className="flex flex-col items-start">
                      <div className="text-red-400/60 text-xs font-light tracking-wide">
                        {llmError}
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          )}
        </div>

        {cs === 'CHAT' && s > 0 && (
          <div className="flex-shrink-0 w-full max-w-3xl mx-auto px-4 pb-4 md:pb-6 pt-2 z-20">
            <div className="flex items-center gap-2 w-full">
              <div className="flex-1">
                <PHOSPromptBar onSend={handleSend} disabled={s === 0} />
              </div>
              <button
                type="button"
                onClick={() => setRoutingOverride((prev: RoutingOverride) => prev === 'force-edge' ? 'force-local' : 'force-edge')}
                className={`min-w-[48px] min-h-[48px] flex items-center justify-center p-2.5 rounded-full phos-transition text-xs font-mono ${
                  routingOverride === 'force-edge'
                    ? 'bg-[#FFB347]/20 text-[#FFB347] shadow-[0_0_8px_#FFB347]/30'
                    : 'bg-[var(--phos-primary)]/10 text-[var(--phos-primary)] shadow-[0_0_8px_var(--phos-primary)]/20'
                }`}
                aria-label={routingOverride === 'force-edge' ? 'Switch to local AI' : 'Switch to edge AI'}
                title={routingOverride === 'force-edge' ? 'Edge AI — tap for local' : 'Local AI — tap for edge'}
              >
                {routingOverride === 'force-edge' ? '☁️' : '📡'}
              </button>
              <VoiceInputButton
                onTranscript={handleVoiceTranscript}
                disabled={s === 0}
              />
            </div>
            <div className="text-center mt-3 text-[10px] font-light text-white/70 tracking-wide">
              PHOS OS · Zero-Telemetry · ⌘K to search
            </div>
          </div>
        )}
      </main>

      {isMobile && <MobileNav surfaces={SURFACE_NAV} active={cs} onSelect={ss} />}

      <PWAInstallPrompt />
    </div>
  );
}
