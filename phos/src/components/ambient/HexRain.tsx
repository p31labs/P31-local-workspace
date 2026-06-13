import React, { useRef, useEffect } from 'react';
import { useAtmosphere } from '../AtmosphereProvider';
import { SurfaceErrorBoundary } from '../SurfaceErrorBoundary';

interface HexDrop {
  x: number; y: number; speed: number; chars: string; opacity: number; len: number;
}

const HexRain: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const dropsRef = useRef<HexDrop[]>([]);
  const { spoons, grayRock } = useAtmosphere();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.font = '10px monospace';
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const hexChars = '0123456789ABCDEF';
    const spawnDrop = () => {
      if (dropsRef.current.length > 40) return;
      const chars = Array.from({ length: 8 + Math.floor(Math.random() * 12) }, () => hexChars[Math.floor(Math.random() * 16)]).join('');
      dropsRef.current.push({ x: Math.random(), y: -0.05, speed: 0.003 + Math.random() * 0.007, chars, opacity: 0.3 + Math.random() * 0.5, len: chars.length });
    };

    /* v8 ignore start */
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (grayRock) { animRef.current = requestAnimationFrame(animate); return; }
      const intensity = spoons <= 1 ? 0.15 : spoons <= 2 ? 0.4 : 0.8;
      for (let i = 0; i < Math.floor(2 * intensity); i++) spawnDrop();
      const w = canvas.width, h = canvas.height;
      const alive: HexDrop[] = [];
      ctx.font = '10px monospace';
      for (const d of dropsRef.current) {
        d.y += d.speed;
        if (d.y > 1.1) continue;
        const x = d.x * w;
        for (let c = 0; c < d.chars.length; c++) {
          const cy = (d.y - c * 0.015) * h;
          if (cy < -20 || cy > h + 20) continue;
          const head = c === 0;
          const alpha = (head ? 1 : Math.max(0, 1 - c * 0.06)) * d.opacity * intensity;
          ctx.fillStyle = head ? `rgba(176,38,255,${alpha})` : `rgba(176,38,255,${alpha * 0.7})`;
          ctx.fillText(d.chars[c], x, cy);
        }
        alive.push(d);
      }
      dropsRef.current = alive;
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    /* v8 ignore stop */
    return () => { cancelAnimationFrame(animRef.current); ro.disconnect(); dropsRef.current = []; };
  }, [spoons, grayRock]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }} aria-hidden="true" />;
};

function HexRainWithBoundary() {
  return (
    <SurfaceErrorBoundary canvasName="HexRain">
      <HexRain />
    </SurfaceErrorBoundary>
  );
}

export default HexRainWithBoundary;