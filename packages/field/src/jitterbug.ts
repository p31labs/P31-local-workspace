/**
 * @p31/field — jitterbug.ts
 *
 * The Jitterbug — the Field's closure, named. The topological twin of
 * sierpinski.ts.
 *
 * Buckminster Fuller's "jitterbug" (Synergetics §460–461, proposed 1948) is
 * the contraction of the cuboctahedron (vector equilibrium) through the
 * icosahedron and octahedron to the tetrahedron. The vector equilibrium is
 * the open state — "constructed with circumferential vectors only," its
 * square faces are unstable and it encloses no protected interior. The
 * tetrahedron is the closed state — "the minimum-limit-case structural
 * system of Universe" (§402), four vertices, six edges, one enclosed volume.
 *
 * Where the Sierpiński gasket shows a field can be locally complete (β₂ = 1
 * per zone) yet globally open (β₂ = 0), the Jitterbug is the operation that
 * closes it: the contraction that collapses many open cells into one
 * enclosed K₄. The gasket stays β₂ = 0 at every level; the jitterbug ends
 * at β₂ = 1. That is the duality.
 *
 * The phases are Fuller's "click-stops" (Synergetics 2, Fig. 1033.43), with
 * his exact volumes in unit-tetrahedron accounting (tetrahedron = 1):
 *
 *   vector equilibrium   V=12  E=24  volume 20          β₂ = 0  (open)
 *   icosahedron          V=12  E=30  volume 18.512…     β₂ = 0  (golden ratio
 *                                                               enters; the
 *                                                               square faces
 *                                                               split into
 *                                                               triangles)
 *   octahedron           V=6   E=12  volume 4           β₂ = 0
 *   tetrahedron          V=4   E=6   volume 1           β₂ = 1  (closed)
 *
 * The β₂/rigid convention is the Field's own, from makeZone: β₂ = 1 and
 * rigid = true iff the 1-skeleton is a complete K₄ (4 vertices, 6 edges) —
 * the tetrahedron. Only the terminal phase satisfies it. (The icosahedron and
 * octahedron also pass Maxwell's isostatic count |E| = 3|V| − 6; the Field
 * does not call them "rigid" because it reserves the word for the K₄, and
 * this module honors that.)
 *
 * The geometry is real physics, not metaphor: a DNA-origami jitterbug was
 * published in Nature Communications (Seo et al., June 2026), reconfiguring
 * on chemical and optical signals with a Poisson's ratio of −1.
 */
import type { Zone } from './index.ts';

export type JitterbugPhaseName =
  | 'vector-equilibrium'
  | 'icosahedron'
  | 'octahedron'
  | 'tetrahedron';

export interface JitterbugPhase {
  name: JitterbugPhaseName;
  /** Parameter position on [0,1]. */
  t: number;
  vertices: number;
  edges: number;
  /** Fuller's unit-tetrahedron volume (tetrahedron = 1). */
  volume: number;
  /** Field β₂ — 1 iff the 1-skeleton is a complete K₄ (the tetrahedron). */
  beta2: 0 | 1;
  rigid: boolean;
}

/** Fuller's volumes, computed from the edge-1 polyhedra relative to the unit
 *  tetrahedron (√2/12). Exact: 20, 5(3+√5)/√2, 4, 1. */
const UNIT_TETRAHEDRON = Math.SQRT2 / 12;
const VE_VOLUME = (5 * Math.SQRT2) / 3 / UNIT_TETRAHEDRON;                 // 20
const ICOSA_VOLUME = ((5 / 12) * (3 + Math.sqrt(5))) / UNIT_TETRAHEDRON;   // 18.512…
const OCTA_VOLUME = Math.SQRT2 / 3 / UNIT_TETRAHEDRON;                     // 4
const TETRA_VOLUME = 1;

/** The four click-stops, open → closed. */
export const JITTERBUG_PHASES: readonly JitterbugPhase[] = [
  { name: 'vector-equilibrium', t: 0, vertices: 12, edges: 24, volume: VE_VOLUME, beta2: 0, rigid: false },
  { name: 'icosahedron', t: 1 / 3, vertices: 12, edges: 30, volume: ICOSA_VOLUME, beta2: 0, rigid: false },
  { name: 'octahedron', t: 2 / 3, vertices: 6, edges: 12, volume: OCTA_VOLUME, beta2: 0, rigid: false },
  { name: 'tetrahedron', t: 1, vertices: 4, edges: 6, volume: TETRA_VOLUME, beta2: 1, rigid: true },
];

/** The phase at parameter t ∈ [0,1]. t=0 is the open vector equilibrium;
 *  t=1 is the closed tetrahedron. */
export function jitterbugPhase(t: number): JitterbugPhase {
  const c = Math.max(0, Math.min(1, t));
  for (let i = JITTERBUG_PHASES.length - 1; i >= 0; i--) {
    if (c >= JITTERBUG_PHASES[i].t) return JITTERBUG_PHASES[i];
  }
  return JITTERBUG_PHASES[0];
}

/** The jitterbug's volume as a continuous function of t — piecewise linear
 *  through Fuller's click-stop volumes. This is the measured fingerprint of
 *  the contraction: monotone decreasing 20 → 18.512… → 4 → 1. */
export function jitterbugVolume(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  for (let i = 0; i < JITTERBUG_PHASES.length - 1; i++) {
    const a = JITTERBUG_PHASES[i];
    const b = JITTERBUG_PHASES[i + 1];
    if (c <= b.t) {
      const f = (c - a.t) / (b.t - a.t);
      return a.volume + (b.volume - a.volume) * f;
    }
  }
  return TETRA_VOLUME;
}

/**
 * The Jitterbug closure of a field: how many local K₄ zones must merge for
 * the field to reach global enclosure (a single K₄, β₂ = 1).
 *
 * A field of N zones is N disconnected K₄s — locally complete, globally open
 * (the Sierpiński gap). The jitterbug contracts them pairwise until one
 * enclosing tetrahedron remains. A single zone is already closed (0);
 * N zones need N − 1 contractions.
 */
export function jitterbugClose(zones: readonly Zone[]): number {
  return Math.max(0, zones.length - 1);
}

/** True iff the field is already globally closed: at most one K₄ zone. */
export function jitterbugClosed(zones: readonly Zone[]): boolean {
  return zones.length <= 1;
}
