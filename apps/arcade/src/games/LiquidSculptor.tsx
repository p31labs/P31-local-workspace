import { useRef, useEffect, useState } from 'react';
import { usePlayer } from '../components/PlayerProvider';
import { useGameEngine } from '@p31/game-engine/react';
import { jitterbugVertices } from '@p31/game-engine';
import { playNote } from './common/sound';

const P31_FREQ = 172.35;
const P31_HARMONIC = 517.05;

function playTone(freq: number, duration: number, vol = 0.1) {
  playNote(freq, duration, vol);
}

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  hue: number;
}

function hsl(h: number, s = 80, l = 50, a = 1) {
  const c = (1 - Math.abs(2 * l / 100 - 1)) * s / 100;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l / 100 - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  return `rgba(${Math.round((r+m)*255)},${Math.round((g+m)*255)},${Math.round((b+m)*255)},${a})`;
}

export default function LiquidSculptor() {
  const { spoons, setSpoons, mintLOVE } = usePlayer();
  const { state, actions } = useGameEngine({
    type: 'liquid', spoons,
    onComplete: (data) => { playTone(P31_HARMONIC, 1.5, 0.15); mintLOVE(data.loveEarned, 'liquid_sculpture'); },
  });

  const [message, setMessage] = useState('Click and drag to paint. Right-click for obstacles.');
  const [toolHue, setToolHue] = useState(180);
  const [zenMode, setZenMode] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const obstaclesRef = useRef<{ x: number; y: number; r: number }[]>([]);
  const mouseRef = useRef({ down: false, x: 0, y: 0, right: false });
  const msgTimer = useRef<ReturnType<typeof setTimeout>>();
  const frameCount = useRef(0);

  const maxParticles = spoons <= 1 ? 200 : spoons <= 3 ? 500 : 1000;

  const showMessage = (msg: string, dur = 2000) => {
    setMessage(msg);
    if (msgTimer.current) clearTimeout(msgTimer.current);
    msgTimer.current = setTimeout(() => setMessage(''), dur);
  };

  const spawnBurst = (x: number, y: number, count: number) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random() * 2;
      particlesRef.current.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1, maxLife: 1,
        hue: toolHue + (Math.random() - 0.5) * 30,
      });
    }
    if (particlesRef.current.length > 1500) particlesRef.current = particlesRef.current.slice(-1000);
    playTone(P31_FREQ, 0.05, 0.02);
  };

  const save = () => {
    actions.addLove(50);
    playTone(P31_HARMONIC, 0.8, 0.1);
    showMessage('💾 Sculpture saved! +50 LOVE', 3000);
  };

  const clear = () => {
    particlesRef.current = [];
    obstaclesRef.current = [];
    showMessage('Cleared', 1000);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = 400, h = 400;
    canvas.width = w; canvas.height = h;

    const animate = () => {
      frameCount.current++;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = zenMode ? '#050510' : '#0a0a0f';
      ctx.fillRect(0, 0, w, h);

      // Jitterbug vortices — 4 vortex points at tetrahedron vertices
      const jVerts = jitterbugVertices(state.jitterbug.phase);
      const vortexPositions = jVerts.slice(0, 4).map(v => ({
        x: w / 2 + v.x * 60,
        y: h / 2 + v.y * 60,
      }));

      const vortexStrength = spoons >= 3 ? 0.3 : 0.1;

      // Update particles
      const alive: Particle[] = [];
      for (const p of particlesRef.current) {
        p.life -= 0.005;
        if (p.life <= 0) continue;

        // Jitterbug vortex forces
        for (const vortex of vortexPositions) {
          const dx = vortex.x - p.x;
          const dy = vortex.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy) + 1;
          const force = vortexStrength / (dist * 0.1);
          const ang = Math.atan2(dy, dx) + (Math.PI / 2) * (frameCount.current % 2 === 0 ? 1 : -1);
          p.vx += Math.cos(ang) * force * 0.05;
          p.vy += Math.sin(ang) * force * 0.05;
        }

        // Obstacle repulsion
        for (const obs of obstaclesRef.current) {
          const dx = obs.x - p.x;
          const dy = obs.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy) + 1;
          if (dist < obs.r + 5) {
            p.vx -= (dx / dist) * 0.5;
            p.vy -= (dy / dist) * 0.5;
          }
        }

        // Damping
        p.vx *= 0.99;
        p.vy *= 0.99;

        p.x += p.vx;
        p.y += p.vy;

        // Wrap
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        alive.push(p);
      }
      particlesRef.current = alive.slice(-maxParticles);

      // Draw particles as fluid blobs
      for (const p of particlesRef.current) {
        const alpha = p.life * 0.4;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3 + p.life * 2, 0, Math.PI * 2);
        ctx.fillStyle = hsl(p.hue % 360, 80, 50, alpha);
        ctx.fill();
      }

      // Draw obstacles
      for (const obs of obstaclesRef.current) {
        ctx.beginPath();
        ctx.arc(obs.x, obs.y, obs.r, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Draw vortex centers
      if (spoons >= 3) {
        for (const vortex of vortexPositions) {
          ctx.beginPath();
          ctx.arc(vortex.x, vortex.y, 4, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(0, 240, 255, 0.3)';
          ctx.fill();
        }
      }

      requestAnimationFrame(animate);
    };

    const raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [state.jitterbug.phase, spoons, zenMode, toolHue, maxParticles]);

  useEffect(() => {
    const jInterval = setInterval(() => actions.updateJitterbug(), 16);
    return () => clearInterval(jInterval);
  }, [actions]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (mouseRef.current.down && !mouseRef.current.right) {
        spawnBurst(mouseRef.current.x, mouseRef.current.y, spoons >= 3 ? 8 : 4);
      }
    }, 50);
    return () => clearInterval(interval);
  }, [spoons, toolHue]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    mouseRef.current = { down: true, x, y, right: e.button === 2 };
    if (e.button === 2) {
      e.preventDefault();
      obstaclesRef.current.push({ x, y, r: 10 + Math.random() * 15 });
      if (obstaclesRef.current.length > 10) obstaclesRef.current.shift();
    } else {
      spawnBurst(x, y, 20);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseRef.current.x = e.clientX - rect.left;
    mouseRef.current.y = e.clientY - rect.top;
  };

  const handlePointerUp = () => {
    mouseRef.current.down = false;
  };

  const hueColors = [0, 60, 120, 180, 240, 300];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '24px', maxWidth: 440, margin: '0 auto' }}>
      <div style={{
        width: '100%', padding: '10px 16px', borderRadius: 12,
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', justifyContent: 'space-between', fontSize: 12, fontFamily: 'monospace',
      }}>
        <span>Particles: {particlesRef.current.length}/{maxParticles}</span>
        <span style={{ color: '#34D399' }}>♥ {state.loveEarned}</span>
      </div>

      {message && (
        <div style={{
          padding: '6px 16px', borderRadius: 8, background: 'rgba(0,240,255,0.08)',
          border: '1px solid rgba(0,240,255,0.2)', color: '#00F0FF', fontSize: 13, fontWeight: 600,
        }}>
          {message}
        </div>
      )}

      <canvas ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onContextMenu={e => e.preventDefault()}
        style={{ width: 400, height: 400, borderRadius: 16, border: '1px solid rgba(0,240,255,0.1)', cursor: 'crosshair', touchAction: 'none' }} />

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
        {hueColors.map(h => (
          <button key={h} onClick={() => setToolHue(h)} style={{
            width: 28, height: 28, borderRadius: 14, border: toolHue === h ? '2px solid #fff' : `2px solid ${hsl(h, 80, 50)}`,
            background: hsl(h, 80, 50), cursor: 'pointer',
          }} />
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button onClick={save} style={{
          padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
          background: '#00F0FF', color: '#0A0A0F', fontWeight: 600, fontSize: 12, fontFamily: 'monospace',
        }}>💾 Save</button>
        <button onClick={clear} style={{
          padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(251,113,133,0.3)', cursor: 'pointer',
          background: 'transparent', color: '#FB7185', fontSize: 12, fontFamily: 'monospace',
        }}>Clear</button>
        <button onClick={() => setZenMode(!zenMode)} style={{
          padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
          border: zenMode ? '1px solid #A78BFA' : '1px solid rgba(255,255,255,0.1)',
          background: zenMode ? 'rgba(167,139,250,0.15)' : 'transparent',
          color: zenMode ? '#A78BFA' : 'rgba(255,255,255,0.4)', fontSize: 12, fontFamily: 'monospace',
        }}>
          {zenMode ? '🧘 Zen' : 'Zen'}
        </button>
        {([0,1,2,3,4,5] as const).map(s => (
          <button key={s} onClick={() => setSpoons(s)} style={{
            width: 24, padding: '3px 0', borderRadius: 4, cursor: 'pointer',
            border: spoons === s ? `1px solid ${s <= 1 ? '#FB7185' : '#00F0FF'}` : '1px solid rgba(255,255,255,0.1)',
            background: spoons === s ? `${s <= 1 ? '#FB7185' : '#00F0FF'}20` : 'transparent',
            color: spoons === s ? (s <= 1 ? '#FB7185' : '#00F0FF') : 'rgba(255,255,255,0.4)',
            fontSize: 10, fontFamily: 'monospace',
          }}>{s === 0 ? '!' : s}</button>
        ))}
      </div>
    </div>
  );
}
