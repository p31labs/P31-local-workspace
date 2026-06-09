import React, { useRef, useEffect } from 'react';
import { useAtmosphere } from '../AtmosphereProvider';

interface Ember {
  x: number; y: number; vx: number; vy: number; size: number; life: number; maxLife: number;
}

const EmberParticles: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const embersRef = useRef<Ember[]>([]);
  const { spoons, grayRock } = useAtmosphere();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const spawnEmber = () => {
      if (embersRef.current.length > 30) return;
      embersRef.current.push({
        x: Math.random(), y: 1.05,
        vx: (Math.random() - 0.5) * 0.003, vy: -(0.003 + Math.random() * 0.005),
        size: 1 + Math.random() * 2.5, life: 0, maxLife: 2000 + Math.random() * 3000,
      });
    };

    /* v8 ignore start */
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (grayRock) { animRef.current = requestAnimationFrame(animate); return; }
      const intensity = spoons <= 1 ? 0.1 : spoons <= 2 ? 0.3 : spoons <= 3 ? 0.6 : 1.0;
      for (let i = 0; i < Math.floor(3 * intensity); i++) spawnEmber();
      const w = canvas.width, h = canvas.height;
      const alive: Ember[] = [];
      for (const e of embersRef.current) {
        e.life += 16;
        if (e.life > e.maxLife) continue;
        e.x += e.vx + Math.sin(e.life * 0.003) * 0.001;
        e.y += e.vy;
        const progress = e.life / e.maxLife;
        const alpha = progress < 0.1 ? progress / 0.1 : progress > 0.7 ? (1 - progress) / 0.3 : 1;
        const flicker = 0.7 + Math.sin(e.life * 0.02) * 0.3;
        const r = (1 - progress) * 255, g = (1 - progress) * 120 + progress * 60, b = progress * 40;
        ctx.beginPath();
        ctx.arc(e.x * w, e.y * h, e.size * (0.5 + (1 - progress) * 0.5), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${alpha * intensity * flicker * 0.7})`;
        ctx.fill();
        alive.push(e);
      }
      embersRef.current = alive;
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    /* v8 ignore stop */
    return () => { cancelAnimationFrame(animRef.current); ro.disconnect(); embersRef.current = []; };
  }, [spoons, grayRock]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }} aria-hidden="true" />;
};

export default EmberParticles;