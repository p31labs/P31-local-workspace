/**
 * @p31/field — the Field.
 *
 * A stigmergic trace ecology over the canon graph. The executable runtime for
 * the structural-informational layer of the P31 research papers; the
 * physical-biological layer (Posner molecules, Larmor coherence, quantum
 * biology) is cited in prose and never computed in code.
 *
 * The boundary is the one the papers themselves draw — Tetrahedron Protocol
 * (10.5281/zenodo.19004485) frames the molecular/cognitive parallel as "a
 * metaphorical extension, not a physics claim"; this module honors that by
 * computing only what is computable and naming only what it can verify.
 *
 * The unit of the Field is the Zone: a K₄ subgraph over the four registry
 * kinds {component, class, token, theme} in one component's neighborhood.
 * Four vertices, six edges, one enclosed interior (β₂ = 1). This is the
 * *corrected* claim from Universal Bridge (Paper IV) — the enclosure is
 * simplicial volumetric (β₂), not graph-theoretic non-planarity (K₄ is
 * planar; K₅ is the smallest non-planar complete graph).
 *
 * Every claim a function makes names the paper section it discharges.
 */

/** The cognitive K₄ — the measurement frame (SIC-POVM-style four lenses),
 *  matching the four effects already implemented in
 *  software/k4-personal/src/soulsafe-tetra.js. */
export type Frame = 'structure' | 'connection' | 'rhythm' | 'creation';

/** Red Board operator states (SOULSAFE, Paper XIX §3.2). Humans only. */
export type RedBoard = 'coherent' | 'burnout' | 'hypomania' | 'rsd';

/** Competence boundary (SOULSAFE Triad, Paper XIX §3.1; manifest.yaml). */
export type Coherence = 'in-lane' | 'out-of-lane';

export type Outcome = 'success' | 'failure';

/**
 * A trace — one act of work or attention, deposited at a zone, from a frame.
 * Pre-image/post-image is Proof-of-Territory (SIFTA): an actor cannot file a
 * trace without committing what it read and what it wants.
 */
export interface Trace {
  actor: string;
  zone: string;
  frame: Frame;
  kind: string;
  payload: unknown;
  preImage: string;
  postImage: string;
  coherence: Coherence;
  redBoard?: RedBoard;
  outcome?: Outcome;
  /** Epoch milliseconds at deposit. */
  ts: number;
}

/**
 * A Zone — a K₄ subgraph over the four artifact kinds. β numbers are computed
 * from the 1-skeleton: β₀ connected components, β₁ cycle rank (open loops),
 * β₂ enclosed interior (1 iff the zone is a complete K₄).
 */
export interface Zone {
  id: string;
  vertices: [string, string, string, string];
  edges: [string, string][];
  beta: [number, number, number];
  /** Maxwell isostatic rigidity: |E| = 3|V| − 6 with 4 vertices = K₄. */
  rigid: boolean;
}

/** K₄ is the minimum isostatically rigid structure in 3D:
 *  |E| = 3|V| − 6 → 6 = 3(4) − 6 (Tetrahedron Protocol §1.3; Paper IV §3.2). */
export function makeZone(
  id: string,
  vertices: [string, string, string, string],
  edges: [string, string][],
): Zone {
  const vset = new Set(vertices);
  const seen = new Set<string>();
  const uniqueEdges: [string, string][] = [];
  for (const [a, b] of edges) {
    if (!vset.has(a) || !vset.has(b)) continue; // drop edges to absent vertices
    const key = a < b ? `${a}|${b}` : `${b}|${a}`;
    if (seen.has(key)) continue;
    seen.add(key);
    uniqueEdges.push([a, b]);
  }

  const beta0 = connectedComponents(vertices, uniqueEdges);
  const beta1 = uniqueEdges.length - vertices.length + beta0; // cycle rank of the 1-skeleton
  const complete = vertices.length === 4 && uniqueEdges.length === 6;
  const beta2 = complete ? 1 : 0;
  const rigid = complete;

  return { id, vertices, edges: uniqueEdges, beta: [beta0, beta1, beta2], rigid };
}

function connectedComponents(vertices: readonly string[], edges: [string, string][]): number {
  const parent = new Map<string, string>();
  for (const v of vertices) parent.set(v, v);
  const find = (x: string): string => {
    let r = x;
    while (parent.get(r) !== r) r = parent.get(r)!;
    // path halving (no reassignment of the parameter)
    let c = x;
    while (parent.get(c) !== r) {
      const n = parent.get(c)!;
      parent.set(c, r);
      c = n;
    }
    return r;
  };
  for (const [a, b] of edges) {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(ra, rb);
  }
  return new Set(vertices.map(find)).size;
}

