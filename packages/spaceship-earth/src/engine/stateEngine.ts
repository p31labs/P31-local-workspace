/**
 * @file stateEngine.ts — Phase 1 SIC-POVM ship state engine.
 *
 * Contested-science metaphor made literal (see @p31/quantum-core/sicPovm).
 * The engine maps the passport observables (spoons → energy, careScore →
 * well-being, engagement → connection) onto a qubit density matrix and
 * measures it against the canonical SIC-POVM frame.
 *
 * HONEST ENGINE PROPERTY (verified by tests): a pure-diagonal rho (zero
 * connection signal) measures uniformly (0.25 each) regardless of spoons —
 * energy only shapes the distribution once a connection signal (the
 * off-diagonal term) is present. No physical or medical claim is made.
 */

export interface UserState {
  spoons: number;
  careScore?: number;
  engagement?: number;
}

export const SHIP_MODES = ['explore', 'create', 'connect', 'reflect'] as const;
export type ShipMode = (typeof SHIP_MODES)[number];

export interface ShipMeasurement {
  probabilities: Record<ShipMode, number>;
  dominant: ShipMode;
  entropy: number;
}

const clamp01 = (v: number): number =>
  Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0;

/**
 * Map passport observables onto a qubit density matrix.
 * Returns [r00, re, re, r11] — energy, connection (off-diagonal), well-being.
 */
export function passportToDensityMatrix(user: UserState): [number, number, number, number] {
  const r00 = clamp01((user.spoons ?? 0) / 5);
  const r11 = clamp01((user.careScore ?? 0) / 100);
  const re = clamp01((user.engagement ?? 0) / 10);
  return [r00, re, re, r11];
}

/**
 * Shannon entropy over the four outcome probabilities, base 4 (uniform ⇒ 1,
 * single focused mode ⇒ 0). Used as the coherence proxy.
 */
export function vonNeumannEntropy(probs: number[]): number {
  const log4 = Math.log(4);
  let h = 0;
  for (const p of probs) {
    if (!Number.isFinite(p) || p <= 0) continue;
    h -= p * (Math.log(p) / log4);
  }
  return h;
}

const SQRT2 = Math.sqrt(2);

/** SIC-POVM measurement of the ship density matrix. */
export function measureShipState(user: UserState): ShipMeasurement {
  const [r00, re, , r11] = passportToDensityMatrix(user);

  // Honest engine property: with no connection signal the measurement carries
  // no structure — uniform dispersion regardless of energy.
  if (re === 0) {
    const probabilities: Record<ShipMode, number> = {
      explore: 0.25,
      create: 0.25,
      connect: 0.25,
      reflect: 0.25,
    };
    return { probabilities, dominant: 'explore', entropy: 1 };
  }

  // SIC-POVM outcome weights: p(explore) on the |0> axis, the remaining three
  // modes on the tetrahedral frame (includes the off-diagonal connection term).
  const p0 = r00 / 2;
  const pOther = (r00 + 2 * r11) / 6 + (SQRT2 / 3) * re;
  const sum = p0 + 3 * pOther;
  const p0n = sum > 0 ? p0 / sum : 0.25;
  const pOn = sum > 0 ? pOther / sum : 0.25;

  const probabilities: Record<ShipMode, number> = {
    explore: p0n,
    create: pOn,
    connect: pOn,
    reflect: pOn,
  };
  const ordered = SHIP_MODES.map((m) => probabilities[m]);
  const max = Math.max(...ordered);
  const dominant = SHIP_MODES[ordered.indexOf(max)];
  return { probabilities, dominant, entropy: vonNeumannEntropy(ordered) };
}

/** Canonical qubit SIC-POVM invariant: pairwise overlap of frame states = 1/3. */
export function verifyStateEngine(): { valid: boolean; overlap: number } {
  const omegaRe = -0.5;
  const omegaIm = Math.sqrt(3) / 2;
  const states: [number, number, number][] = [
    [1, 0, 0],
    [1 / Math.sqrt(3), Math.sqrt(2) / Math.sqrt(3), 0],
    [1 / Math.sqrt(3), (Math.sqrt(2) / Math.sqrt(3)) * omegaRe, (Math.sqrt(2) / Math.sqrt(3)) * omegaIm],
    [1 / Math.sqrt(3), (Math.sqrt(2) / Math.sqrt(3)) * omegaRe, -(Math.sqrt(2) / Math.sqrt(3)) * omegaIm],
  ];

  const dot = (
    a: [number, number, number],
    b: [number, number, number],
  ): { re: number; im: number } => ({
    re: a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
    im: a[1] * -b[2] + a[2] * b[1],
  });

  let total = 0;
  let pairs = 0;
  for (let i = 0; i < states.length; i++) {
    for (let j = i + 1; j < states.length; j++) {
      const d = dot(states[i], states[j]);
      total += d.re * d.re + d.im * d.im;
      pairs++;
    }
  }
  const overlap = total / pairs;
  return { valid: Math.abs(overlap - 1 / 3) < 1e-9, overlap };
}
