import { useEffect, useRef } from 'react';

export default function JitterbugCore() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 300;
    canvas.style.opacity = '0.15';
    canvas.style.position = 'absolute';
    canvas.style.inset = '0';
    el.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const vertices = [
      { x: 150, y: 50  },
      { x: 50,  y: 200 },
      { x: 250, y: 200 },
      { x: 150, y: 150 },
    ];

    const edges = [
      [0, 1], [0, 2], [0, 3],
      [1, 2], [1, 3], [2, 3],
    ];

    let frameId: number;
    let t = 0;
    const animate = () => {
      t += 0.005;
      ctx.clearRect(0, 0, 300, 300);

      const jitter = Math.sin(t * 0.4) * 15;
      const current = vertices.map((v, i) => ({
        x: v.x + Math.cos(t + i * 1.5) * jitter,
        y: v.y + Math.sin(t + i * 1.5) * jitter,
      }));

      ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
      ctx.lineWidth = 1;
      edges.forEach(([a, b]) => {
        ctx.beginPath();
        ctx.moveTo(current[a].x, current[a].y);
        ctx.lineTo(current[b].x, current[b].y);
        ctx.stroke();
      });

      current.forEach((v) => {
        ctx.beginPath();
        ctx.arc(v.x, v.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 240, 255, 0.4)';
        ctx.fill();
      });

      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameId);
      el.removeChild(canvas);
    };
  }, []);

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    />
  );
}
