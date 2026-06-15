import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAtmosphere } from '../components/AtmosphereProvider';
import GentleDreamscape from '../components/ambient/GentleDreamscape';
import { mintCreditsNative, getBalanceNative, startLarmorTone, stopLarmorTone } from '../lib/tauriBridge';

let audioCtx: AudioContext | null = null;
const getCtx = () => {
  if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
};

const playTone = (freq: number, type: OscillatorType, duration: number, volume = 0.1, slideTo?: number) => {
  const ctx = getCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + duration);
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
};

const audio = {
  spawn: () => playTone(600, 'sine', 0.2, 0.15, 900),
  select: () => playTone(800, 'triangle', 0.1, 0.1),
  snap: () => playTone(1200, 'sine', 0.15, 0.12),
  win: () => {
    playTone(400, 'sine', 0.1);
    setTimeout(() => playTone(600, 'sine', 0.1), 100);
    setTimeout(() => playTone(863, 'sine', 0.3), 200);
  },
  error: () => playTone(150, 'sawtooth', 0.3, 0.08),
};

interface Node {
  x: number; y: number;
  ox: number; oy: number;
  pinned: boolean;
}
interface Beam {
  a: number; b: number;
  restLen: number;
}

const StarBuilderEngine = ({ onMint, onDrain, spoons }: { onMint: (amount: number, reason: string) => void; onDrain: () => void; spoons: number }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<{ nodes: Node[]; beams: Beam[]; selected: number | null; animId: number | null }>({
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
        engine.nodes.push({ x: cx, y: cy - 100, ox: cx, oy: cy - 100, pinned: true });
      }
    };
    window.addEventListener('resize', resize);
    resize();

    const substeps = 3;

    const tick = () => {
      if (!ctx) return;
      ctx.fillStyle = '#0a0a2e';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let step = 0; step < substeps; step++) {
        engine.nodes.forEach(node => {
          if (!node.pinned) {
            const vx = (node.x - node.ox) * 0.98;
            const vy = (node.y - node.oy) * 0.98;
            node.ox = node.x;
            node.oy = node.y;
            node.x += vx;
            node.y += vy + 0.2;
            const margin = 30;
            if (node.y > canvas.height - margin) { node.y = canvas.height - margin; node.oy = node.y - vy * 0.5; }
            if (node.x < margin) { node.x = margin; node.ox = node.x - vx * 0.5; }
            if (node.x > canvas.width - margin) { node.x = canvas.width - margin; node.ox = node.x - vx * 0.5; }
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
          const diff = (dist - beam.restLen) / dist;
          const moveX = dx * 0.5 * diff;
          const moveY = dy * 0.5 * diff;
          if (!n1.pinned) { n1.x += moveX; n1.y += moveY; }
          if (!n2.pinned) { n2.x -= moveX; n2.y -= moveY; }
        });
      }

      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      engine.beams.forEach(beam => {
        const n1 = engine.nodes[beam.a];
        const n2 = engine.nodes[beam.b];
        if (!n1 || !n2) return;
        const currentLen = Math.hypot(n2.x - n1.x, n2.y - n1.y);
        const stress = Math.abs(currentLen - beam.restLen) / beam.restLen;
        ctx.beginPath();
        ctx.moveTo(n1.x, n1.y);
        ctx.lineTo(n2.x, n2.y);
        ctx.strokeStyle = stress > 0.15 ? '#f97316' : '#67e8f9';
        ctx.shadowBlur = stress > 0.15 ? 12 : 8;
        ctx.shadowColor = ctx.strokeStyle;
        ctx.stroke();
      });
      ctx.shadowBlur = 0;

      engine.nodes.forEach((node, idx) => {
        const glow = engine.selected === idx ? 8 : (node.pinned ? 4 : 6);
        ctx.beginPath();
        ctx.arc(node.x, node.y, 24, 0, Math.PI * 2);
        ctx.fillStyle = engine.selected === idx ? '#fcd34d' : (node.pinned ? '#a78bfa' : '#f472b6');
        ctx.shadowBlur = glow;
        ctx.shadowColor = ctx.fillStyle;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.font = '22px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⭐', node.x, node.y);
      });

      engine.animId = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      window.removeEventListener('resize', resize);
      if (engine.animId) cancelAnimationFrame(engine.animId);
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
      if (Math.hypot(engine.nodes[i].x - x, engine.nodes[i].y - y) < 35) {
        hitIdx = i;
        break;
      }
    }

    if (hitIdx !== null) {
      if (engine.selected === null) {
        engine.selected = hitIdx;
        audio.select();
      } else if (engine.selected !== hitIdx) {
        const a = engine.selected;
        const b = hitIdx;
        const exists = engine.beams.some(bm => (bm.a === a && bm.b === b) || (bm.a === b && bm.b === a));
        if (!exists) {
          const n1 = engine.nodes[a];
          const n2 = engine.nodes[b];
          const restLen = Math.hypot(n2.x - n1.x, n2.y - n1.y);
          engine.beams.push({ a, b, restLen });
          audio.snap();
          onDrain();
          if (engine.beams.length % 3 === 0) {
            audio.win();
            onMint(10, 'Star Builder: Constellation');
          }
        }
        engine.selected = null;
      } else {
        engine.selected = null;
      }
    } else {
      engine.nodes.push({ x, y, ox: x, oy: y, pinned: false });
      engine.selected = engine.nodes.length - 1;
      audio.spawn();
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

const HearthOverlay = ({ onDismiss }: { onDismiss: () => void }) => {
  useEffect(() => {
    startLarmorTone().catch(() => {});
    return () => { stopLarmorTone().catch(() => {}); };
  }, []);

  return (
    <div onClick={onDismiss} className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-900/95 backdrop-blur-xl text-zinc-300 animate-in fade-in duration-1000">
      <div className="text-9xl mb-12 animate-pulse drop-shadow-[0_0_80px_rgba(255,183,77,0.6)]">🕯️</div>
      <h2 className="text-4xl font-bold text-center px-8 mb-16 text-amber-100/90">Time to rest.</h2>
      <button onClick={(e) => { e.stopPropagation(); audio.snap(); onDismiss(); }}
        className="px-16 py-8 rounded-[3rem] text-3xl font-bold bg-zinc-800 text-zinc-400 border border-zinc-700 active:scale-95 transition-transform shadow-2xl">
        Go Back
      </button>
    </div>
  );
};

export function StarBuilderSurface({ onBack: externalBack }: { onBack?: () => void }) {
  const { setSurface, spoons: globalSpoons, setSpoons } = useAtmosphere();
  const [spoons, setLocalSpoons] = useState(5);
  const [karma, setKarma] = useState(0);
  const [showHearth, setShowHearth] = useState(false);

  const effectiveSpoons = globalSpoons !== undefined ? globalSpoons : spoons;
  const effectiveSetSpoons = globalSpoons !== undefined ? setSpoons : setLocalSpoons;

  const syncKarma = useCallback(async () => {
    try {
      const balance = await getBalanceNative();
      setKarma(balance);
    } catch { /* offline */ }
  }, []);

  useEffect(() => { syncKarma(); }, [syncKarma]);

  useEffect(() => {
    if (effectiveSpoons <= 1) setShowHearth(true);
  }, [effectiveSpoons]);

  useEffect(() => {
    const unlock = () => { getCtx(); window.removeEventListener('pointerdown', unlock); };
    window.addEventListener('pointerdown', unlock);
    return () => window.removeEventListener('pointerdown', unlock);
  }, []);

  const handleMint = useCallback(async (amount: number, reason: string) => {
    try {
      await mintCreditsNative(reason, amount);
      const newBal = await getBalanceNative();
      setKarma(newBal);
    } catch { audio.error(); }
  }, []);

  const handleDrain = useCallback(() => {
    effectiveSetSpoons(Math.max(0, effectiveSpoons - 1));
  }, [effectiveSpoons, effectiveSetSpoons]);

  const handleBack = () => {
    if (externalBack) externalBack();
    else setSurface('WILLOW');
  };

  const recoverFromHearth = () => {
    setShowHearth(false);
    effectiveSetSpoons(5);
    syncKarma();
  };

  if (showHearth) {
    return (
      <div className="relative w-full h-full">
        <GentleDreamscape spoons={1} />
        <HearthOverlay onDismiss={recoverFromHearth} />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden touch-none">
      <GentleDreamscape spoons={effectiveSpoons} />
      <div className="absolute top-0 left-0 right-0 p-6 z-20 flex justify-between items-center pointer-events-none">
        <button onClick={handleBack}
          className="pointer-events-auto px-6 py-3 bg-white/20 backdrop-blur-md rounded-full text-white font-bold text-xl flex items-center gap-2 active:scale-95 transition-transform border border-white/30 shadow-lg">
          ← Back
        </button>
        <div className="pointer-events-auto bg-white/20 backdrop-blur-md px-5 py-3 rounded-full text-white font-bold text-lg border border-white/30 shadow-lg flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-yellow-300">⭐</span>
            <span>{karma}</span>
          </div>
          <div className="flex gap-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className={`w-5 h-5 rounded-full transition-all ${i < effectiveSpoons ? 'bg-pink-400 shadow-md' : 'bg-white/30'}`} />
            ))}
          </div>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center h-full pt-28 pb-20">
        <div className="w-full max-w-4xl mx-6 bg-white/10 backdrop-blur-sm rounded-[3rem] border border-white/20 shadow-2xl overflow-hidden" style={{ height: '55vh' }}>
          <StarBuilderEngine onMint={handleMint} onDrain={handleDrain} spoons={effectiveSpoons} />
        </div>
        <div className="mt-8 text-center text-white/80 text-xl font-semibold drop-shadow-md">
          ✨ Tap to add stars — connect them with beams!
        </div>
      </div>
    </div>
  );
}
