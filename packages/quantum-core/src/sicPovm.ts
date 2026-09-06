/**
 * ⚠️ HONEST LABEL
 * This implements a computational model inspired by contested quantum-biology
 * hypotheses. The underlying science (e.g., SIC-POVM as biological measurement)
 * is NOT established physics or accepted medical science. See
 * docs/QF1_CONTESTED_SCIENCE.md for the full position. This code is an
 * architectural metaphor made literal — a sovereign care measurement primitive
 * — not a scientific claim.
 *
 * SIC-POVM d=2 (qubit): fiducial vector + Weyl-Heisenberg orbit.
 * Reference: arXiv:quant-ph/0602171, Wikipedia "SIC-POVM" d=2.
 *
 * A SIC-POVM (Symmetric Informationally Complete Positive Operator-Valued
 * Measure) for d=2 consists of 4 subnormalised rank-1 projectors
 * Π_i = (1/2) |ψ_i⟩⟨ψ_i| such that |⟨ψ_i|ψ_j⟩|² = 1/(d+1) = 1/3 for i ≠ j.
 */

type Vec2 = [number, number];

function isClose(a: number, b: number, eps = 1e-10): boolean {
  return Math.abs(a - b) < eps;
}

export function sicPovmFiducial(): Vec2 {
  return [1 / Math.SQRT2, 1 / Math.SQRT2];
}

function weylHeisenbergOrbit(fid: Vec2): Vec2[] {
  const [a, b] = fid;
  return [
    [a, b],
    [-b, a],
    [-a, -b],
    [b, -a],
  ];
}

export function sicPovmStates(): Vec2[] {
  const fid = sicPovmFiducial();
  return weylHeisenbergOrbit(fid);
}

export function sicPovmProjectors(): [number, Vec2][] {
  return sicPovmStates().map((v) => [0.5, v]);
}

export function sicPovmProbabilities(rho: [number, number, number, number]): number[] {
  const [r00, r01, r10, r11] = rho;
  const states = sicPovmStates();
  const d = 2; // dimension — SIC-POVM projectors are (1/d)|ψ_i⟩⟨ψ_i|
  return states.map(([a, b]) => {
    const expectation = a * (r00 * a + r01 * b) + b * (r10 * a + r11 * b);
    const prob = expectation / d;
    return Math.max(0, Math.min(1, prob));
  });
}

export function sicPovmFidelity(): number {
  const states = sicPovmStates();
  let sum = 0; let count = 0;
  for (let i = 0; i < states.length; i++) {
    for (let j = i + 1; j < states.length; j++) {
      const dot = states[i][0] * states[j][0] + states[i][1] * states[j][1];
      sum += dot * dot;
      count++;
    }
  }
  return count > 0 ? sum / count : 0;
}

export function verifySicPovm(): { valid: boolean; overlap: number; trace: number } {
  const states = sicPovmStates();
  const overlap = sicPovmFidelity();
  const expectedOverlap = 1 / 3;
  const validOverlap = isClose(overlap, expectedOverlap, 1e-10);

  let sumTrace = 0;
  for (const [a, b] of states) {
    sumTrace += a * a + b * b;
  }
  const trace = sumTrace / states.length;
  const validTrace = isClose(trace, 1, 1e-10);

  return { valid: validOverlap && validTrace, overlap, trace };
}
