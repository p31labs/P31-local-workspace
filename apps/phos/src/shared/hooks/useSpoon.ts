import { useSpoonStore } from '../stores/spoonStore';

export function useSpoon() {
  const spoons = useSpoonStore((state) => state.spoons);
  const setSpoons = useSpoonStore((state) => state.setSpoons);
  return { spoons, setSpoons };
}
