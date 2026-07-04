/**
 * Operator-locked Larmor and derived cockpit frequencies.
 * P31_LARMOR_HZ must match repo root p31-constants.json → physics.larmorHz.
 */
export const P31_LARMOR_HZ = 863;
export const TRIM_HZ_MIN = 0.86;

/** Knob t ∈ [0,1]: TRIM_HZ_MIN → P31_LARMOR_HZ (log sweep; t=1 is canonical Larmor). */
export function trimHzFromKnob(t: number): number {
  const x = Math.max(0, Math.min(1, t));
  return TRIM_HZ_MIN * Math.pow(P31_LARMOR_HZ / TRIM_HZ_MIN, x);
}

export function breathInhaleHz(): number {
  return P31_LARMOR_HZ / 5;
}

export function breathExhaleHz(): number {
  return P31_LARMOR_HZ / 10;
}
