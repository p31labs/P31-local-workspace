import React, { useRef, useEffect } from 'react';
import { useAtmosphere } from '../AtmosphereProvider';
import { SurfaceErrorBoundary } from '../SurfaceErrorBoundary';

interface GentleDreamscapeProps {
  spoons?: number;
}

const GentleDreamscape: React.FC<GentleDreamscapeProps> = ({ spoons: propSpoons }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const ctxSpoons = useAtmosphere();
  const spoons = propSpoons ?? ctxSpoons.spoons;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const orbs = Array.from({ length: 12 }).map(() => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: Math.random() * 60 + 40,
      speedX: (Math.random() - 0.5) * 0.5,
      speedY: (Math.random() - 0.5) * 0.5,
      hue: Math.random() * 60 + 320,
    }));

    let time = 0;

    /* v8 ignore start */
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (spoons <= 1) {
        time += 0.02;
        const breath = Math.sin(time) * 0.5 + 0.5;
        const radius = Math.min(canvas.width, canvas.height) * 0.4 * (1 + breath * 0.1);
        const grad = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 0, canvas.width/2, canvas.height/2, radius);
        grad.addColorStop(0, `rgba(255, 183, 77, ${0.2 + breath * 0.1})`);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        animRef.current = requestAnimationFrame(animate);
        return;
      }

      orbs.forEach(orb => {
        orb.x += orb.speedX * (spoons / 5);
        orb.y += orb.speedY * (spoons / 5);
        if (orb.x < -100) orb.x = canvas.width + 100;
        if (orb.x > canvas.width + 100) orb.x = -100;
        if (orb.y < -100) orb.y = canvas.height + 100;
        if (orb.y > canvas.height + 100) orb.y = -100;
        const grad = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.size);
        grad.addColorStop(0, `hsla(${orb.hue}, 80%, 70%, 0.4)`);
        grad.addColorStop(1, 'hsla(0, 0%, 0%, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.size, 0, Math.PI * 2);
        ctx.fill();
      });

      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    /* v8 ignore stop */
    return () => { cancelAnimationFrame(animRef.current); ro.disconnect(); };
  }, [spoons]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }} aria-hidden="true" />;
};

function GentleDreamscapeWithBoundary(props: GentleDreamscapeProps) {
  return (
    <SurfaceErrorBoundary canvasName="GentleDreamscape">
      <GentleDreamscape {...props} />
    </SurfaceErrorBoundary>
  );
}

export default GentleDreamscapeWithBoundary;
