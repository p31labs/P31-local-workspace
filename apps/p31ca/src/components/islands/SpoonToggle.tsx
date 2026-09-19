'use client';

import { useState, useEffect, useCallback } from 'react';

const SPOON_LEVELS = [0, 1, 2, 3, 4, 5] as const;

export default function SpoonToggle() {
  const [spoons, setSpoonsState] = useState<number>(3);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = parseInt(localStorage.getItem('p31:spoons') || '3', 10);
    setSpoonsState(stored);
    document.documentElement.setAttribute('data-spoons', String(stored));
  }, []);

  const setSpoons = useCallback((level: number) => {
    setSpoonsState(level);
    localStorage.setItem('p31:spoons', String(level));
    document.documentElement.setAttribute('data-spoons', String(level));
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 px-2.5 py-1 rounded-full text-xs font-mono">
        <span className="text-gray-400 hidden sm:inline">Spoons:</span>
        <span className="text-gray-300">3</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 px-2.5 py-1 rounded-full text-xs font-mono">
      <span className="text-gray-400 hidden sm:inline">Spoons:</span>
      {SPOON_LEVELS.map((level) => (
        <button
          key={level}
          onClick={() => setSpoons(level)}
          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
            spoons === level
              ? level === 0
                ? 'bg-red-500 text-white'
                : 'bg-brand-cyan text-black'
              : 'bg-white/10 text-gray-400 hover:text-white'
          }`}
          title={`Spoons = ${level}${level === 0 ? ' (Crisis Mode)' : ''}`}
          aria-label={`Set cognitive load to ${level}`}
          aria-pressed={spoons === level}
        >
          {level}
        </button>
      ))}
    </div>
  );
}
