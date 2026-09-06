import { useSpoon } from '../../shared/hooks/useSpoon';
import { cn } from '../../shared/lib/cn';

export function SpoonSlider() {
  const { spoons, setSpoons } = useSpoon();

  const labels = ['Crisis', 'Low', 'Recovery', 'Steady', 'Good', 'Full'];
  const colors = ['text-red-400', 'text-orange-400', 'text-yellow-400', 'text-quantum-gold', 'text-quantum-green', 'text-quantum-cyan'];

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex gap-1" role="radiogroup" aria-label="Spoon level">
        {[0, 1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            role="radio"
            aria-checked={spoons === n}
            aria-label={`${labels[n]}: ${n} spoons`}
            onClick={() => setSpoons(n as 0 | 1 | 2 | 3 | 4 | 5)}
            className={cn(
              'w-8 h-8 rounded-lg border text-xs font-mono-tech transition-all',
              spoons === n
                ? 'border-quantum-cyan bg-quantum-cyan/20 text-quantum-cyan scale-110'
                : 'border-white/10 text-mist hover:border-white/20',
            )}
          >
            {n}
          </button>
        ))}
      </div>
      <p className={cn('text-xs font-mono-tech', colors[spoons])}>{labels[spoons]}</p>
    </div>
  );
}
