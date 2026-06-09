/**
 * WCD-08 Phase A: ElementDock — Element palette (presentational shell).
 *
 * Horizontal scrolling row of element buttons. Each button is 48×48 (w-12 h-12).
 * Difficulty badge on the left. Scrollbar hidden on mobile.
 *
 * NOTE: In Phase A, the existing ElementPalette (with drag logic) is passed
 * directly into CockpitLayout's elementDock slot. This component is available
 * for Phase B when the interaction model is revisited.
 */

import { GlassPanel } from './GlassPanel';

interface ElementData {
  symbol: string;
  color: string;
  maxBonds: number;
}

interface ElementDockProps {
  /** Elements available at current difficulty level */
  elements: ElementData[];
  /** Currently selected element symbol, or null */
  selected: string | null;
  /** Callback when an element is tapped */
  onSelect: (symbol: string) => void;
  /** Current difficulty mode */
  difficulty: 'seed' | 'sprout' | 'sapling' | 'posner';
}

const DIFFICULTY_ICONS: Record<string, string> = {
  seed: '🌱',
  sprout: '🌿',
  sapling: '🌳',
  posner: '🦴',
};

export function ElementDock({
  elements,
  selected,
  onSelect,
  difficulty,
}: ElementDockProps) {
  return (
    <GlassPanel className="h-full flex items-center gap-2 px-3 overflow-x-auto scrollbar-none">
      {/* Difficulty indicator */}
      <span
        className="shrink-0 text-sm mr-1 select-none"
        aria-label={`${difficulty} difficulty`}
      >
        {DIFFICULTY_ICONS[difficulty] ?? '🌱'}
      </span>

      {/* Element buttons */}
      {elements.map(el => {
        const isSelected = selected === el.symbol;

        return (
          <button
            key={el.symbol}
            onClick={() => onSelect(el.symbol)}
            className={`
              shrink-0 w-12 h-12 rounded-xl
              flex flex-col items-center justify-center
              font-mono text-base font-bold
              border transition-all duration-150
              active:scale-95
              ${isSelected
                ? 'border-white/20 bg-white/10 shadow-[0_0_12px_rgba(255,255,255,0.06)]'
                : 'border-white/[0.06] bg-white/[0.03] hover:border-white/10'
              }
            `}
            style={{ color: el.color }}
            aria-label={`${el.symbol}, ${el.maxBonds} bonds`}
            aria-pressed={isSelected}
          >
            <span className="leading-none">{el.symbol}</span>
            <span className="text-[9px] font-normal opacity-40 leading-none mt-0.5">
              {el.maxBonds}b
            </span>
          </button>
        );
      })}
    </GlassPanel>
  );
}
