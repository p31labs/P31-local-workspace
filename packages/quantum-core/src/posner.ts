/**
 * ⚠️ HONEST LABEL
 * This implements a computational model inspired by contested quantum-biology
 * hypotheses. The underlying science (e.g., Posner-molecule entanglement as a
 * biological quantum memory) is NOT established physics or accepted medical
 * science. See docs/QF1_CONTESTED_SCIENCE.md for the full position. This code
 * is an architectural metaphor made literal — a sovereign care measurement
 * primitive — not a scientific claim.
 *
 * Posner molecule (Ca₉(PO₄)₆) crystallographic coordinates + state model.
 * References: Fisher (2015) "Are we quantum computers…" Proc R Soc A;
 * Fisher & Whaley (2024) arXiv:2409.17423; refutation by Salari et al.
 *
 * Published crystal structure: triclinic P1, a≈15.2Å, b≈15.2Å, c≈15.2Å.
 * 9 Ca²⁺ ions arranged in a near-octahedral cage, 6 PO₄³⁻ tetrahedra.
 * The coordinates here are a simplified structural model for visualization
 * and state tracking — not a full DFT energy calculation.
 */

export interface PosnerAtom {
  element: 'Ca' | 'P' | 'O';
  position: [number, number, number];
  radius: number;
  color: number;
}

export interface PosnerState {
  coherence: number;
  entanglementPairs: Array<[number, number]>;
  lastUpdate: number;
}

const CA_RADIUS = 1.0;
const P_RADIUS = 0.82;
const O_RADIUS = 0.6;

const CA_COLOR = 0x00f0ff;
const P_COLOR = 0xfbbf24;
const O_COLOR = 0xef4444;

export const CA_POSITIONS: [number, number, number][] = [
  [0, 0, 0],
  [0.7, 0.4, 0.5],
  [-0.7, -0.4, -0.5],
  [0.5, -0.6, 0.4],
  [-0.5, 0.6, -0.4],
  [-0.4, 0.5, 0.6],
  [0.4, -0.5, -0.6],
  [0.6, 0.6, -0.5],
  [-0.6, -0.6, 0.5],
];

export const P_POSITIONS: [number, number, number][] = [
  [1.28, 0, 0],
  [-1.28, 0, 0],
  [0, 1.28, 0],
  [0, -1.28, 0],
  [0, 0, 1.28],
  [0, 0, -1.28],
];

export const O_POSITIONS: [number, number, number][] = [
  ...P_POSITIONS.map(([x, y, z]) => [x + 0.5, y, z] as [number, number, number]),
  ...P_POSITIONS.map(([x, y, z]) => [x - 0.5, y, z] as [number, number, number]),
  ...P_POSITIONS.map(([x, y, z]) => [x, y + 0.5, z] as [number, number, number]),
  ...P_POSITIONS.map(([x, y, z]) => [x, y - 0.5, z] as [number, number, number]),
];

export function posnerAtoms(): PosnerAtom[] {
  const atoms: PosnerAtom[] = [];
  for (const p of CA_POSITIONS) {
    atoms.push({ element: 'Ca', position: p, radius: CA_RADIUS, color: CA_COLOR });
  }
  for (const p of P_POSITIONS) {
    atoms.push({ element: 'P', position: p, radius: P_RADIUS, color: P_COLOR });
  }
  for (const p of O_POSITIONS) {
    atoms.push({ element: 'O', position: p, radius: O_RADIUS, color: O_COLOR });
  }
  return atoms;
}

export function bondThreshold(): number {
  return 1.9;
}

export function createPosnerState(): PosnerState {
  const pairs: Array<[number, number]> = [];
  for (let i = 0; i < 9; i++) {
    for (let j = i + 1; j < 9; j++) {
      const dx = CA_POSITIONS[i][0] - CA_POSITIONS[j][0];
      const dy = CA_POSITIONS[i][1] - CA_POSITIONS[j][1];
      const dz = CA_POSITIONS[i][2] - CA_POSITIONS[j][2];
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < bondThreshold()) {
        pairs.push([i, j]);
      }
    }
  }
  return { coherence: 0.5, entanglementPairs: pairs, lastUpdate: Date.now() };
}

export function updatePosnerCoherence(state: PosnerState, delta: number): PosnerState {
  return {
    ...state,
    coherence: Math.max(0, Math.min(1, state.coherence + delta)),
    lastUpdate: Date.now(),
  };
}

export function posnerBondLengths(): number[] {
  const lengths: number[] = [];
  for (let i = 0; i < CA_POSITIONS.length; i++) {
    for (let j = i + 1; j < CA_POSITIONS.length; j++) {
      const dx = CA_POSITIONS[i][0] - CA_POSITIONS[j][0];
      const dy = CA_POSITIONS[i][1] - CA_POSITIONS[j][1];
      const dz = CA_POSITIONS[i][2] - CA_POSITIONS[j][2];
      lengths.push(Math.sqrt(dx * dx + dy * dy + dz * dz));
    }
  }
  return lengths;
}

export const TOTAL_ATOMS = CA_POSITIONS.length + P_POSITIONS.length + O_POSITIONS.length;
