/**
 * WILLOW LOVE economy bridge.
 * The existing LoveCounter owns the canonical balance in localStorage and
 * exposes `window.__willowLove`. New features award through this helper so
 * they integrate with the same achievement + persistence pipeline.
 */
export function awardLove(amount: number = 1): void {
  const fn = (window as unknown as { __willowLove?: (n: number) => void }).__willowLove;
  if (typeof fn === 'function') fn(amount);
}
