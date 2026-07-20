/**
 * @file App.tsx — P31 Spaceship Earth cockpit shell
 */
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Globe, Battery, Volume2, VolumeX } from 'lucide-react';
import { create } from 'zustand';
import { haptic } from './services/haptic';
import { getLarmorEngine } from './lib/engine/larmor';
import { RicciMath, getAnimatedCurvature } from './lib/engine/ricci';
import { FawnGuard } from './lib/engine/fawn';

import { CatchersMitt } from './components/hud/CatchersMitt';
import { ProofOfCare } from './components/hud/ProofOfCare';
import { DeltaMesh } from './components/mesh/DeltaMesh';
import { PosnerMolecule } from './components/mesh/PosnerMolecule';
import { MolecularField } from './components/MolecularField';
import { useSovereignStore } from './sovereign/useSovereignStore';
import { buildShipK4 } from './engine/k4Binding';
import { computePosnerCoherence, fawnThreshold } from './engine/coherence';
import { computeLayoutField, type PanelLayout } from './engine/layoutField';

// Canonical spoon scale — P31-wide is 0–5 (DESIGN.md `data-spoons`). The ship
// single-sources it here; every energy calc flows through MAX_SPOONS.
const MAX_SPOONS = 5;

const useAppStore = create<{ spoons: number; setSpoons: (n: number) => void }>((set) => ({
  spoons: MAX_SPOONS,
  setSpoons: (n) => set({ spoons: n }),
}));

function CurvatureDriver({ onTick }: { onTick: (t: number) => void }) {
  useFrame(({ clock }) => onTick(clock.getElapsedTime()));
  return null;
}

