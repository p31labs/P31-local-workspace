import { useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
// import { Perf } from 'r3f-perf';  // TODO: Re-enable after pnpm install completes
import { useShipStore } from './store/shipStore';
import { useSovereignStore } from './sovereign/useSovereignStore';
import { initSovereignBridge } from './bridge/sovereign';
import { useWebMCP, type SpaceshipWebMCPConfig } from './hooks/useWebMCP';
import Lens from './cockpit/Lens';
import CameraRig from './cockpit/CameraRig';
import DataCard from './hud/DataCard';
import SpoonPulse from './hud/SpoonPulse';
import LedController from './hud/LedController';
import DunaBoard from './hud/DunaBoard';
import SystemBoard from './hud/SystemBoard';
import JitterbugBackground from './components/JitterbugBackground';
import { installVerifyHooks } from './verify/hooks';

// const showPerf = import.meta.env.DEV || new URLSearchParams(window.location.search).has('perf');
const bloomHeight = typeof window !== 'undefined' && window.devicePixelRatio > 1.5 ? 300 : 512;

export default function App() {
  const prevRef = useRef({ spoons: 4, coherence: 0.8, engagement: 5 });

  useEffect(() => {
    const cleanup = initSovereignBridge();
    const unsubVerify = installVerifyHooks();
    const state = useSovereignStore.getState();
    const sp = state.spoons ?? 4;
    const ch = state.coherence ?? 0.8;
    const eg = state.engagement ?? 5;
    useShipStore.setState({ spoons: sp, coherence: ch, engagement: eg, didKey: state.didKey ?? '' });
    prevRef.current = { spoons: sp, coherence: ch, engagement: eg };

    const unsub = useSovereignStore.subscribe(() => {
      const s = useSovereignStore.getState();
      const p = prevRef.current;
      if (s.spoons !== p.spoons) { useShipStore.setState({ spoons: s.spoons }); p.spoons = s.spoons; }
      if (s.coherence !== p.coherence) { useShipStore.setState({ coherence: s.coherence }); p.coherence = s.coherence; }
      if (s.engagement !== p.engagement) { useShipStore.setState({ engagement: s.engagement }); p.engagement = s.engagement; }
    });
    return () => { cleanup?.(); unsub(); unsubVerify(); };
  }, []);

  const webmcpRef = useRef<SpaceshipWebMCPConfig | null>(null);
  webmcpRef.current = {
    getSpoons: () => useShipStore.getState().spoons,
    setSpoons: (n) => {
      useShipStore.setState({ spoons: n });
      document.documentElement.setAttribute('data-spoons', String(n));
    },
    getViewMode: () => useShipStore.getState().viewMode,
    toggleViewMode: () => {},
    isLarmorActive: () => false,
    toggleLarmor: () => {},
    sendTransmission: () => {},
    getCoherence: () => useShipStore.getState().coherence,
  };
  useWebMCP(webmcpRef);

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#05070a', overflow: 'hidden' }}>
      {/* Molecular Starfield (DOM Canvas-2D, behind WebGL canvas) */}
      <JitterbugBackground />

      <Canvas
        camera={{ position: [0, 6, 28], fov: 45 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        dpr={Math.min(window.devicePixelRatio, 1.5)}
      >
        {/* {showPerf && <Perf position="top-left" />} */}
        <CameraRig />
        <Lens />
        <EffectComposer>
          <Bloom luminanceThreshold={0.8} luminanceSmoothing={0.4} height={bloomHeight} intensity={1.2} mipmapBlur />
        </EffectComposer>
      </Canvas>
      <DataCard />
      <DunaBoard />
      <SystemBoard />
      <SpoonPulse />
      <LedController />
    </div>
  );
}
