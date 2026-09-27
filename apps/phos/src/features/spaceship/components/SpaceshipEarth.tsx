import { useState, useEffect, useRef } from 'react';
import { GlassCard } from '@p31ca/ui/chrome';
import { GlowButton } from '@p31ca/ui/chrome';
import { useSpoon } from '../../../shared/hooks/useSpoon';

export function SpaceshipEarth() {
  const { spoons } = useSpoon();
  const key = 'phos:spaceship';

  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d')!; c.width = c.offsetWidth; c.height = 320;
    let t = 0; let raf = 0;
    const style = getComputedStyle(document.documentElement);
    const accent = style.getPropertyValue('--p31-accent').trim() || '#00F0FF';
    const accentViolet = style.getPropertyValue('--p31-accent-violet').trim() || '#A78BFA';
    const bg = style.getPropertyValue('--p31-bg').trim() || '#0A0A0F';
    const draw = () => {
      ctx.fillStyle = bg + '33'; ctx.fillRect(0,0,c.width,c.height);
      for (let i=0;i<24;i++){ const a = t*0.01 + i; const r = 80 + i*4; const x = c.width/2 + Math.cos(a)*r; const y = c.height/2 + Math.sin(a*1.3)*r*0.6; ctx.beginPath(); ctx.arc(x,y,2,0,7); ctx.fillStyle = i%2 ? accent : accentViolet; ctx.fill(); }
      t++; raf = requestAnimationFrame(draw);
    }; draw();
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <GlassCard className="p-6">
        <h1 className="text-2xl font-bold text-quantum-cyan font-mono-tech mb-1">Spaceship Earth</h1>
        <p className="text-cloud/50 text-sm">A living view of the global care mesh.</p>
      </GlassCard>
      <GlassCard className="p-2"><canvas ref={canvasRef} className="w-full rounded-xl" /></GlassCard>
    </div>
  );
}
