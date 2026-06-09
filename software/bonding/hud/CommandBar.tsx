/**
 * WCD-08 Phase A: CommandBar — Bottom command bar.
 * 
 * Left:   Ping reaction buttons (💚🤔😂🔺)
 * Center: Stability gauge (thin progress bar + percentage)
 * Right:  Difficulty selector (seed/sprout/sapling)
 * 
 * Sonnet: Wire callbacks from gameStore.
 * onPing → fires eventBus.emit(PING_SENT, ...)
 * onDifficultyChange → fires eventBus.emit(DIFFICULTY_CHANGED, ...)
 */

import { GlassPanel } from './GlassPanel';

const REACTIONS = ['💚', '🤔', '😂', '🔺'] as const;
type Reaction = typeof REACTIONS[number];

interface CommandBarProps {
  /** Current molecule stability percentage (0-100) */
  stability: number;
  /** Fire a ping reaction */
  onPing: (reaction: Reaction) => void;
  /** Current difficulty mode */
  difficulty: 'seed' | 'sprout' | 'sapling' | 'posner';
  /** Change difficulty */
  onDifficultyChange: (d: 'seed' | 'sprout' | 'sapling') => void;
  /** Can the player send pings right now? (false if no multiplayer room) */
  canPing: boolean;
}

function stabilityColor(pct: number): string {
  if (pct === 100) return '#00FF88';   // phosphor green — complete
  if (pct > 60)   return '#FFD700';    // amber — progressing
  return '#EF4444';                     // red — unstable
}

export function CommandBar({
  stability,
  onPing,
  difficulty,
  onDifficultyChange,
  canPing,
}: CommandBarProps) {
  return (
    <GlassPanel className="h-full flex items-center justify-between px-3 gap-2">

      {/* ─── Left: Ping reactions ─── */}
      <div className="flex gap-1.5 shrink-0">
        {REACTIONS.map(r => (
          <button
            key={r}
            onClick={() => onPing(r)}
            disabled={!canPing}
            className="w-10 h-10 rounded-xl
                       bg-white/[0.04] border border-white/[0.06]
                       flex items-center justify-center text-lg
                       hover:bg-white/[0.08] active:scale-90
                       disabled:opacity-25 disabled:cursor-not-allowed
                       transition-all duration-100"
            aria-label={`Send ${r} reaction`}
          >
            {r}
          </button>
        ))}
      </div>

      {/* ─── Center: Stability gauge ─── */}
      <div className="flex-1 max-w-[180px] flex flex-col items-center gap-1 mx-2">
        <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${Math.min(100, Math.max(0, stability))}%`,
              backgroundColor: stabilityColor(stability),
            }}
          />
        </div>
        <span className="font-mono text-[10px] text-white/25 tracking-wider select-none">
          {Math.round(stability)}% STABLE
        </span>
      </div>

      {/* ─── Right: Difficulty selector ─── */}
      <div className="flex gap-1 shrink-0">
        {(['seed', 'sprout', 'sapling'] as const).map(d => {
          const isActive = difficulty === d;
          return (
            <button
              key={d}
              onClick={() => onDifficultyChange(d)}
              className={`
                w-9 h-9 rounded-lg flex items-center justify-center text-sm
                border transition-all duration-150 active:scale-90
                ${isActive
                  ? 'border-[#FFD700]/30 bg-[#FFD700]/[0.12]'
                  : 'border-white/[0.06] bg-transparent hover:border-white/10'
                }
              `}
              aria-label={`${d} difficulty`}
              aria-pressed={isActive}
            >
              {d === 'seed' ? '🌱' : d === 'sprout' ? '🌿' : '🌳'}
            </button>
          );
        })}
      </div>
    </GlassPanel>
  );
}
