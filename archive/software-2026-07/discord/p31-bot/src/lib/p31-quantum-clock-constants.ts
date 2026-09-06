/**
 * Mirrors `p31ca/src/lib/dome/p31-dome-constants.ts` + grandfather phase math
 * from `p31ca/src/lib/quantum-clock/index.ts`. Keep in sync with hub/dome.
 * P31_LARMOR_HZ must match root `p31-constants.json` → physics.larmorHz.
 */
export const P31_LARMOR_HZ = 863;
export const TRIM_HZ_MIN = 0.86;

const TAU = Math.PI * 2;

export function trimHzFromKnob(t: number): number {
  const x = Math.max(0, Math.min(1, t));
  return TRIM_HZ_MIN * Math.pow(P31_LARMOR_HZ / TRIM_HZ_MIN, x);
}

/** Grandfather phase 0–1 from wall clock (server: use Date.now()). */
export function getGrandfatherPhase01(tMs: number, fHz: number): { phase01: number; angleRad: number } {
  const tSec = tMs / 1000;
  const angleRad = (tSec * fHz * TAU) % TAU;
  const phase01 = (angleRad / TAU) % 1;
  return { phase01, angleRad };
}
