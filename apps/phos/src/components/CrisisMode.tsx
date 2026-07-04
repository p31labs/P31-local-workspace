import React, { useState, useEffect, useRef } from 'react';

const PHASES = [
  { label: 'Breathe in', key: 'in' },
  { label: 'Hold', key: 'hold1' },
  { label: 'Breathe out', key: 'out' },
  { label: 'Hold', key: 'hold2' },
];

export default function CrisisMode() {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const phase = PHASES[phaseIndex];
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setPhaseIndex(prev => (prev + 1) % PHASES.length);
    }, 4000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const isInhale = phase.key === 'in';
  const isExhale = phase.key === 'out';

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-black z-50 select-none">
      <div
        className="rounded-full border border-white/15 transition-all duration-[4000ms] ease-in-out flex items-center justify-center"
        style={{
          width: isInhale ? '160px' : isExhale ? '96px' : '128px',
          height: isInhale ? '160px' : isExhale ? '96px' : '128px',
          boxShadow: isInhale
            ? '0 0 80px rgba(255,255,255,0.06)'
            : '0 0 30px rgba(255,255,255,0.02)',
        }}
      >
        <div
          className="rounded-full bg-white/5 transition-all duration-[4000ms] ease-in-out"
          style={{
            width: isInhale ? '80px' : isExhale ? '40px' : '60px',
            height: isInhale ? '80px' : isExhale ? '40px' : '60px',
          }}
        />
      </div>

      <p className="mt-10 text-white/50 text-base font-light tracking-wide transition-opacity duration-500">
        {phase.label}
      </p>

      <div className="flex gap-1.5 mt-6">
        {PHASES.map((p, i) => (
          <div
            key={p.key}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${
              i === phaseIndex ? 'bg-white/40 w-3' : 'bg-white/10'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
