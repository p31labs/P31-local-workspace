/**
 * @file SpoonDial — Shared spoon-level selector for headers.
 * Two modes: 'button' (compact 36px, PHOS/WILLOW) and 'pips' (6 dots, phosphorus31/p31ca).
 * Presentational: caller supplies `spoons` + `setSpoons`.
 */

import type { CSSProperties } from 'react';

export interface SpoonDialProps {
  spoons: number;
  setSpoons: (n: number) => void;
  mode?: 'button' | 'pips' | 'icon' | 'compact';
  fullscreen?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function SpoonDial({ spoons, setSpoons, mode = 'button', fullscreen = true, className = '', style }: SpoonDialProps) {
  const cycleSpoons = () => setSpoons((spoons + 1) % 6);
  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen().catch(() => {});
  };

  if (mode === 'compact') {
    return (
      <button
        onClick={cycleSpoons}
        aria-label={`Spoon level ${spoons} of 5`}
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border border-white/10 bg-white/5 text-white/80 hover:border-[var(--p31-accent)] transition-all ${className}`}
        style={style}
      >
        <span className="w-2 h-2 rounded-full" style={{ background: spoons <= 1 ? 'var(--p31-accent-red)' : 'var(--p31-accent)' }} />
        <span className="text-xs font-mono font-bold tabular-nums">{spoons}</span>
      </button>
    );
  }

  if (mode === 'icon') {
    return (
      <div className={`flex items-center gap-1 ${className}`} style={style}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => setSpoons(n)}
            aria-label={`Set spoons to ${n}`}
            className="p-0 border-0 bg-transparent cursor-pointer transition-all"
            style={{
              opacity: n <= spoons ? 1 : 0.25,
              filter: n <= spoons ? 'drop-shadow(0 0 4px var(--p31-accent))' : 'none',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 200 200" fill="none" style={{ display: 'block' }}>
              <g>
                <ellipse cx="100" cy="145" rx="22" ry="32" fill={n <= spoons ? 'var(--p31-accent-iris, #818CF8)' : 'rgba(255,255,255,0.3)'} />
                <path d="M 100 30 Q 96 80 100 110" stroke={n <= spoons ? 'var(--p31-accent-violet, #A78BFA)' : 'rgba(255,255,255,0.3)'} strokeWidth="5" strokeLinecap="round" fill="none" />
                <path d="M 100 110 Q 100 120 100 145" stroke={n <= spoons ? 'var(--p31-accent-violet, #A78BFA)' : 'rgba(255,255,255,0.3)'} strokeWidth="3" strokeLinecap="round" fill="none" />
                <circle cx="100" cy="30" r="6" fill={n <= spoons ? 'var(--p31-text, #F5F5F7)' : 'rgba(255,255,255,0.3)'} />
              </g>
            </svg>
          </button>
        ))}
      </div>
    );
  }

  if (mode === 'pips') {
    return (
      <div className={`flex items-center gap-1.5 ${className}`} style={style}>
        {/* Crisis toggle */}
        <button
          onClick={() => setSpoons(spoons === 0 ? 3 : 0)}
          className="text-[9px] font-mono tracking-widest px-1.5 py-0.5 rounded transition-colors"
          aria-label="Toggle crisis mode"
          style={{ color: spoons === 0 ? 'var(--p31-accent-red)' : 'var(--p31-text-tertiary)' }}
        >
          {spoons === 0 ? '!' : spoons}
        </button>
        {/* Pip dots */}
        {[0, 1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => setSpoons(n)}
            aria-label={`Set spoons to ${n}`}
            className="w-3 h-3 rounded-full transition-all border-0 p-0 cursor-pointer"
            style={{
              background: n <= spoons
                ? spoons <= 1 ? 'rgba(251,113,133,0.9)' : 'var(--p31-accent)'
                : 'rgba(255,255,255,0.18)',
              boxShadow: n <= spoons ? '0 0 6px var(--p31-accent)' : 'none',
            }}
          />
        ))}
      </div>
    );
  }

  // Button mode (default)
  return (
    <div className={`flex items-center gap-4 text-[10px] font-mono-tech ${className}`} style={style}>
      <span className="hidden xl:inline text-mist">β₂ = 1</span>
      <span className="hidden xl:inline text-quantum-cyan">863 Hz</span>
      <span className="hidden xl:inline text-quantum-green">K₄ planar</span>

      <button
        onClick={cycleSpoons}
        aria-label={`Spoon level ${spoons} of 5 — click to change`}
        className={`flex items-center gap-1.5 px-2.5 h-9 rounded-lg border transition-all ${
          spoons === 0 ? 'border-quantum-red/40 text-quantum-red bg-quantum-red/10' : 'border-cloud/20 text-ink hover:border-quantum-cyan/40'
        }`}
      >
        <span aria-hidden="true">{spoons === 0 ? '⚠' : '⚡'}</span>
        <span>{spoons}</span>
        <span className="text-mist">/5</span>
      </button>

      {fullscreen && (
        <button
          onClick={toggleFullscreen}
          aria-label="Toggle fullscreen"
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-cloud/20 text-mist hover:text-ink hover:border-quantum-cyan/40 transition-all"
        >
          <span aria-hidden="true">⛶</span>
        </button>
      )}
    </div>
  );
}

export default SpoonDial;
