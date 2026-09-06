// Trustless oracle: spoon delta is reported by the RENDERER
// (data-spoons pre/post), NOT fabricated by the worker. This is what
// makes the Creation Quote non-gameable — the agent cannot assert
// its own value.
export function measureSpoonDelta(pre: number, post: number): number {
  return Math.max(0, post - pre);
}
