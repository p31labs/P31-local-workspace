import { useRef, useEffect, useState, useCallback } from 'react';
import { Body, OrbitalState } from '../../../engine/orbital-drift/types.ts';
import { updateBodies, createBody } from '../../../engine/orbital-drift/physics.ts';

const W = 600, H = 600;
const COLORS = ['#4db8a8', '#cda852', '#cc6247', '#8b7cc9', '#3ba372', '#7ec8e3', '#e8e6e3'];

let bodyId = 0;

export function OrbitalDriftGame() {
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

    if (!s.trailsOn) {
      ctx.fillStyle = 'rgba(15,17,21,1)';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.fillStyle = 'rgba(15,17,21,0.1)';
      ctx.fillRect(0, 0, W, H);
    }

    for (const b of s.bodies) {
      if (s.trailsOn && b.trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(b.trail[0].x, b.trail[0].y);
        for (let i = 1; i < b.trail.length; i++) {
          ctx.lineTo(b.trail[i].x, b.trail[i].y);
        }
        ctx.strokeStyle = b.color;
        ctx.globalAlpha = 0.2;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fillStyle = b.color;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius * 1.5, 0, Math.PI * 2);
      ctx.fillStyle = b.color;
      ctx.globalAlpha = 0.1;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (stateRef.current.paused) return;
      stateRef.current.bodies = updateBodies(stateRef.current.bodies, stateRef.current.speed);
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
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
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
    const big = createBody(cx, cy, bigMass, '#cda852', `b${++bodyId}`);
    big.vx = 0; big.vy = 0;
    bodies.push(big);
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const dist = 80 + Math.random() * 40;
      const m = 2 + Math.random() * 5;
      const b = createBody(
        cx + Math.cos(angle) * dist, cy + Math.sin(angle) * dist,
        m, COLORS[i % COLORS.length], `b${++bodyId}`
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
          Speed
          <input type="range" min={1} max={5} step={1} value={speed}
            onChange={e => { const v = parseInt(e.target.value); setSpeed(v); stateRef.current.speed = v; }}
            style={{ width: 60 }} />
        </label>

        <label style={{ color: 'rgba(232,230,227,0.4)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={trailsOn}
            onChange={e => { setTrailsOn(e.target.checked); stateRef.current.trailsOn = e.target.checked; }} />
          Trails
        </label>

        <label style={{ color: 'rgba(232,230,227,0.4)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={paused}
            onChange={e => { setPaused(e.target.checked); stateRef.current.paused = e.target.checked; }} />
          Pause
        </label>

        <button onClick={addPreset} style={btnStyle}>Solar System</button>
        <button onClick={clear} style={btnStyle}>Clear</button>

        <span style={{ color: 'rgba(232,230,227,0.2)', fontSize: 9 }}>
          {bodyCount} bodies
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
