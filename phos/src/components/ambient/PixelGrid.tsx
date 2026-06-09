import React, { useRef, useEffect } from 'react';
import { useAtmosphere } from '../AtmosphereProvider';

const PixelGrid: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const scrollRef = useRef(0);
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

    /* v8 ignore start */
    const animate = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (grayRock) { animRef.current = requestAnimationFrame(animate); return; }
      const alpha = spoons <= 1 ? 0.03 : spoons <= 2 ? 0.06 : 0.12;
      const gridSize = 48;
      scrollRef.current = (scrollRef.current + 0.25) % gridSize;
      ctx.strokeStyle = `rgba(57,255,20,${alpha})`;
      ctx.lineWidth = 0.5;
      for (let x = 0; x <= canvas.width; x += gridSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      }
      for (let y = scrollRef.current; y <= canvas.height; y += gridSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
      }
      const glowAlpha = alpha * 0.4 * (0.5 + 0.5 * Math.sin(time * 0.002));
      ctx.fillStyle = `rgba(57,255,20,${glowAlpha})`;
      const gx = ((time * 0.03) % (canvas.width + 100)) - 50;
      ctx.fillRect(gx, canvas.height * 0.3, 3, canvas.height * 0.4);
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    /* v8 ignore stop */
    return () => { cancelAnimationFrame(animRef.current); ro.disconnect(); };
  }, [spoons, grayRock]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }} aria-hidden="true" />;
};

export default PixelGrid;