/**
 * Pure exponential decay. value = 0.5^(Δt / halfLife). At one half-life the
 * weight halves. SIFTA uses a 24h half-life; a design system wants longer.
 * (Tetrahedron Protocol — "living waves"; Colony Kernel — pheromone decay.)
 */
export function decay(trace: Trace, atMs: number, halfLife: number): number {
  const dt = atMs - trace.ts;
  if (dt <= 0) return 1;
  return Math.pow(0.5, dt / halfLife);
}

/** Red Board → coherence factor (Paper XIX §3.2). Agents (no redBoard) = 1. */
export function redBoardFactor(rb: RedBoard | undefined): number {
  switch (rb) {
    case 'coherent':
      return 1;
    case 'hypomania':
      return 0.5;
    case 'rsd':
      return 0.5;
    case 'burnout':
      return 0.3;
    default:
      return 1;
  }
}

// Behavioral trust — coherence × outcome × volatility × confidence — lives
// in trust.ts, along with the competence and Red Board model inputs. Re-export
// so the package surface stays one import.
export {
  trust,
  volatility,
  confidence,
  type CompetenceModel,
  type RedBoardModel,
} from './trust.ts';

/** An out-of-lane trace is rejected, not weighted (SOULSAFE Triad lockout,
 *  Paper XIX §3.1). Returns 0 for out-of-lane; otherwise the decayed weight. */
export function traceWeight(trace: Trace, atMs: number, halfLife: number): number {
  if (trace.coherence === 'out-of-lane') return 0;
  return decay(trace, atMs, halfLife);
}

/** Signal pressure at a zone: the sum of decayed, coherence-gated weights.
 *  Pressure is a continuous field, not a vote count. Takes anything with an
 *  id — a full Zone, or a lightweight Rankable from loop.ts. */
export function pressure(zone: { id: string }, traces: readonly Trace[], atMs: number, halfLife: number): number {
  let total = 0;
  for (const t of traces) {
    if (t.zone !== zone.id) continue;
    total += traceWeight(t, atMs, halfLife);
  }
  return total;
}

/**
 * Hazard — floating-neutral detection (Tetrahedron Protocol §4; Paper XII).
 * A zone's reference trace is its "neutral". If it is severed (no recent
 * reference), the zone floats and hazard spikes — structural disconnection,
 * not failure. Returns 0 (fresh) … 1 (severed).
 */
export function hazard(
  zone: { id: string },
  traces: readonly Trace[],
  atMs: number,
  halfLife: number,
  referenceKind = 'reference',
): number {
  const refs = traces.filter((t) => t.zone === zone.id && t.kind === referenceKind);
  if (refs.length === 0) return 1;
  const latest = refs.reduce((a, b) => (a.ts >= b.ts ? a : b));
  return 1 - decay(latest, atMs, halfLife);
}

/**
 * Zero-work detection (Paper XIX §5). A trace with no payload and no territory
 * change carries no actionable information. The label is zero-*utility*, not
 * zero-entropy: even "everything is okay" carries some Shannon entropy; it
 * carries no actionable information given the task.
 */
export function zeroUtility(trace: Trace): boolean {
  if (trace.preImage === trace.postImage) return true;
  const p = trace.payload;
  if (p === null || p === undefined) return true;
  if (typeof p === 'string') return p.trim().length === 0;
  if (Array.isArray(p)) return p.length === 0;
  if (typeof p === 'object') return Object.keys(p as Record<string, unknown>).length === 0;
  return false;
}

/**
 * The 1/3 diagnostic (Tetrahedron Protocol §2.2). Reports the minimum share
 * of the top-three actors' decayed weight at a zone — the value that would be
 * ~1/3 in a balanced steady state. This is REPORTED, never asserted: 1/3 is a
 * diagnostic, not a target, and enforcement would be policy, not structure.
 * Returns null when fewer than three distinct actors have touched the zone.
 */
export function oneThirdDiagnostic(
  zone: Zone,
  traces: readonly Trace[],
  atMs: number,
  halfLife: number,
): number | null {
  const byActor = new Map<string, number>();
  for (const t of traces) {
    if (t.zone !== zone.id) continue;
    byActor.set(t.actor, (byActor.get(t.actor) ?? 0) + traceWeight(t, atMs, halfLife));
  }
  const top = [...byActor.values()].sort((a, b) => b - a).slice(0, 3);
  if (top.length < 3) return null;
  const total = top.reduce((a, b) => a + b, 0);
  if (total === 0) return null;
  return Math.min(...top) / total;
}

// The Sierpiński gasket — local completeness without global enclosure. The
// Field's failure mode, named. Re-exported so the package surface stays one
// import; it is also the falsification lane's first concrete target.
export {
  sierpinskiGasket,
  enclosureGap,
  SIERPINSKI_DIMENSION,
  type SierpinskiLevel,
} from './sierpinski.ts';
