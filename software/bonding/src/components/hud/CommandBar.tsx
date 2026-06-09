/**
 * WCD-08 → WCD-29: CommandBar — Transparent bottom command bar.
 *
 * Left:   Ping reaction buttons (💚🤔😂🔺)
 * Center: Stability gauge (thin progress bar + percentage)
 * Right:  Difficulty selector (seed/sprout/sapling) + Code viewer toggle
 *
 * WCD-29: Glassmorphism removed. Icons + text float with text-shadow.
 */

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
  /** WCD-26: Toggle telemetry viewer */
  onToggleTelemetry?: () => void;
}

function stabilityColor(pct: number): string {
  if (pct === 100) return '#00FF88';  // phosphor green — complete
  if (pct > 60)   return '#FFD700';   // amber — progressing
  return '#EF4444';                    // red — unstable
}

export function CommandBar({
  stability,
  onPing,
  difficulty,
  onDifficultyChange,
  canPing,
  onToggleTelemetry,
}: CommandBarProps) {
  return (
    <div className="h-full flex items-center justify-between px-3 gap-2 hud-text pointer-events-auto">

      {/* ─── Left: Ping reactions (WCD-31: hidden in solo play) ─── */}
      {canPing && (
        <div className="flex gap-1.5 shrink-0">
          {REACTIONS.map(r => (
            <button
              key={r}
              onClick={() => onPing(r)}
              className="w-10 h-10 rounded-xl
                         bg-white/[0.04] border border-white/[0.06]
                         flex items-center justify-center text-lg
                         hover:bg-white/[0.08] active:scale-90
                         transition-all duration-100"
              aria-label={`Send ${r} reaction`}
            >
              {r}
            </button>
          ))}
        </div>
      )}

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
        <span className="font-mono text-[10px] text-white/40 tracking-wider select-none">
          {Math.round(stability)}% STABLE
        </span>
      </div>

      {/* ─── Right: Difficulty selector + Code viewer ─── */}
      <div className="flex gap-1 shrink-0">
        {(['seed', 'sprout', 'sapling'] as const).map(d => {
          const isActive = difficulty === d;
          return (
            <button
              key={d}
              onClick={() => onDifficultyChange(d)}
              className={`
                w-9 h-9 rounded-xl backdrop-blur-md flex items-center justify-center text-sm
                border transition-all duration-200 active:scale-90 touch-expand
                ${isActive
                  ? 'border-[#FFD700]/30'
                  : 'border-white/[0.12] hover:border-white/[0.25] hover:shadow-[0_0_12px_rgba(78,205,196,0.15)]'
                }
              `}
              style={{
                background: isActive ? 'rgba(255,215,0,0.12)' : 'rgba(6,10,16,0.5)',
                boxShadow: isActive
                  ? '0 0 12px rgba(255,215,0,0.15), inset 0 1px 0 rgba(255,255,255,0.05)'
                  : '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
              }}
              aria-label={`${d} difficulty`}
              aria-pressed={isActive}
            >
              {d === 'seed' ? '🌱' : d === 'sprout' ? '🌿' : '🌳'}
            </button>
          );
        })}

        {/* WCD-26: Telemetry viewer toggle */}
        {onToggleTelemetry && (
          <button
            onClick={onToggleTelemetry}
            className="w-9 h-9 rounded-lg flex items-center justify-center
                       border border-white/[0.06] bg-transparent touch-expand
                       hover:border-white/10 transition-all duration-150 active:scale-90
                       font-mono text-[11px] text-white/25 hover:text-white/50"
            aria-label="View telemetry log"
          >
            &lt;/&gt;
          </button>
        )}
      </div>
    </div>
  );
}
