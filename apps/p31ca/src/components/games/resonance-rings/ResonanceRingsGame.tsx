import { useRef, useEffect, useState, useCallback } from 'react';
import { Ring } from '../../../engine/resonance-rings/types.ts';
import { createRing, updateRings } from '../../../engine/resonance-rings/simulation.ts';

const W = 600, H = 600;
const COLORS = ['#4db8a8', '#cda852', '#cc6247', '#8b7cc9', '#3ba372', '#7ec8e3'];

export function ResonanceRingsGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ringsRef = useRef<Ring[]>([]);
  const [color, setColor] = useState('#4db8a8');
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

    ctx.fillStyle = 'rgba(15,17,21,0.15)';
    ctx.fillRect(0, 0, W, H);

    for (let i = 0; i < r.length; i++) {
      const ring = r[i];
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
      ctx.strokeStyle = ring.color;
      ctx.globalAlpha = ring.opacity * 0.6;
      ctx.lineWidth = Math.max(1, 4 * ring.opacity);
      ctx.stroke();

      if (ring.radius > 10) {
        ctx.beginPath();
        ctx.arc(ring.x, ring.y, ring.radius * 0.6, 0, Math.PI * 2);
        ctx.strokeStyle = ring.color;
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
        COLORS[i % COLORS.length], 0.5 + Math.random() * 0.5,
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
          borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)',
          background: '#0f1115', cursor: 'crosshair',
        }}
        onClick={handleClick}
      />

      <div style={{
        display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center',
        fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
      }}>
        <label style={{ color: 'rgba(232,230,227,0.4)', display: 'flex', alignItems: 'center', gap: 6 }}>
          Frequency
          <input type="range" min={0.2} max={3} step={0.1} value={frequency}
            onChange={e => setFrequency(parseFloat(e.target.value))}
            style={{ width: 60 }} />
        </label>

        <label style={{ color: 'rgba(232,230,227,0.4)', display: 'flex', alignItems: 'center', gap: 6 }}>
          Color
          <input type="color" value={color} onChange={e => setColor(e.target.value)}
            style={{ width: 32, height: 24, border: 'none', background: 'transparent', cursor: 'pointer' }} />
        </label>

        <button onClick={burst} style={btnStyle}>Burst</button>
        <button onClick={clear} style={btnStyle}>Clear</button>

        <span style={{ color: 'rgba(232,230,227,0.2)', fontSize: 9 }}>
          {ringCount} rings
        </span>
      </div>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  padding: '6px 14px', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6,
  background: 'transparent', color: 'rgba(232,230,227,0.5)',
  fontFamily: "'JetBrains Mono', monospace", fontSize: 10, cursor: 'pointer',
};
