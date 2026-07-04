import { useRef, useEffect, useState, useCallback } from 'react';
import { updateParticles, emitParticles } from '../../../engine/liquid-sculptor/simulation.ts';

const W = 500, H = 500;

export function LiquidSculptorGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<ReturnType<typeof updateParticles>>([]);
  const mouseRef = useRef({ x: 0, y: 0, down: false });
  const [gravity, setGravity] = useState(0.5);
  const [color, setColor] = useState('#4db8a8');
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
    ctx.clearRect(0, 0, W, H);

    const p = particlesRef.current;
    for (let i = 0; i < p.length; i++) {
      const pt = p[i];
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 2 + pt.life * 2, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.globalAlpha = pt.life * 0.6;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }, [color]);

  useEffect(() => {
    const interval = setInterval(() => {
      const m = mouseRef.current;
      if (m.down) {
        particlesRef.current = [
          ...particlesRef.current,
          ...emitParticles(m.x, m.y, 3, gravity),
        ];
      }
      particlesRef.current = updateParticles(particlesRef.current, gravity);
      draw();
    }, 1000 / 60);
    return () => clearInterval(interval);
  }, [gravity, draw]);

  const handleMouse = (e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    mouseRef.current.x = e.clientX - rect.left;
    mouseRef.current.y = e.clientY - rect.top;
  };

  const clear = () => { particlesRef.current = []; };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 16 }}>
      <canvas
        ref={canvasRef}
        width={W} height={H}
        style={{
          width: cw, height: ch,
          borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(0,0,0,0.3)', cursor: 'crosshair',
        }}
        onMouseDown={e => { mouseRef.current.down = true; handleMouse(e); }}
        onMouseUp={() => { mouseRef.current.down = false; }}
        onMouseMove={handleMouse}
        onMouseLeave={() => { mouseRef.current.down = false; }}
      />

      <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
        <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(232,230,227,0.4)', display: 'flex', alignItems: 'center', gap: 6 }}>
          Gravity
          <input type="range" min={-2} max={2} step={0.1} value={gravity}
            onChange={e => setGravity(parseFloat(e.target.value))}
            style={{ width: 80 }} />
        </label>

        <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(232,230,227,0.4)', display: 'flex', alignItems: 'center', gap: 6 }}>
          Color
          <input type="color" value={color} onChange={e => setColor(e.target.value)}
            style={{ width: 32, height: 24, border: 'none', background: 'transparent', cursor: 'pointer' }} />
        </label>

        <button onClick={clear} style={{
          padding: '6px 16px', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6,
          background: 'transparent', color: 'rgba(232,230,227,0.5)',
          fontFamily: "'JetBrains Mono', monospace", fontSize: 10, cursor: 'pointer',
        }}>
          Clear
        </button>

        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'rgba(232,230,227,0.2)' }}>
          {particlesRef.current.length} particles
        </span>
      </div>
    </div>
  );
}
