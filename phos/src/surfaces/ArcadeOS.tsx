import React, { useState, useEffect, useRef, useCallback, Component } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Activity, Database, Cpu, Play, RotateCcw, Crosshair, ShieldAlert } from 'lucide-react';

let audioCtx: AudioContext | null = null;
const initAudio = () => {
  if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
};

const playTone = (freq: number, type: OscillatorType, duration: number, volume = 0.1) => {
  const ctx = initAudio();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
};

const fx = {
  boot: () => { playTone(200, 'sine', 0.1); setTimeout(() => playTone(400, 'square', 0.2), 100); },
  snap: () => playTone(863, 'sine', 0.1, 0.2),
  warn: () => playTone(150, 'sawtooth', 0.3, 0.1),
  mint: () => { playTone(800, 'sine', 0.1); setTimeout(() => playTone(1200, 'sine', 0.2), 100); },
};

class EngineBoundary extends Component<{ children: React.ReactNode; name: string }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error) {
    console.error(`[Phase 6] ${this.props.name} engine crashed:`, error);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-red-400 p-8 text-center">
          <ShieldAlert size={48} className="mb-4" />
          <p className="font-mono text-sm">Engine kernel panic. Select another engine to recover.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

const GeodesicEngine = ({ onMint, onDrain }: { onMint: (amount: number, reason: string) => void; onDrain: () => void }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<{
    nodes: Array<{ x: number; y: number; ox: number; oy: number; pinned: boolean }>;
    beams: Array<{ a: number; b: number; len: number }>;
    selected: number | null;
    animId: number | null;
  }>({
    nodes: [], beams: [], selected: null, animId: null,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const engine = engineRef.current;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      if (engine.nodes.length === 0) {
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        engine.nodes = [
          { x: cx, y: cy - 100, ox: cx, oy: cy - 100, pinned: true },
          { x: cx - 100, y: cy + 100, ox: cx - 100, oy: cy + 100, pinned: false },
          { x: cx + 100, y: cy + 100, ox: cx + 100, oy: cy + 100, pinned: false },
        ];
        engine.beams = [
          { a: 0, b: 1, len: Math.hypot(cx - (cx - 100), (cy - 100) - (cy + 100)) },
          { a: 1, b: 2, len: Math.hypot(200, 0) },
          { a: 2, b: 0, len: Math.hypot(100 - (-100), 100 - 100) },
        ];
      }
    };
    window.addEventListener('resize', resize);
    resize();

    const substeps = 3;
    const tick = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let step = 0; step < substeps; step++) {
        engine.nodes.forEach(node => {
          if (!node.pinned) {
            const vx = (node.x - node.ox) * 0.99;
            const vy = (node.y - node.oy) * 0.99;
            node.ox = node.x;
            node.oy = node.y;
            node.x += vx;
            node.y += vy + 0.15;
            if (node.y > canvas.height - 20) { node.y = canvas.height - 20; node.oy = node.y - vy * 0.5; }
            if (node.x < 20) { node.x = 20; node.ox = node.x - vx * 0.5; }
            if (node.x > canvas.width - 20) { node.x = canvas.width - 20; node.ox = node.x - vx * 0.5; }
          }
        });
        engine.beams.forEach(beam => {
          const n1 = engine.nodes[beam.a];
          const n2 = engine.nodes[beam.b];
          if (!n1 || !n2) return;
          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const dist = Math.hypot(dx, dy);
          if (dist === 0) return;
          const diff = (dist - beam.len) / dist;
          const moveX = dx * 0.5 * diff;
          const moveY = dy * 0.5 * diff;
          if (!n1.pinned) { n1.x += moveX; n1.y += moveY; }
          if (!n2.pinned) { n2.x -= moveX; n2.y -= moveY; }
        });
      }

      ctx.lineWidth = 2;
      engine.beams.forEach(beam => {
        const n1 = engine.nodes[beam.a];
        const n2 = engine.nodes[beam.b];
        if (!n1 || !n2) return;
        const curLen = Math.hypot(n2.x - n1.x, n2.y - n1.y);
        const stress = Math.abs(curLen - beam.len);
        ctx.beginPath();
        ctx.moveTo(n1.x, n1.y);
        ctx.lineTo(n2.x, n2.y);
        ctx.strokeStyle = stress > 10 ? '#ef4444' : '#10b981';
        ctx.stroke();
      });

      engine.nodes.forEach((node, idx) => {
        ctx.beginPath();
        ctx.arc(node.x, node.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = engine.selected === idx ? '#06b6d4' : (node.pinned ? '#6b7280' : '#10b981');
        ctx.fill();
        ctx.shadowBlur = 10;
        ctx.shadowColor = ctx.fillStyle;
      });
      ctx.shadowBlur = 0;

      engine.animId = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      window.removeEventListener('resize', resize);
      if (engine.animId) cancelAnimationFrame(engine.animId);
      engine.nodes = [];
      engine.beams = [];
      engine.selected = null;
    };
  }, []);

  const handlePointer = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    let x = (e.clientX - rect.left) * scaleX;
    let y = (e.clientY - rect.top) * scaleY;
    x = Math.min(canvas.width - 20, Math.max(20, x));
    y = Math.min(canvas.height - 20, Math.max(20, y));

    const engine = engineRef.current;
    let hitIdx: number | null = null;
    for (let i = 0; i < engine.nodes.length; i++) {
      if (Math.hypot(engine.nodes[i].x - x, engine.nodes[i].y - y) < 20) {
        hitIdx = i;
        break;
      }
    }

    if (hitIdx !== null) {
      if (engine.selected === null) {
        engine.selected = hitIdx;
        fx.snap();
      } else if (engine.selected !== hitIdx) {
        const a = engine.selected;
        const b = hitIdx;
        const exists = engine.beams.some(bm => (bm.a === a && bm.b === b) || (bm.a === b && bm.b === a));
        if (!exists) {
          const n1 = engine.nodes[a];
          const n2 = engine.nodes[b];
          const len = Math.hypot(n2.x - n1.x, n2.y - n1.y);
          engine.beams.push({ a, b, len });
          fx.mint();
          onMint(5, 'Geodesic Beam');
          onDrain();
        }
        engine.selected = null;
      } else {
        engine.selected = null;
      }
    } else {
      engine.nodes.push({ x, y, ox: x, oy: y, pinned: false });
      engine.selected = engine.nodes.length - 1;
      fx.snap();
      onDrain();
    }
  }, [onMint, onDrain]);

  return (
    <canvas
      ref={canvasRef}
      onPointerDown={handlePointer}
      className="w-full h-full cursor-crosshair touch-none"
    />
  );
};

