/** Deterministic picks for daily puzzles (not crypto). */

export function utcYmd(): string {
  return new Date().toISOString().slice(0, 10);
}

/** FNV-1a-ish 32-bit → non-negative index in [0, len). */
export function seededIndex(len: number, seed: string): number {
  if (len <= 0) return 0;
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h >>> 0) % len;
}
