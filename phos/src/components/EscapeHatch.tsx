import React from 'react';
import { ShieldAlert } from 'lucide-react';

interface EscapeHatchProps {
  theme: Record<string, string>;
  hudOpen: boolean;
  currentSurface: string;
  spoons: number;
  surfaceNames: Record<string, string>;
  onToggleHud: () => void;
  onSetSpoons: (s: number) => void;
  onSetSurface: (s: string) => void;
}

export function EscapeHatch({
  theme, hudOpen, currentSurface, spoons, surfaceNames,
  onToggleHud, onSetSpoons, onSetSurface,
}: EscapeHatchProps) {
  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center">
      <button
        onClick={onToggleHud}
        className={`px-5 py-2.5 flex items-center gap-3 font-mono text-xs tracking-wider border transition-all duration-500 group ${theme.button}`}
        aria-label="Toggle HUD (press H)"
        aria-expanded={hudOpen}
        aria-controls="hud-panel"
      >
        <span>PHOS_CORE // {theme.name}</span>
      </button>
      <div
        id="hud-panel"
        role="region"
        aria-label="Navigation HUD"
        className={`mt-3 overflow-hidden transition-all duration-500 ease-in-out ${hudOpen ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className={`p-5 w-80 flex flex-col gap-5 border border-white/5 shadow-2xl backdrop-blur-2xl ${theme.hud}`}>
          <div className="text-center border-b border-white/10 pb-3">
            <p className="text-[10px] font-mono tracking-widest opacity-50 mb-3 uppercase">Spoon Configuration</p>
            <div className="flex justify-between gap-1" role="radiogroup" aria-label="Spoon level">
              {[0, 1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => { onSetSpoons(s); }}
                  className={`w-9 h-9 flex items-center justify-center font-mono text-xs border rounded transition-all duration-300 ${theme.button} ${spoons === s ? 'scale-110 font-bold opacity-100 bg-white/5 ring-1 ring-emerald-500/40' : 'opacity-40 hover:opacity-70'}`}
                  role="radio"
                  aria-checked={spoons === s}
                  aria-label={`${s} spoons${s === 0 ? ' (crisis mode)' : ''}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2" role="tablist" aria-label="Surfaces">
            {['GREETING', 'GRID', 'VAULT', 'ARCADE', 'HEARTH', 'THE_BUFFER', 'NODE_ZERO', 'ARCHIVE'].map((surf) => (
              <button
                key={surf}
                onClick={() => onSetSurface(surf)}
                className={`py-2 text-[10px] font-mono tracking-wider truncate uppercase ${theme.button} ${currentSurface === surf ? 'opacity-100 bg-white/5 ring-1 ring-emerald-500/40' : 'opacity-60 hover:opacity-80'}`}
                role="tab"
                aria-selected={currentSurface === surf}
                aria-label={surfaceNames[surf] || surf}
              >
                {surf.replace('THE_', '')}
              </button>
            ))}
            <button
              onClick={() => onSetSpoons(0)}
              className="col-span-2 py-2.5 rounded-lg border border-red-900/40 bg-red-950/20 text-red-400 font-mono text-[10px] tracking-widest hover:bg-red-900/30 flex items-center justify-center gap-2 transition-all duration-300"
              aria-label="Emergency crisis mode (press Escape to exit)"
            >
              <ShieldAlert size={12} /> CRISIS_MODE
            </button>
          </div>
          <div className="text-[9px] font-mono opacity-30 text-center pt-1 border-t border-white/5">
            H: toggle HUD · 0: crisis · Esc: reset
          </div>
        </div>
      </div>
    </div>
  );
}
