import { useMemo } from 'react';
import { useSpoonStore } from '../stores/spoonStore';

export function useSpoon() {
  const spoons = useSpoonStore((s) => s.spoons);
  const setSpoons = useSpoonStore((s) => s.setSpoons);
  const isCrisis = spoons === 0;
  const isLow = spoons <= 1;
  const duration = spoons <= 1 ? 0 : spoons === 2 ? 800 : spoons === 3 ? 400 : spoons === 4 ? 600 : 200;
  return useMemo(() => ({ spoons, setSpoons, isCrisis, isLow, duration }), [spoons]);
}
