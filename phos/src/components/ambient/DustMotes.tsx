import React, { useRef, useEffect } from 'react';
import { useAtmosphere } from '../AtmosphereProvider';
import { SurfaceErrorBoundary } from '../SurfaceErrorBoundary';

interface DustMote {
  x: number; y: number; size: number; opacity: number; vx: number; vy: number; drift: number;
}

const DustMotes: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const motesRef = useRef<DustMote[]>([]);
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

    const initMotes = () => {
      const motes: DustMote[] = [];
      for (let i = 0; i < 25; i++) {
        motes.push({
          x: Math.random(), y: Math.random(), size: 0.5 + Math.random() * 1.5,
          opacity: 0.1 + Math.random() * 0.3, vx: (Math.random() - 0.5) * 0.0003,
          vy: (Math.random() - 0.5) * 0.0002, drift: Math.random() * Math.PI * 2,
        });
      }
      motesRef.current = motes;
    };
    initMotes();

    /* v8 ignore start */
    const animate = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (grayRock) { animRef.current = requestAnimationFrame(animate); return; }
      const baseAlpha = spoons <= 1 ? 0.3 : 1.0;
      const w = canvas.width, h = canvas.height;
      for (const m of motesRef.current) {
        m.drift += 0.005;
        m.x += m.vx + Math.sin(m.drift) * 0.0002;
        m.y += m.vy + Math.cos(m.drift * 0.7) * 0.0001;
        if (m.x > 1) m.x = 0; if (m.x < 0) m.x = 1;
        if (m.y > 1) m.y = 0; if (m.y < 0) m.y = 1;
        const flicker = 0.6 + Math.sin(m.drift * 2) * 0.4;
        const alpha = m.opacity * baseAlpha * flicker;
        ctx.beginPath();
        ctx.arc(m.x * w, m.y * h, m.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,180,100,${alpha})`;
        ctx.fill();
      }
      const pulseA = 0.02 * baseAlpha * (0.5 + 0.5 * Math.sin(time * 0.001));
      const grad = ctx.createRadialGradient(w * 0.5, h * 0.5, 0, w * 0.5, h * 0.5, Math.min(w, h) * 0.5);
      grad.addColorStop(0, `rgba(255,160,80,${pulseA})`);
      grad.addColorStop(1, 'rgba(255,160,80,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    /* v8 ignore stop */
    return () => { cancelAnimationFrame(animRef.current); ro.disconnect(); };
  }, [spoons, grayRock]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }} aria-hidden="true" />;
};

function DustMotesWithBoundary() {
  return (
    <SurfaceErrorBoundary canvasName="DustMotes">
      <DustMotes />
    </SurfaceErrorBoundary>
  );
}

export default DustMotesWithBoundary;