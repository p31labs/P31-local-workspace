export function useGameLoop(callback: (delta: number, elapsed: number) => void, deps: unknown[] = []) {
  useFrame((state, delta) => {
    callback(delta, state.clock.elapsedTime);
  }, deps);
}
