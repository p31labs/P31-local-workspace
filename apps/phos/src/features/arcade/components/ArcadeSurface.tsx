import { useState, useRef, useEffect, useCallback } from 'react';
import { GlassCard } from '@p31/ui/chrome';
import { GlowButton } from '@p31/ui/chrome';

interface Star {
  id: number;
  x: number;
  y: number;
  z: number;
  size: number;
  brightness: number;
  color: string;
  vx: number;
  vy: number;
}

const COLORS_FALLBACK = ['#00F0FF', '#A78BFA', '#FBBF24', '#34D399', '#FB7185', '#818CF8'];

function getColors(): string[] {
  if (typeof document === 'undefined') return COLORS_FALLBACK;
  try {
    const style = getComputedStyle(document.documentElement);
    return [
      style.getPropertyValue('--p31-accent').trim() || COLORS_FALLBACK[0],
      style.getPropertyValue('--p31-accent-violet').trim() || COLORS_FALLBACK[1],
      style.getPropertyValue('--p31-accent-gold').trim() || COLORS_FALLBACK[2],
      style.getPropertyValue('--p31-accent-green').trim() || COLORS_FALLBACK[3],
      style.getPropertyValue('--p31-accent-red').trim() || COLORS_FALLBACK[4],
      style.getPropertyValue('--p31-accent-iris').trim() || COLORS_FALLBACK[5],
    ];
  } catch { return COLORS_FALLBACK; }
}

export function ArcadeSurface() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const animRef = useRef<number>(0);
  const [mode, setMode] = useState<'starfield' | 'nebula' | 'matrix'>('starfield');
  const [speed, setSpeed] = useState(1);
  const [density, setDensity] = useState(150);

  // Regenerate spoons through ambient engagement (self-care, no ledger write)
  useEffect(() => {
    const timer = setTimeout(() => {
      const el = document.documentElement;
      const current = parseInt(el.getAttribute('data-spoons') || '3', 10);
      if (current < 5) {
        const next = Math.min(current + 1, 5);
        el.setAttribute('data-spoons', String(next));
        localStorage.setItem('p31:spoons', String(next));
      }
    }, 30000);
    return () => clearTimeout(timer);
  }, []);

  const initStars = useCallback((count: number) => {
    const colors = getColors();
    starsRef.current = Array.from({ length: count }, () => ({
      id: Math.random(),
      x: Math.random() * 100,
      y: Math.random() * 100,
      z: Math.random() * 100,
      size: 0.5 + Math.random() * 2,
      brightness: 0.3 + Math.random() * 0.7,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 0.1,
      vy: (Math.random() - 0.5) * 0.1,
    }));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);

    initStars(density);

    let cachedBg = '#0A0A0F';
    const readBg = () => {
      if (typeof document !== 'undefined') {
        try {
          cachedBg = getComputedStyle(document.documentElement).getPropertyValue('--p31-bg').trim() || '#0A0A0F';
        } catch {}
      }
    };
    readBg();

    const animate = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.fillStyle = cachedBg + '26'; ctx.fillRect(0, 0, w, h);

      if (mode === 'starfield') {
        starsRef.current.forEach(s => {
          s.z -= speed * 0.5;
          if (s.z <= 0) {
            s.x = Math.random() * 100;
            s.y = Math.random() * 100;
            s.z = 100;
          }
          const sx = (s.x - 50) * (100 / s.z) * (w / 100) + w / 2;
          const sy = (s.y - 50) * (100 / s.z) * (h / 100) + h / 2;
          const size = s.size * (100 / s.z) * 0.5;
          const alpha = s.brightness * (s.z / 100);
          ctx.beginPath();
          ctx.arc(sx, sy, Math.max(0.5, size), 0, Math.PI * 2);
          ctx.fillStyle = s.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
          ctx.fill();
        });
      } else if (mode === 'nebula') {
        starsRef.current.forEach(s => {
          s.x += s.vx * speed;
          s.y += s.vy * speed;
          if (s.x < 0 || s.x > 100) s.vx *= -1;
          if (s.y < 0 || s.y > 100) s.vy *= -1;
          const sx = (s.x / 100) * w;
          const sy = (s.y / 100) * h;
          const gradient = ctx.createRadialGradient(sx, sy, 0, sx, sy, s.size * 8);
          gradient.addColorStop(0, s.color + '30');
          gradient.addColorStop(1, s.color + '00');
          ctx.fillStyle = gradient;
          ctx.fillRect(sx - s.size * 8, sy - s.size * 8, s.size * 16, s.size * 16);
        });
      } else if (mode === 'matrix') {
        const time = Date.now() * 0.001;
        starsRef.current.forEach((s, i) => {
          const x = (s.x / 100) * w;
          const y = ((s.y + time * 20 * speed) % 110) - 5;
          const sy = (y / 100) * h;
          const char = String.fromCharCode(0x30A0 + Math.floor(Math.random() * 96));
          ctx.font = `${Math.max(8, s.size * 4)}px monospace`;
          ctx.fillStyle = s.color + Math.floor(s.brightness * 180).toString(16).padStart(2, '0');
          ctx.fillText(char, x, sy);
        });
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animRef.current);
  }, [mode, speed, density, initStars]);

  useEffect(() => {
    initStars(density);
  }, [density, initStars]);

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6" data-mcp-tool="arcadeSurface" data-mcp-state={mode}>
      <GlassCard className="p-6">
        <h1 className="text-2xl font-bold text-quantum-cyan font-mono-tech mb-1">Arcade</h1>
        <p className="text-cloud/50 text-sm">3D visualisations and immersive scenes.</p>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-80 bg-void rounded-xl" />
      </GlassCard>

      <GlassCard className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xs text-cloud/40">Scene:</span>
          {(['starfield', 'nebula', 'matrix'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                mode === m ? 'border-quantum-cyan/30 text-quantum-cyan bg-quantum-cyan/10' : 'border-white/10 text-cloud/40'
              }`}
              data-mcp-tool="setArcadeMode"
              data-mcp-target={`mode-${m}`}
              data-mcp-state={mode === m ? 'active' : 'inactive'}
            >
              {m}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="text-xs text-cloud/40 block mb-1">Speed</label>
            <input type="range" min="0.1" max="3" step="0.1" value={speed} onChange={e => setSpeed(Number(e.target.value))} className="w-full accent-quantum-cyan" data-mcp-tool="setSpeed" data-mcp-type="input" data-mcp-range="0.1,3" data-mcp-current={String(speed)} />
          </div>
          <div className="flex-1">
            <label className="text-xs text-cloud/40 block mb-1">Density</label>
            <input type="range" min="50" max="500" step="10" value={density} onChange={e => setDensity(Number(e.target.value))} className="w-full accent-quantum-cyan" data-mcp-tool="setDensity" data-mcp-type="input" data-mcp-range="50,500" data-mcp-current={String(density)} />
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
