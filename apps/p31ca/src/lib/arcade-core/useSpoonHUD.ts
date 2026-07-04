import { useEffect, useId } from 'react';
import { useSpoonStore, getSpoonStore } from './spoonStore.ts';
import { emit } from './eventBus.ts';
import { SPOON_LEVEL_COLORS, COLORS } from './theme.ts';

export function useSpoonPHOSSync() {
  const setLevel = useSpoonStore(s => s.setLevel);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      if (cancelled) return;
      try {
        const res = await fetch('/api/phos/cognitive-state', { signal: AbortSignal.timeout(4000) });
        if (!res.ok) return;
        const data = await res.json();
        const spoonLevel = Number.parseInt(String(data.spoonLevel ?? data.spoons ?? data.level ?? 4), 10);
        if (Number.isFinite(spoonLevel)) {
          setLevel(Math.max(0, Math.min(12, spoonLevel)), 'phos');
          emit('p31:spoon:changed', { level: spoonLevel, source: 'phos' });
        }
      } catch { /* offline / no phos endpoint — silent */ }
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => { cancelled = true; clearInterval(id); };
  }, [setLevel]);
}

export function useSpoonHUD() {
  const { state } = useSpoonStore();
  const color = SPOON_LEVEL_COLORS[Math.max(0, Math.min(12, state.level))] ?? COLORS.teal;
  const pct = Math.round((state.level / state.maxLevel) * 100);

  return {
    level: state.level,
    maxLevel: state.maxLevel,
    jitter: state.jitterFactor,
    color,
    pct,
    label: state.level <= 1 ? 'REST' : state.level <= 2 ? 'LOW' : state.level <= 4 ? 'MED' : state.level <= 8 ? 'HIGH' : 'FULL',
    source: state.source,
  };
}
