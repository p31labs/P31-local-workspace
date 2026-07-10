import { useEffect, useRef } from 'react';
import { readThemeColors } from '../../../lib/arcade-core/cssVars.ts';

interface BashballFieldProps {
  bases: [boolean, boolean, boolean];
  spoonLevel?: number;
}

const TILE_W = 80;
const TILE_H = 40;

function spriteFor(kind: 'batter' | 'pitcher' | 'runner'): string {
  switch (kind) {
    case 'batter': return '🧢';
    case 'pitcher': return '🥎';
    case 'runner': return '🏃';
  }
}

export function BashballField({ bases, spoonLevel = 6 }: BashballFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const W = canvas.clientWidth || 700;
      const H = canvas.clientHeight || 360;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      const c = readThemeColors();
      const fieldGreen = c['--p31-field-green'] || 'rgba(58,119,40,0.55)';
      const fieldGreenDeep = c['--p31-green-dim'] || 'rgba(31,74,42,0.5)';
      const cloud30 = c['--p31-cloud-30'] || 'rgba(232,230,227,0.3)';
      const cloud18 = c['--p31-cloud-20'] || 'rgba(232,230,227,0.2)';

      const centerX = W / 2;
      const homeY = H - 64;

      const project = (gx: number, gy: number) => ({
        x: centerX + (gx - gy) * TILE_W,
        y: homeY - (gx + gy) * TILE_H,
      });

      const home = project(0, 0);
      const first = project(1, 0);
      const second = project(1, 1);
      const third = project(0, 1);
      const pitcher = project(0.5, 0.5);

      // grass diamond
      ctx.beginPath();
      ctx.moveTo(home.x, home.y);
      ctx.lineTo(first.x, first.y);
      ctx.lineTo(second.x, second.y);
      ctx.lineTo(third.x, third.y);
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, homeY, 0, second.y);
      grad.addColorStop(0, fieldGreen);
      grad.addColorStop(1, fieldGreenDeep);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = cloud18;
      ctx.lineWidth = 2;
      ctx.stroke();

      const drawBase = (p: { x: number; y: number }, occupied: boolean) => {
        const s = 16;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(Math.PI / 4);
        ctx.fillStyle = occupied ? 'rgba(255,255,255,0.92)' : cloud30;
        ctx.fillRect(-s / 2, -s / 2, s, s);
        ctx.restore();
      };
      drawBase(home, true);
      drawBase(first, bases[0]);
      drawBase(second, bases[1]);
      drawBase(third, bases[2]);

      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.beginPath();
      ctx.arc(home.x, home.y, 6, 0, Math.PI * 2);
      ctx.fill();

      const glyph = (p: { x: number; y: number }, ch: string, size = 30) => {
        ctx.font = `${size}px 'Press Start 2P', 'Segoe UI Emoji', 'Apple Color Emoji', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(ch, p.x, p.y - size / 2);
      };

      // depth order: far -> near
      glyph(pitcher, spriteFor('pitcher'));
      if (bases[1]) glyph(second, spriteFor('runner'));
      if (bases[2]) glyph(third, spriteFor('runner'));
      if (bases[0]) glyph(first, spriteFor('runner'));
      glyph(home, spriteFor('batter'));
    };

    draw();
    const ro = new ResizeObserver(() => draw());
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [bases]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: 360, display: 'block', borderRadius: 12, border: '1px solid var(--p31-green-border)' }}
      aria-label="Isometric baseball field"
    />
  );
}
