import { useRef, useEffect, useState, useCallback } from 'react';
import { Body, OrbitalState } from '../../../engine/orbital-drift/types.ts';
import { updateBodies, createBody } from '../../../engine/orbital-drift/physics.ts';
import { COLORS } from '../../../lib/arcade-core/theme.ts';
import { readThemeColors, motionFactor } from '../../../lib/arcade-core/cssVars.ts';

const W = 600, H = 600;
const ORBITAL_COLORS = ['var(--p31-teal)', 'var(--p31-gold)', 'var(--p31-rust)', 'var(--p31-purple)', 'var(--p31-green)', 'var(--p31-ice)', 'var(--p31-cloud)'];

let bodyId = 0;

export function OrbitalDriftGame({ spoonLevel = 6 }: { spoonLevel?: number }) {
  const spoonRef = useRef(spoonLevel);
  spoonRef.current = spoonLevel;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<OrbitalState>({
    bodies: [], trailsOn: true, speed: 1, paused: false,
  });
  const placingRef = useRef(false);
  const [paused, setPaused] = useState(false);
  const [trailsOn, setTrailsOn] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [bodyCount, setBodyCount] = useState(0);
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
    const s = stateRef.current;
    const t = readThemeColors();
    const resolve = (v: string) => (v.startsWith('var(') ? t[v.slice(4, -1)] : v);

    if (!s.trailsOn) {
      ctx.fillStyle = t['--p31-void'];
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.globalAlpha = 0.1;
      ctx.fillStyle = t['--p31-void'];
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }

    for (const b of s.bodies) {
      if (s.trailsOn && b.trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(b.trail[0].x, b.trail[0].y);
        for (let i = 1; i < b.trail.length; i++) {
          ctx.lineTo(b.trail[i].x, b.trail[i].y);
        }
        ctx.strokeStyle = resolve(b.color);
        ctx.globalAlpha = 0.2;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fillStyle = resolve(b.color);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius * 1.5, 0, Math.PI * 2);
      ctx.fillStyle = resolve(b.color);
      ctx.globalAlpha = 0.1;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (stateRef.current.paused) return;
      const factor = motionFactor(spoonRef.current);
      if (factor <= 0) { draw(); return; }
      stateRef.current.bodies = updateBodies(stateRef.current.bodies, stateRef.current.speed * factor);
      setBodyCount(stateRef.current.bodies.length);
      draw();
    }, 1000 / 60);
    return () => clearInterval(interval);
  }, [draw]);

  const handleClick = (e: React.MouseEvent) => {
    if (placingRef.current) return;
    placingRef.current = true;
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const mass = 5 + Math.random() * 20;
    const color = ORBITAL_COLORS[Math.floor(Math.random() * COLORS.length)];
    const body = createBody(x * (W / rect.width), y * (W / rect.width), mass, color, `b${++bodyId}`);
    stateRef.current.bodies = [...stateRef.current.bodies, body];
    setBodyCount(stateRef.current.bodies.length);
    setTimeout(() => { placingRef.current = false; }, 200);
  };

  const clear = () => {
    stateRef.current.bodies = [];
    setBodyCount(0);
  };

  const addPreset = () => {
    const cx = W / 2, cy = H / 2;
    const bodies: Body[] = [];
    const bigMass = 50;
    const big = createBody(cx, cy, bigMass, 'var(--p31-gold)', `b${++bodyId}`);
    big.vx = 0; big.vy = 0;
    bodies.push(big);
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const dist = 80 + Math.random() * 40;
      const m = 2 + Math.random() * 5;
      const b = createBody(
        cx + Math.cos(angle) * dist, cy + Math.sin(angle) * dist,
        m, ORBITAL_COLORS[i % COLORS.length], `b${++bodyId}`
      );
      const orbV = Math.sqrt(500 * bigMass / dist) * 0.8;
      b.vx = -Math.sin(angle) * orbV + (Math.random() - 0.5) * 0.5;
      b.vy = Math.cos(angle) * orbV + (Math.random() - 0.5) * 0.5;
      bodies.push(b);
    }
    stateRef.current.bodies = [...stateRef.current.bodies, ...bodies];
    setBodyCount(stateRef.current.bodies.length);
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
          Speed
          <input type="range" min={1} max={5} step={1} value={speed}
            onChange={e => { const v = parseInt(e.target.value); setSpeed(v); stateRef.current.speed = v; }}
            style={{ width: 60 }} />
        </label>

        <label style={{ color: 'var(--p31-cloud-40)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={trailsOn}
            onChange={e => { setTrailsOn(e.target.checked); stateRef.current.trailsOn = e.target.checked; }} />
          Trails
        </label>

        <label style={{ color: 'var(--p31-cloud-40)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={paused}
            onChange={e => { setPaused(e.target.checked); stateRef.current.paused = e.target.checked; }} />
          Pause
        </label>

        <button onClick={addPreset} style={btnStyle}>Solar System</button>
        <button onClick={clear} style={btnStyle}>Clear</button>

        <span style={{ color: 'var(--p31-cloud-20)', fontSize: 9 }}>
          {bodyCount} bodies
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