const OrbitalEngine = ({ onMint, onDrain }: { onMint: (amount: number, reason: string) => void; onDrain: () => void }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simRef = useRef<{
    particles: Array<{ x: number; y: number; vx: number; vy: number }>;
    center: { x: number; y: number; mass: number };
    animId: number | null;
  }>({
    particles: [],
    center: { x: 0, y: 0, mass: 2000 },
    animId: null,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const sim = simRef.current;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      sim.center = { x: canvas.width / 2, y: canvas.height / 2, mass: 2000 };
    };
    window.addEventListener('resize', resize);
    resize();

    const tick = () => {
      if (!ctx) return;
      ctx.fillStyle = 'rgba(5, 5, 5, 0.3)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.beginPath();
      ctx.arc(sim.center.x, sim.center.y, 15, 0, Math.PI * 2);
      ctx.fillStyle = '#f59e0b';
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#f59e0b';
      ctx.fill();

      sim.particles.forEach((p, idx) => {
        const dx = sim.center.x - p.x;
        const dy = sim.center.y - p.y;
        const distSq = dx * dx + dy * dy;
        const dist = Math.sqrt(distSq);
        const force = (0.5 * sim.center.mass) / distSq;
        p.vx += (dx / dist) * force;
        p.vy += (dy / dist) * force;
        p.x += p.vx;
        p.y += p.vy;

        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#06b6d4';
        ctx.fill();

        if (p.x < -1000 || p.x > canvas.width + 1000 || p.y < -1000 || p.y > canvas.height + 1000) {
          sim.particles.splice(idx, 1);
        }
      });
      ctx.shadowBlur = 0;
      sim.animId = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      window.removeEventListener('resize', resize);
      if (sim.animId) cancelAnimationFrame(sim.animId);
      sim.particles = [];
    };
  }, []);

  const handlePointer = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    simRef.current.particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 8,
    });
    fx.snap();
    onDrain();
    if (simRef.current.particles.length % 10 === 0) {
      fx.mint();
      onMint(10, 'Orbital Swarm');
    }
  }, [onMint, onDrain]);

  return (
    <canvas
      ref={canvasRef}
      onPointerDown={handlePointer}
      className="w-full h-full cursor-crosshair touch-none"
    />
  );
};

const GuardianOverlay = ({ onDismiss }: { onDismiss: () => void }) => {
  useEffect(() => {
    invoke('start_863hz').catch(() => {});
    return () => { invoke('stop_863hz').catch(() => {}); };
  }, []);
  return (
    <div className="flex flex-col items-center justify-center h-full text-amber-400 p-8 text-center bg-black/90 backdrop-blur-sm">
      <div className="text-7xl mb-6 animate-pulse">🕯️</div>
      <h2 className="text-2xl font-bold mb-4 font-mono">SPOON BUDGET DEPLETED</h2>
      <p className="text-sm text-gray-400 mb-8 max-w-md">
        Guardian Phase active. Larmor resonance engaged. Rest to recover.
      </p>
      <button
        onClick={onDismiss}
        className="px-6 py-2 border border-amber-500/50 rounded-full text-xs uppercase tracking-widest hover:bg-amber-500/10 transition-colors"
      >
        Acknowledge & Recover
      </button>
    </div>
  );
};

