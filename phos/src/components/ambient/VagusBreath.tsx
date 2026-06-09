import React, { useRef, useEffect } from 'react';
import { useAtmosphere } from '../AtmosphereProvider';

const VagusBreath: React.FC = () => {
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

    /* v8 ignore start */
    const animate = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (grayRock) { animRef.current = requestAnimationFrame(animate); return; }
      const cx = canvas.width / 2, cy = canvas.height / 2;
      const maxR = Math.min(canvas.width, canvas.height) * 0.35;
      const t = (time % 6000) / 6000;
      const breathR = maxR * (0.4 + 0.6 * (0.5 + 0.5 * Math.sin(t * Math.PI * 2)));
      const alpha = (spoons <= 1 ? 0.06 : 0.12) * (0.5 + 0.5 * Math.sin(t * Math.PI * 2));
      const grad = ctx.createRadialGradient(cx, cy, breathR * 0.3, cx, cy, breathR);
      grad.addColorStop(0, 'rgba(167,139,250,0)');
      grad.addColorStop(0.7, `rgba(167,139,250,${alpha})`);
      grad.addColorStop(1, `rgba(167,139,250,${alpha * 0.5})`);
      ctx.beginPath();
      ctx.arc(cx, cy, breathR, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx, cy, breathR, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(167,139,250,${alpha * 1.5})`;
      ctx.lineWidth = 1;
      ctx.stroke();
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    /* v8 ignore stop */
    return () => { cancelAnimationFrame(animRef.current); ro.disconnect(); };
  }, [spoons, grayRock]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }} aria-hidden="true" />;
};

export default VagusBreath;