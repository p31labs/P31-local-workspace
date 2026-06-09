import React, { useRef, useEffect } from 'react';
import { useAtmosphere } from '../AtmosphereProvider';

const VaultScanlines: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const scanYRef = useRef(0);
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
      const alpha = spoons <= 1 ? 0.02 : spoons <= 2 ? 0.04 : 0.08;
      const w = canvas.width, h = canvas.height;
      ctx.strokeStyle = `rgba(0,229,255,${alpha})`;
      ctx.lineWidth = 1;
      for (let y = 0; y < h; y += 4) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }
      scanYRef.current = (scanYRef.current + 0.5) % h;
      const grad = ctx.createLinearGradient(0, scanYRef.current - 20, 0, scanYRef.current + 20);
      grad.addColorStop(0, 'rgba(0,229,255,0)');
      grad.addColorStop(0.5, `rgba(0,229,255,${alpha * 2})`);
      grad.addColorStop(1, 'rgba(0,229,255,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, scanYRef.current - 20, w, 40);
      const lockAlpha = alpha * 0.3 * (0.5 + 0.5 * Math.sin(time * 0.0008));
      ctx.strokeStyle = `rgba(0,229,255,${lockAlpha})`;
      ctx.lineWidth = 1.5;
      const cx = w * 0.85, cy = h * 0.15, s = 12;
      ctx.beginPath(); ctx.arc(cx, cy - s * 0.3, s * 0.6, Math.PI, 0); ctx.stroke();
      ctx.strokeRect(cx - s * 0.6, cy - s * 0.3, s * 1.2, s * 0.9);
      ctx.beginPath(); ctx.arc(cx, cy - s * 0.1, s * 0.15, 0, Math.PI * 2); ctx.fillStyle = `rgba(0,229,255,${lockAlpha * 0.5})`; ctx.fill();
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    /* v8 ignore stop */
    return () => { cancelAnimationFrame(animRef.current); ro.disconnect(); };
  }, [spoons, grayRock]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }} aria-hidden="true" />;
};

export default VaultScanlines;