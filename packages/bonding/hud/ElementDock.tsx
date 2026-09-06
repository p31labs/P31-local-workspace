/**
 * WCD-08 Phase A: ElementDock — Element palette.
 * 
 * Horizontal scrolling row of element buttons.
 * - Default: 48×48 (w-12 h-12)
 * - Kid Mode (ageGroup === 'child'): 64×64 for easier tapping
 * - Senior Mode (ageGroup === 'senior'): 56×56
 * 
 * Sonnet: Wire `elements` from the existing palette data filtered by difficulty.
 * Wire `selected` and `onSelect` from gameStore.
 */

import { GlassPanel } from './GlassPanel';
import { useGameStore } from '../src/store/gameStore';

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
  const { ageGroup, simpleMode } = useGameStore();
  
  // Determine button size based on age group
  const getButtonSize = () => {
    if (ageGroup === 'child' || simpleMode) return 'w-16 h-16 text-lg';
    if (ageGroup === 'senior') return 'w-14 h-14 text-base';
    return 'w-12 h-12 text-base';
  };
  
  // Bounce animation for kids
  const getAnimationClass = () => {
    if (ageGroup === 'child' || simpleMode) return 'active:scale-90 animate-bounce-kid';
    return 'active:scale-95';
  };
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
              shrink-0 ${getButtonSize()} rounded-xl
              flex flex-col items-center justify-center
              font-mono font-bold
              border transition-all duration-150
              ${getAnimationClass()}
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
            <span className={`${ageGroup === 'child' || simpleMode ? 'text-[10px]' : 'text-[9px]'} font-normal opacity-40 leading-none mt-0.5`}>
              {el.maxBonds}b
            </span>
          </button>
        );
      })}
    </GlassPanel>
  );
}
