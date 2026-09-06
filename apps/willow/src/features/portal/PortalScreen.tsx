/**
 * @file PortalScreen.tsx — WILLOW breathing portal (genesis).
 * 4-in · 4-hold · 6-out pattern. Ported from prototype.
 */

import { useEffect, useState } from 'react';
import { useWillowStore } from '../../store/willowStore';

export function PortalScreen() {
  const { earnLove } = useWillowStore();
  const [active, setActive] = useState(false);
  const [phase, setPhase] = useState<'in' | 'hold' | 'out'>('in');
  const [count, setCount] = useState(4);
  const [cycles, setCycles] = useState(0);

  useEffect(() => {
    if (!active) return;
    const PHASES: { name: 'in' | 'hold' | 'out'; duration: number; next: 'in' | 'hold' | 'out' }[] = [
      { name: 'in', duration: 4, next: 'hold' },
      { name: 'hold', duration: 4, next: 'out' },
      { name: 'out', duration: 6, next: 'in' },
    ];
    const current = PHASES.find((p) => p.name === phase) || PHASES[0];
    setCount(current.duration);
    const interval = setInterval(() => setCount((c) => {
      if (c <= 1) {
        if (phase === 'out') {
          setCycles((n) => {
            if (n + 1 >= 3) { earnLove(15); setActive(false); return 0; }
            return n + 1;
          });
        }
        setPhase(current.next);
        return current.duration;
      }
      return c - 1;
    }), 1000);
    return () => clearInterval(interval);
  }, [active, phase, earnLove]);

  const phaseColors: Record<string, string> = { in: '#34d399', hold: '#fbbf24', out: '#60a5fa' };
  const c = phaseColors[phase];
  const phaseLabel: Record<string, string> = { in: 'Breathe in 🌬️', hold: 'Hold 🌿', out: 'Let go 💨' };

  return (
    <div className="flex flex-col items-center justify-center h-full gap-7 animate-[fadeUp_0.22s_ease-out]">
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {active && <div style={{ position: 'absolute', width: 180, height: 180, borderRadius: '50%', border: `2px solid ${c}30`, animation: 'ripple 2s ease-out infinite', pointerEvents: 'none' }} />}
        <div style={{
          width: 140, height: 140, borderRadius: '50%',
          border: `2px solid ${active ? c : 'rgba(52,211,153,0.25)'}`,
          background: `radial-gradient(circle, ${active ? c : '#34d399'}18, ${active ? c : '#34d399'}04)`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.5s',
          transform: active && phase === 'in' ? 'scale(1.15)' : active && phase === 'hold' ? 'scale(1.15)' : 'scale(0.85)',
          boxShadow: active ? `0 0 40px ${c}25` : 'none',
        }}>
          <span style={{ fontSize: 32 }}>🌿</span>
          <span style={{ fontFamily: 'var(--p31-font-mono, monospace)', fontSize: 24, fontWeight: 700, color: active ? c : 'rgba(52,211,153,0.5)', lineHeight: 1, marginTop: 4 }}>{count}</span>
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 18, fontWeight: 600, color: active ? c : 'rgba(240,242,245,0.5)', transition: 'color 0.4s' }}>{active ? phaseLabel[phase] : 'Ready when you are'}</div>
        {active && <div style={{ fontFamily: 'var(--p31-font-mono, monospace)', fontSize: 10, color: 'var(--p31-text-secondary)', marginTop: 6 }}>Cycle {cycles + 1} of 3</div>}
        {cycles > 0 && !active && <div style={{ fontSize: 14, color: 'var(--p31-accent)', marginTop: 8 }}>🌟 Breathing complete! +15 ❤️</div>}
      </div>
      <button
        onClick={() => { setActive((v) => !v); setPhase('in'); setCount(4); setCycles(0); }}
        style={{
          minWidth: 120, minHeight: 48, padding: '12px 24px', borderRadius: 14,
          border: `1px solid ${active ? 'rgba(251,113,133,0.4)' : 'rgba(52,211,153,0.4)'}`,
          background: active ? 'rgba(251,113,133,0.1)' : 'rgba(52,211,153,0.1)',
          color: active ? 'var(--p31-accent-red)' : 'var(--p31-accent)', fontWeight: 700, fontSize: 15, cursor: 'pointer',
        }}
      >{active ? '⏹ Pause' : '▶ Begin'}</button>
      <div style={{ fontFamily: 'var(--p31-font-mono, monospace)', fontSize: 10, color: 'var(--p31-text-secondary)', textAlign: 'center', lineHeight: 1.7 }}>
        Pattern: 4 in · 4 hold · 6 out<br />Complete 3 cycles to earn +15 ❤️
      </div>
    </div>
  );
}
