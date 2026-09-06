// ═══════════════════════════════════════════════════════
// BONDING — P31 Labs
// StabilityMeter: formula display + stability progress bar
//
// HSL interpolation for smoother color transitions.
// Glow edge + shimmer at 80%+. Enhanced formula glow.
// ═══════════════════════════════════════════════════════

import { useGameStore } from '../store/gameStore';
import { calculateStability, generateFormula, displayFormula, MOLECULE_NAMES } from '../engine/chemistry';
import { FormulaDisplay } from './FormulaDisplay';

export function StabilityMeter() {
  const atoms = useGameStore((s) => s.atoms);
  const gamePhase = useGameStore((s) => s.gamePhase);
  const knownFormulaMatch = useGameStore((s) => s.knownFormulaMatch);

  if (atoms.length === 0) return null;

  const stability = calculateStability(atoms);
  const formula = generateFormula(atoms);
  const percent = Math.round(stability * 100);

  // HSL interpolation: red (0°) → yellow (60°) → green (120°)
  const hue = Math.round(percent * 1.2); // 0→120
  const saturation = 80 + (percent < 50 ? 0 : (percent - 50) * 0.4); // 80→100
  const barColor = `hsl(${hue}, ${saturation}%, 50%)`;

  const isHigh = percent >= 80;
  const isComplete = gamePhase === 'complete';

  // Formula glow intensifies with stability
  const formulaGlow = percent > 30
    ? `0 0 ${4 + percent * 0.1}px hsla(${hue}, 80%, 60%, ${0.2 + percent * 0.003})`
    : 'none';

  return (
    <div className="absolute right-6 flex items-center gap-3 p-3 px-5 max-w-[calc(100vw-5rem)] hud-text" style={{ minWidth: 0, top: 'calc(4rem + env(safe-area-inset-top, 0px))' }}>
      <span
        className={`text-lg font-bold font-mono truncate ${knownFormulaMatch ? 'formula-checkpoint text-white' : 'text-white/80'}`}
        style={{ minWidth: 0, direction: 'ltr', textShadow: formulaGlow }}
      >
        <FormulaDisplay formula={displayFormula(formula)} />
        {knownFormulaMatch && (
          <span className="text-xs text-emerald-400 ml-2 font-semibold">
            = {MOLECULE_NAMES[knownFormulaMatch] ?? knownFormulaMatch}!
          </span>
        )}
      </span>
      <div className="w-28 shrink-0 h-[3px] bg-white/10 rounded-full overflow-hidden relative">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isComplete ? 'stability-pulse stability-glow' : ''
          } ${isHigh ? 'stability-shimmer' : ''}`}
          style={{
            width: `${percent}%`,
            backgroundColor: barColor,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ['--bar-color' as any]: barColor,
            boxShadow: isHigh ? `0 0 ${4 + (percent - 80) * 0.5}px ${barColor}` : 'none',
          }}
        />
      </div>
      <span
        className="text-xs font-mono shrink-0 transition-colors duration-300"
        style={{ color: isHigh ? barColor : 'rgba(255,255,255,0.4)' }}
      >
        {percent}%
      </span>
    </div>
  );
}
