import { useRef, useEffect, useState, useCallback } from 'react';
import { Ring } from '../../../engine/resonance-rings/types.ts';
import { createRing, updateRings } from '../../../engine/resonance-rings/simulation.ts';
import { COLORS } from '../../../lib/arcade-core/theme.ts';
import { readThemeColors } from '../../../lib/arcade-core/cssVars.ts';

const W = 600, H = 600;
const RING_COLORS = ['var(--p31-teal)', 'var(--p31-gold)', 'var(--p31-rust)', 'var(--p31-purple)', 'var(--p31-green)', 'var(--p31-ice)'];

export function ResonanceRingsGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ringsRef = useRef<Ring[]>([]);
  const [color, setColor] = useState('var(--p31-teal)');
  const [frequency, setFrequency] = useState(1);
  const [ringCount, setRingCount] = useState(0);
  const [cw, setCw] = useState(W);
  const [ch, setCh] = useState(H);

  useEffect(() => {
    setCw(Math.min(W, window.innerWidth - 40));
    setCh(Math.min(W, window.innerWidth - 40) * (H / W));
  }, []);

  const draw = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d')!;
    const r = ringsRef.current;
    const t = readThemeColors();
    const resolve = (v: string) => (v.startsWith('var(') ? t[v.slice(4, -1)] : v);

    ctx.globalAlpha = 0.15;
    ctx.fillStyle = t['--p31-void'];
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;

    for (let i = 0; i < r.length; i++) {
      const ring = r[i];
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
      ctx.strokeStyle = resolve(ring.color);
      ctx.globalAlpha = ring.opacity * 0.6;
      ctx.lineWidth = Math.max(1, 4 * ring.opacity);
      ctx.stroke();

      if (ring.radius > 10) {
        ctx.beginPath();
        ctx.arc(ring.x, ring.y, ring.radius * 0.6, 0, Math.PI * 2);
        ctx.strokeStyle = resolve(ring.color);
        ctx.globalAlpha = ring.opacity * 0.15;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      ringsRef.current = updateRings(ringsRef.current);
      setRingCount(ringsRef.current.length);
      draw();
    }, 1000 / 60);
    return () => clearInterval(interval);
  }, [draw]);

  const handleClick = (e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (W / rect.width);
    const y = (e.clientY - rect.top) * (W / rect.width);
    ringsRef.current = [...ringsRef.current, createRing(x, y, color, frequency)];
  };

  const clear = () => { ringsRef.current = []; setRingCount(0); };

  const burst = () => {
    const cx = W / 2, cy = H / 2;
    const rings: Ring[] = [];
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      rings.push(createRing(
        cx + Math.cos(angle) * 60,
        cy + Math.sin(angle) * 60,
        RING_COLORS[i % COLORS.length], 0.5 + Math.random() * 0.5,
      ));
    }
    ringsRef.current = [...ringsRef.current, ...rings];
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 16 }}>
      <canvas
        ref={canvasRef}
        width={W} height={H}
        style={{
          width: cw, height: ch,
          borderRadius: 12, border: '1px solid var(--p31-white-8)',
          background: 'var(--p31-void)', cursor: 'crosshair',
        }}
        onClick={handleClick}
      />

      <div style={{
        display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center',
        fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
      }}>
        <label style={{ color: 'var(--p31-cloud-40)', display: 'flex', alignItems: 'center', gap: 6 }}>
          Frequency
          <input type="range" min={0.2} max={3} step={0.1} value={frequency}
            onChange={e => setFrequency(parseFloat(e.target.value))}
            style={{ width: 60 }} />
        </label>

        <label style={{ color: 'var(--p31-cloud-40)', display: 'flex', alignItems: 'center', gap: 6 }}>
          Color
          <input type="color" value={color} onChange={e => setColor(e.target.value)}
            style={{ width: 32, height: 24, border: 'none', background: 'transparent', cursor: 'pointer' }} />
        </label>

        <button onClick={burst} style={btnStyle}>Burst</button>
        <button onClick={clear} style={btnStyle}>Clear</button>

        <span style={{ color: 'var(--p31-cloud-20)', fontSize: 9 }}>
          {ringCount} rings
        </span>
      </div>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  padding: '6px 14px', border: '1px solid var(--p31-white-15)', borderRadius: 6,
  background: 'transparent', color: 'var(--p31-cloud-50)',
  fontFamily: "'JetBrains Mono', monospace", fontSize: 10, cursor: 'pointer',
};