export default function App() {
  const [viewMode, setViewMode] = useState<'DELTA' | 'POSNER'>('DELTA');
  const [isLarmorActive, setIsLarmorActive] = useState(false);
  const spoons = useAppStore((s) => s.spoons);
  const setSpoons = useAppStore((s) => s.setSpoons);
  const [input, setInput] = useState('');
  const [warning, setWarning] = useState<string | null>(null);
  const [curvature, setCurvature] = useState(1.0);
  const larmorEngine = useMemo(() => getLarmorEngine(), []);

  // Phase 1 + 5: drive the SIC-POVM measurement through the store's feedback
  // loop. Mirror the local spoon slider into the store first, then measure —
  // measureState() blends the raw state with running feedback memory and folds
  // this cycle's coherence back in (the ring closes). The ship is a continuous
  // superposition that adapts over the session, never a hard mode toggle.
  useEffect(() => {
    const store = useSovereignStore.getState();
    useSovereignStore.setState({ spoons, maxSpoons: MAX_SPOONS });
    store.measureState();
  }, [spoons]);

  const onCurvatureTick = useCallback((t: number) => {
    setCurvature(getAnimatedCurvature(1.0, t));
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'l' && document.activeElement?.tagName !== 'TEXTAREA') {
        setViewMode((p) => (p === 'DELTA' ? 'POSNER' : 'DELTA'));
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const toggleLarmor = async () => {
    if (isLarmorActive) {
      await larmorEngine.stop();
    } else {
      await larmorEngine.start();
    }
    setIsLarmorActive(!isLarmorActive);
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setInput(text);
    // Phase 3: coherence-gated Fawn Guard — intercepts milder signals when
    // the user's coherence is low (more vulnerable to fawn response).
    const threshold = fawnThreshold(shipCoherence);
    const { triggered } = FawnGuard.gate(text, threshold);
    setWarning(triggered ? FawnGuard.getWarning(text) : null);
  };

  const resilience = useMemo(() => RicciMath.getResilience(4), []);

  // Phase 2: build the live K₄ skeleton from relay ping + local activity.
  // Vertex activity is seeded from this session's spoon state; edge health
  // comes from live relay RTT via buildShipK4 (RicciMath).
  const shipK4 = useMemo(() => {
    const pingMs = useSovereignStore.getState().relayPing;
    const energy = spoons / MAX_SPOONS;
    return buildShipK4(
      {
        cockpit: { activity: 0.6 },
        kids: { activity: 0.3 },
        game: { activity: 0.4 },
        ledger: { activity: Math.min(1, energy) },
      },
      pingMs,
    );
  }, [spoons]);

  // Phase 3: ship-wide coherence from the Posner model (spoons + engagement).
  // Drives MolecularField order/chaos, ProofOfCare, and Fawn-Guard gating.
  const shipCoherence = useMemo(() => {
    const engagement = useSovereignStore.getState().engagement;
    return computePosnerCoherence({
      spoons01: Math.min(1, spoons / MAX_SPOONS),
      engagement01: Math.min(1, engagement / 10),
      entropy: useSovereignStore.getState().modeEntropy,
    }).coherence;
  }, [spoons]);

  // Phase 4: the morphogenetic field lays out the HUD. Seed = passport identity
  // + spoon energy; depth grows with this session's age. The field only shifts
  // CSS surface properties (offset/scale/opacity/visibility) — it never
  // restructures the DOM. Re-seeded on spoon change; depth advances per minute.
  const sessionStart = useRef(Date.now());
  const layoutTick = spoons; // recompute cadence anchor
  const layout = useMemo(() => {
    return computeLayoutField({
      passportSeed: useSovereignStore.getState().didKey,
      spoons,
      maxSpoons: useSovereignStore.getState().maxSpoons,
      sessionSeconds: (Date.now() - sessionStart.current) / 1000,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layoutTick]);

  const panelStyle = (p: PanelLayout): React.CSSProperties => ({
    transform: `translate(${(p.x * 8).toFixed(2)}px, ${(p.y * 8).toFixed(2)}px) scale(${p.scale.toFixed(3)})`,
    opacity: p.visible ? p.opacity : 0,
    pointerEvents: p.visible ? undefined : 'none',
    transition: 'transform 600ms cubic-bezier(0.16,1,0.3,1), opacity 600ms ease',
  });

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#050505] text-[#d8d6d0] font-mono">
      <MolecularField coherence={shipCoherence} />
      <div className="absolute inset-0 z-[1]">
        <Canvas
          gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
          onCreated={({ gl, scene }) => {
            scene.background = null;
            gl.setClearColor(0x000000, 0);
          }}
        >
          <CurvatureDriver onTick={onCurvatureTick} />
          <PerspectiveCamera makeDefault position={[0, 0, 5]} />
          <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} enablePan={false} />
          <ambientLight intensity={0.35} />
          <pointLight position={[10, 10, 10]} intensity={1.2} color={0x22d3ee} />
          {viewMode === 'DELTA' ? (
            <DeltaMesh networkStress={1 - curvature} graph={shipK4} />
          ) : (
            <PosnerMolecule spoons={spoons} />
          )}
        </Canvas>
      </div>

      <CatchersMitt />
      <ProofOfCare userAge={25} coherence={shipCoherence} />

      <div
        className="absolute top-6 left-6 z-20 pointer-events-auto"
        style={{
          transform: panelStyle(layout.panels.status).transform,
          transition: panelStyle(layout.panels.status).transition,
        }}
      >
        <div className="rounded-xl border border-white/[0.08] bg-[#080810]/85 p-4 shadow-lg backdrop-blur-md">
          <div className="mb-2 flex items-center gap-2">
            <Globe className="text-[#00FF88]" size={18} />
            <h1 className="text-lg font-bold uppercase tracking-tight text-white">{viewMode} [L]</h1>
          </div>
          <div className="text-[10px] text-white/40">
            <div className="text-[#00FF88]">{resilience}</div>
            <div className="mt-2 flex items-center gap-3">
<Battery size={14} className={spoons > Math.floor(0.8 * MAX_SPOONS) ? 'text-[#22d3ee]' : 'text-[#E8636F]'} />
               <div className="flex gap-1">
                 {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={`h-4 w-1.5 rounded-sm ${
                      i < spoons ? (spoons > 4 ? 'bg-[#22d3ee]' : 'bg-[#E8636F]') : 'bg-white/10'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pointer-events-auto absolute right-6 top-6 z-20" style={panelStyle(layout.panels.larmor)}>
        <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-[#080810]/85 p-4 shadow-lg backdrop-blur-md">
          <span className="text-xs uppercase text-white/45">Larmor</span>
          <button
            type="button"
            onClick={toggleLarmor}
            className={`rounded-full p-2 ${isLarmorActive ? 'bg-[#E8636F]/20 text-[#E8636F]' : 'bg-white/5 text-white/40'}`}
          >
            {isLarmorActive ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-6 z-20 flex w-full justify-center">
        <div
          className="pointer-events-auto w-full max-w-lg rounded-xl border border-white/[0.08] bg-[#080810]/90 p-4 shadow-xl backdrop-blur-xl"
          style={panelStyle({ ...layout.panels.whale, visible: true })}
        >
          <div className="mb-3 flex items-center justify-between border-b border-white/[0.06] pb-2">
            <h2 className="font-mono text-xs font-bold uppercase tracking-wide text-[#22d3ee]">
              Whale Channel
            </h2>
            <div className="text-[10px] uppercase text-white/35">Fawn Guard</div>
          </div>
          <textarea
            value={input}
            onChange={handleInput}
            className="mb-3 h-24 w-full resize-none rounded-lg border border-white/[0.08] bg-[#050505]/90 p-3 font-mono text-[11px] text-[#d8d6d0] placeholder:text-white/25"
            placeholder="Prepare transmission..."
          />
          {warning && (
            <div className="mb-3 rounded-lg border border-[#fbbf24]/40 bg-[#fbbf24]/10 p-3 font-mono text-[10px] text-[#fbbf24]">
              {warning}
            </div>
          )}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                haptic.transmit();
                setInput('');
                setSpoons(Math.max(0, spoons - 1));
                // Phase 3/5: a successful transmission is an outcome — fold the
                // current measured coherence into feedback memory, then raise
                // engagement (which folds + re-measures), closing the loop so
                // the ship's state adapts to sustained connection.
                const store = useSovereignStore.getState();
                store.recordOutcome({ coherence: shipCoherence });
                store.setEngagement(Math.min(10, store.engagement + 1));
              }}
              disabled={!!warning || !input.trim()}
              className={`rounded-lg px-6 py-2 font-mono text-xs font-bold ${
                warning || !input.trim()
                  ? 'cursor-not-allowed bg-white/5 text-white/25'
                  : 'bg-[#22d3ee]/20 text-[#22d3ee]'
              }`}
            >
              {warning ? 'INTERCEPTED' : 'TRANSMIT'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