export const ArcadeOS = ({ onClose }: { onClose: () => void }) => {
  const [activeEngine, setActiveEngine] = useState<'GEODESIC' | 'ORBITAL' | null>(null);
  const [spoons, setSpoons] = useState(5);
  const [karma, setKarma] = useState(0);

  const syncKarma = useCallback(async () => {
    try {
      await invoke('init_db');
      const bal = await invoke<number>('get_balance');
      setKarma(bal ?? 0);
    } catch (e) {
      console.warn('Tauri sync failed', e);
    }
  }, []);

  useEffect(() => {
    syncKarma();
    fx.boot();
    const unlock = () => { initAudio(); window.removeEventListener('pointerdown', unlock); };
    window.addEventListener('pointerdown', unlock);
    return () => window.removeEventListener('pointerdown', unlock);
  }, [syncKarma]);

  const handleMint = useCallback(async (amount: number, reason: string) => {
    try {
      await invoke('mint_karma', { kind: reason, delta: amount });
      const newBal = await invoke<number>('get_balance');
      setKarma(newBal ?? 0);
    } catch (e) {
      console.error('Mint failed', e);
      fx.warn();
    }
  }, []);

  const handleDrain = useCallback(() => {
    setSpoons(prev => Math.max(0, prev - 1));
  }, []);

  const recoverSpoons = () => {
    setSpoons(5);
    syncKarma();
  };

  return (
    <div className="fixed inset-0 bg-black text-gray-200 flex flex-col z-50 surface-arcade">
      <header className="flex-none flex items-center justify-between p-4 border-b border-emerald-900/50 bg-[#0a0a0a]">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="text-emerald-500 hover:text-emerald-400 transition-colors text-xl font-mono px-2">
            ←
          </button>
          <h1 className="text-lg font-bold tracking-[0.2em] text-emerald-500 uppercase">PHOS // Arcade OS</h1>
        </div>
        <div className="flex items-center gap-6 text-xs tracking-widest">
          <div className="flex items-center gap-2 text-indigo-400">
            <Database size={14} /> KARMA: {karma}
          </div>
          <div className="flex items-center gap-2 text-emerald-500">
            <Activity size={14} /> SPOONS:
            <div className="flex gap-1 ml-1">
              {[...Array(5)].map((_, i) => (
                <div key={i} className={`w-3 h-3 border ${i < spoons ? 'bg-emerald-500 border-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-transparent border-gray-700'}`} />
              ))}
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-80 flex-none border-r border-emerald-900/50 flex flex-col bg-[#050505] p-4">
          <h2 className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-4">Engines</h2>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => { fx.boot(); setActiveEngine('GEODESIC'); }}
              className={`flex items-center gap-3 p-3 rounded border text-left transition-colors ${activeEngine === 'GEODESIC' ? 'bg-emerald-900/20 border-emerald-500 text-emerald-400' : 'border-gray-800 hover:border-emerald-900 text-gray-400'}`}
            >
              <Crosshair size={16} />
              <div>
                <div className="text-sm font-bold">Geodesic Builder</div>
                <div className="text-[10px] opacity-60">Verlet constraints (Game 9)</div>
              </div>
            </button>
            <button
              onClick={() => { fx.boot(); setActiveEngine('ORBITAL'); }}
              className={`flex items-center gap-3 p-3 rounded border text-left transition-colors ${activeEngine === 'ORBITAL' ? 'bg-cyan-900/20 border-cyan-500 text-cyan-400' : 'border-gray-800 hover:border-cyan-900 text-gray-400'}`}
            >
              <RotateCcw size={16} />
              <div>
                <div className="text-sm font-bold">Orbital Physics</div>
                <div className="text-[10px] opacity-60">N‑Body gravitational simulation</div>
              </div>
            </button>
          </div>
          <div className="mt-6 text-[10px] text-gray-600 border-t border-gray-900 pt-4">
            <Cpu size={12} className="inline mr-1" /> Phase 6 compliant
          </div>
        </div>

        <div className="flex-1 relative bg-black">
          {spoons === 0 ? (
            <GuardianOverlay onDismiss={recoverSpoons} />
          ) : (
            <>
              {!activeEngine ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-600">
                  <Play size={48} className="mb-4 opacity-20" />
                  <p className="tracking-widest uppercase text-sm">Select an Engine to initialize WebGL context.</p>
                </div>
              ) : (
                <EngineBoundary name={activeEngine}>
                  {activeEngine === 'GEODESIC' && <GeodesicEngine onMint={handleMint} onDrain={handleDrain} />}
                  {activeEngine === 'ORBITAL' && <OrbitalEngine onMint={handleMint} onDrain={handleDrain} />}
                </EngineBoundary>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
