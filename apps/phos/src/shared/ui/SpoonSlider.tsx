import { useSpoonStore, type Spoons } from '../stores/spoonStore';

export function SpoonSlider() {
  const spoons = useSpoonStore((s) => s.spoons);
  const setSpoons = useSpoonStore((s) => s.setSpoons);

  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2, 3, 4, 5].map((level) => (
        <button
          key={level}
          onClick={() => setSpoons(level as Spoons)}
          className={`text-xs px-2 py-1 rounded-full border transition-colors font-mono cursor-pointer ${
            spoons === level
              ? 'border-quantum-cyan bg-quantum-cyan text-void font-bold'
              : 'border-cloud/20 text-cloud/60 hover:border-quantum-cyan/50'
          }`}
          aria-label={`Set spoons to ${level}`}
        >
          {level}
        </button>
      ))}
    </div>
  );
}
