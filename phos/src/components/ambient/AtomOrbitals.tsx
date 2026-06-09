import React, { useRef, useEffect } from 'react';
import { useAtmosphere } from '../AtmosphereProvider';

const AtomOrbitals: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
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

    const atoms = [
      { x: 0.3, y: 0.4, electrons: 2, speed: 0.4, color: '#ffb000' },
      { x: 0.7, y: 0.6, electrons: 3, speed: 0.3, color: '#ff6b6b' },
    ];

    /* v8 ignore start */
    const animate = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (grayRock || spoons <= 0) { animRef.current = requestAnimationFrame(animate); return; }
      const alpha = spoons <= 1 ? 0.15 : spoons <= 2 ? 0.3 : 0.6;
      const w = canvas.width, h = canvas.height;
      for (const atom of atoms) {
        const cx = atom.x * w, cy = atom.y * h;
        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, Math.PI * 2);
        ctx.fillStyle = `${atom.color}${Math.round(alpha * 200).toString(16).padStart(2, '0')}`;
        ctx.fill();
        for (let e = 0; e < atom.electrons; e++) {
          const orbitR = 20 + e * 18;
          const ex = cx + Math.cos(time * 0.001 * atom.speed + e * Math.PI) * orbitR;
          const ey = cy + Math.sin(time * 0.001 * atom.speed * 1.5 + e * Math.PI) * orbitR * 0.6;
          ctx.beginPath();
          ctx.arc(ex, ey, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = `${atom.color}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`;
          ctx.fill();
          ctx.beginPath();
          ctx.ellipse(cx, cy, orbitR, orbitR * 0.6, 0, 0, Math.PI * 2);
          ctx.strokeStyle = `${atom.color}${Math.round(alpha * 40).toString(16).padStart(2, '0')}`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    /* v8 ignore stop */
    return () => { cancelAnimationFrame(animRef.current); ro.disconnect(); };
  }, [spoons, grayRock]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }} aria-hidden="true" />;
};

export default AtomOrbitals;