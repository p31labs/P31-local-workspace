import React, { useRef, useEffect, useState } from 'react';
import { useAtmosphere } from '../AtmosphereProvider';

const GlitchEffect: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { spoons, grayRock } = useAtmosphere();
  const [offset, setOffset] = useState({ x: 0, active: false });

  useEffect(() => {
    if (grayRock || spoons <= 0) { setOffset({ x: 0, active: false }); return; }
    const interval = setInterval(() => {
      if (Math.random() < 0.1) {
        setOffset({ x: (Math.random() - 0.5) * 4, active: true });
        setTimeout(() => setOffset({ x: 0, active: false }), 80 + Math.random() * 120);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [grayRock, spoons]);

  /* v8 ignore start */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (!offset.active) return;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const shift = Math.round(offset.x);
    if (shift !== 0) {
      for (let y = 0; y < canvas.height; y += 2) {
        const rowStart = y * canvas.width;
        for (let x = 0; x < canvas.width; x++) {
          const srcX = Math.max(0, Math.min(canvas.width - 1, x + shift));
          const srcIdx = (rowStart + srcX) * 4;
          const dstIdx = (rowStart + x) * 4;
          imageData.data[dstIdx] = imageData.data[srcIdx];
          imageData.data[dstIdx + 1] = imageData.data[srcIdx + 1];
          imageData.data[dstIdx + 2] = imageData.data[srcIdx + 2];
        }
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }, [offset]);
  /* v8 ignore stop */

  return (
    <>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0, opacity: 0 }} aria-hidden="true" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 0,
          opacity: offset.active ? 0.15 : 0,
          transform: `translateX(${offset.x}px)`,
          transition: offset.active ? 'none' : 'opacity 0.1s',
        }}
        aria-hidden="true"
      >
        <div className="absolute inset-0" style={{ background: 'linear-gradient(transparent 50%, rgba(167,139,250,0.03) 50%)', backgroundSize: '100% 4px' }} />
      </div>
    </>
  );
};

export default GlitchEffect;