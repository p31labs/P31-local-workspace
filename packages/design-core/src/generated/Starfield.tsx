/**
 * @file Starfield — Animated canvas background with twinkling stars.
 * Auto-generated from components.yml.
 *
 * @a2ui-component Starfield
 * @a2ui-props count number - Star count
 * @a2ui-props speed number - Animation speed
 * @a2ui-example {"component":"Starfield","count":200,"speed":0.08}
 */

import { useEffect, useRef } from 'react';

export interface StarfieldProps {
  count?: number;
  speed?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function Starfield({ count = 200, speed = 0.08, className, style }: StarfieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const stars = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2,
      opacity: Math.random(),
      speed: Math.random() * speed + 0.01,
    }));

    let animationId: number;
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach(star => {
        star.opacity += star.speed;
        if (star.opacity > 1 || star.opacity < 0) star.speed = -star.speed;
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.abs(star.opacity) * 0.8})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });
      animationId = requestAnimationFrame(animate);
    }

    animate();

    return () => cancelAnimationFrame(animationId);
  }, [count, speed]);

  return <canvas ref={canvasRef} className={`fixed inset-0 pointer-events-none ${className || ''}`} style={style} aria-hidden="true" />;
}

export default Starfield;
