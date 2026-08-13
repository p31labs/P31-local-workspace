import { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
// import { Perf } from 'r3f-perf';  // TODO: Re-enable after pnpm install completes
import { useShipStore } from './store/shipStore';
import { useSovereignStore } from './sovereign/useSovereignStore';
import { useHistoryStore } from './store/useHistoryStore';
import { initSovereignBridge, dispatchSovereignSpoons, dispatchSovereignCoherence } from '@p31/sovereign-core/bridge';
import { useWebMCP, type SpaceshipWebMCPConfig } from './hooks/useWebMCP';
import { createCrossAppState } from './hooks/useCrossAppState';
import Lens from './cockpit/Lens';
import CameraRig from './cockpit/CameraRig';
import DataCard from './hud/DataCard';
import HUDShell from './hud/HUDShell';
import BuckyView from './cockpit/BuckyView';
import JitterbugBackground from './components/JitterbugBackground';
import Topbar from './components/Topbar';
import CommandPalette, { setOpenMcpExplorer, setOpenMetricsDashboard } from './components/CommandPalette';
import RestOverlay from './components/RestOverlay';
import McpExplorer from './components/McpExplorer';

import SessionSurvey from './components/SessionSurvey';
import MetricsDashboard from './components/MetricsDashboard';
import Onboarding from './hud/Onboarding';
import { installVerifyHooks } from './verify/hooks';
import { useUndoHistory } from './hooks/useUndoHistory';
import { useBehavioralSignals } from './hooks/useBehavioralSignals';
import { useSessionMetrics } from './hooks/useSessionMetrics';
import { useGazeSignals } from './hooks/useGazeSignals';
import { useOverworkPrompt } from './hooks/useOverworkPrompt';
import { ensureDefaultSource } from './engine/sourceRegistry';

// const showPerf = import.meta.env.DEV || new URLSearchParams(window.location.search).has('perf');
const bloomHeight = typeof window !== 'undefined' && window.devicePixelRatio > 1.5 ? 300 : 512;

const BLOOM_BY_SPOONS: Record<number, number> = { 5: 1.4, 4: 0.5, 3: 0.1, 2: 0, 1: 0, 0: 0 };
const STAR_COUNT_BY_SPOONS: Record<number, number> = { 5: 1600, 4: 1000, 3: 400, 2: 100, 1: 120, 0: 80 };
const FPS_BY_SPOONS: Record<number, number> = { 5: 60, 4: 45, 3: 30, 2: 15, 1: 5, 0: 1 };

export default function App() {
  const prevRef = useRef({ spoons: 4, coherence: 0.8, engagement: 5 });
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [mcpOpen, setMcpOpen] = useState(false);

  useEffect(() => { setOpenMcpExplorer(() => () => setMcpOpen(true)); }, [setMcpOpen]);
  const [metricsOpen, setMetricsOpen] = useState(false);
  useEffect(() => { setOpenMetricsDashboard(() => () => setMetricsOpen(true)); }, [setMetricsOpen]);
  const undoCount = useHistoryStore((s) => s.entries.length);
  const undo = useHistoryStore((s) => s.undo);

  useUndoHistory();
  useBehavioralSignals();
  useSessionMetrics();
  useGazeSignals();
  createCrossAppState();

  useEffect(() => {
    const cleanupBridge = initSovereignBridge({
      onSpoonsChange: (spoons) => {
        document.documentElement.setAttribute('data-spoons', String(spoons));
        useShipStore.getState().setSpoons(spoons);
      },
    });
    const unsubVerify = installVerifyHooks();
    const state = useSovereignStore.getState();
    const sp = state.spoons ?? 4;
    const ch = state.coherence ?? 0.8;
    const eg = state.engagement ?? 5;
    useShipStore.setState({ spoons: sp, coherence: ch, engagement: eg, didKey: state.didKey ?? '' });
    prevRef.current = { spoons: sp, coherence: ch, engagement: eg };
    // ensureDefaultSource(); // 6B: empty-shell fix — dome boots blank until user selects a source

    const unsub = useSovereignStore.subscribe(() => {
      const s = useSovereignStore.getState();
      const p = prevRef.current;
      if (s.spoons !== p.spoons) {
        useShipStore.setState({ spoons: s.spoons });
        dispatchSovereignSpoons(s.spoons);
        p.spoons = s.spoons;
      }
      if (s.coherence !== p.coherence) {
        useShipStore.setState({ coherence: s.coherence });
        dispatchSovereignCoherence(s.coherence);
        p.coherence = s.coherence;
      }
      if (s.engagement !== p.engagement) { useShipStore.setState({ engagement: s.engagement }); p.engagement = s.engagement; }
    });

    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
      }
      if (e.key === 'k' || e.key === 'K') {
        useShipStore.getState().setShowK4Wireframe(!useShipStore.getState().showK4Wireframe);
      }
      if (e.key === 'Escape') {
        const state = useShipStore.getState();
        if (state.selectedPort !== null || state.selectedNode !== null) {
          state.setSelectedPort(null);
          state.setSelectedNode(null);
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => { cleanupBridge?.(); unsub(); unsubVerify(); window.removeEventListener('keydown', handleKey); };
  }, []);

  const webmcpRef = useRef<SpaceshipWebMCPConfig | null>(null);
  webmcpRef.current = {
    getSpoons: () => useShipStore.getState().spoons,
    setSpoons: (n) => {
      useShipStore.setState({ spoons: n });
      document.documentElement.setAttribute('data-spoons', String(n));
      dispatchSovereignSpoons(n);
    },
    getViewMode: () => useShipStore.getState().viewMode,
    toggleViewMode: () => {},
    isLarmorActive: () => false,
    toggleLarmor: () => {},
    sendTransmission: () => {},
    getCoherence: () => useShipStore.getState().coherence,
  };
  useWebMCP(webmcpRef);

  const spoons = useShipStore((s) => s.spoons);
  const [restAffirmation, setRestAffirmation] = useState<{ duration: number; sessionMinutes?: number; undoCount?: number } | null>(null);
  const { getMetrics } = useSessionMetrics();

  const handleRestDismiss = () => {
    const metrics = getMetrics();
    const currentRest = metrics.restEntries[0];
    if (currentRest && currentRest.duration === null) {
      const duration = Date.now() - currentRest.timestamp;
      const sessionMinutes = Math.round((Date.now() - metrics.sessionStart) / 60000);
      setRestAffirmation({ duration, sessionMinutes, undoCount: metrics.undoCount });
      return;
    }
    useShipStore.getState().setSpoons(2);
  };

  const dismissRestAffirmation = () => {
    setRestAffirmation(null);
    useShipStore.getState().setSpoons(2);
  };

  const bloomIntensity = BLOOM_BY_SPOONS[spoons] ?? 0;
  const targetFPS = FPS_BY_SPOONS[spoons] ?? 60;
  const frameInterval = 1000 / targetFPS;
  const lastFrameRef = useRef(0);

  const { showPrompt: showRestPrompt, onDismiss: dismissRestPrompt } = useOverworkPrompt(spoons);

  return (
    <div className="ship-shell" data-spoons={spoons}>
      <JitterbugBackground />
      <Canvas
        aria-label="Spaceship Earth interactive 3D environment. Use arrow keys to rotate the dome view."
        camera={{ position: [0, 6, 28], fov: 45 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        dpr={Math.min(window.devicePixelRatio, 1.5)}
        frameloop={spoons <= 1 ? 'demand' : 'always'}
        onPointerMissed={() => {
          const state = useShipStore.getState();
          if (state.selectedPort !== null || state.selectedNode !== null) {
            state.setSelectedPort(null);
            state.setSelectedNode(null);
          }
        }}
      >
        <CameraRig />
        <Lens spoons={spoons} starCount={STAR_COUNT_BY_SPOONS[spoons] ?? 1600} frameInterval={frameInterval} lastFrameRef={lastFrameRef} />
        <EffectComposer>
          <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.15} intensity={bloomIntensity} mipmapBlur height={bloomHeight} />
        </EffectComposer>
      </Canvas>
      <Topbar onOpenPalette={() => setPaletteOpen(true)} undoCount={undoCount} onUndo={undo} />
      <div data-panel="datacard" className="port-card-anchor"><DataCard /></div>
      <HUDShell />
      <div data-panel="bucky"><BuckyView /></div>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <RestOverlay open={spoons <= 1} onReturn={handleRestDismiss} onContinue={dismissRestAffirmation} affirmation={restAffirmation} />
      <McpExplorer open={mcpOpen} onClose={() => setMcpOpen(false)} />
      <SessionSurvey />
      <MetricsDashboard />
      <Onboarding />
      {showRestPrompt && spoons > 1 && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 rounded-lg border border-amber-500/50 bg-slate-900/90 p-4 shadow-lg backdrop-blur-sm"
        >
          <p className="text-sm text-slate-200">
            You&apos;ve been focused for a while. Consider a break when you&apos;re ready.
          </p>
          <button
            type="button"
            onClick={dismissRestPrompt}
            className="shrink-0 rounded px-3 py-1.5 text-xs font-medium text-amber-500 transition-colors hover:bg-amber-500/10"
          >
            Got it
          </button>
        </div>
      )}
    </div>
  );
}

