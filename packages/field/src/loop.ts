/**
 * @p31/field — loop.ts
 *
 * The Field's loop: pure functions that turn a trace ecology into action.
 * These are the "does the field drive decisions?" functions. They compute;
 * they do not write — the caller (the coverage agent, the convergence
 * script) owns the weft I/O. Keeping the field pure is what lets the loop
 * be falsified: the same inputs, the same ranking, every time.
 */
import type { Trace } from './index.ts';
import { pressure, hazard, traceWeight } from './index.ts';

/** A rankable — any artifact with an id and a pre-field static signal. */
export interface Rankable {
  id: string;
  /** The pre-field static signal (modifiers × tokens × files, etc.). */
  signal: number;
  [k: string]: unknown;
}

/** A zone with its field score attached. */
export interface Ranked {
  id: string;
  signal: number;
  /** attention = pressure + hazard − failureHistory. Both pressure (interest)
   *  and hazard (structural disconnection) mean "look here"; failure history
   *  means "we tried and it failed." */
  fieldScore: number;
  pressure: number;
  hazard: number;
  failureHistory: number;
}

const HALF_LIFE_MS = 7 * 24 * 3600 * 1000; // 7 days

/** Decay-weighted count of failures at a zone. */
export function failureHistory(
  zoneId: string,
  traces: readonly Trace[],
  atMs: number,
  halfLife: number = HALF_LIFE_MS,
): number {
  let acc = 0;
  for (const t of traces) {
    if (t.zone !== zoneId || t.outcome !== 'failure') continue;
    acc += traceWeight(t, atMs, halfLife);
  }
  return acc;
}

/**
 * Rank zones by field attention. The static signal is the PRIOR — inherent
 * importance (modifiers × tokens × files). The field is EVIDENCE — pressure
 * (activity), hazard (structural risk), failure history (repeated failure).
 *
 *   fieldScore = signal + (pressure + hazard − failureHistory)
 *
 * An untouched zone keeps its signal unchanged; a touched zone is adjusted
 * by what actually happened. Both pressure and hazard are attention-seeking
 * (a hot zone and a floating-neutral zone both need the agent's eyes);
 * failure history is attention-suppressing.
 */
export function rankByField(
  zones: readonly Rankable[],
  traces: readonly Trace[],
  atMs: number,
  halfLife: number = HALF_LIFE_MS,
): Ranked[] {
  const ranked: Ranked[] = zones.map((z) => {
    const zoneTraces = traces.filter((t) => t.zone === z.id);
    const touched = zoneTraces.length > 0;
    const p = touched ? pressure(z, traces, atMs, halfLife) : 0;
    const h = touched ? hazard(z, traces, atMs, halfLife) : 0;
    const fh = touched ? failureHistory(z.id, traces, atMs, halfLife) : 0;
    const fieldScore = z.signal + (touched ? p + h - fh : 0);
    return { id: z.id, signal: z.signal, fieldScore, pressure: p, hazard: h, failureHistory: fh };
  });
  ranked.sort((a, b) => b.fieldScore - a.fieldScore);
  return ranked;
}

/** A decision payload — what the field would tell a proposer about a zone. */
export interface Decision {
  zone: string;
  pressure: number;
  hazard: number;
  trust: number;
}

/**
 * Decide which zones to act on. The top zone by field attention, returned
 * with its pressure/hazard so the caller can stamp a field.decision event.
 * trust is per-actor; the caller supplies the acting agent's trust score.
 */
export function decide(
  ranked: readonly Ranked[],
  actorTrust: number,
): Decision | null {
  if (ranked.length === 0) return null;
  const top = ranked[0];
  return { zone: top.id, pressure: top.pressure, hazard: top.hazard, trust: actorTrust };
}

/** A past decision, for outcome correlation. */
export interface DecisionRecord {
  zone: string;
  pressure: number;
  ts: number;
}

/**
 * Does pressure-at-decision predict approval outcome? For each decision, find
 * the next outcome trace at that zone after the decision time; pair
 * (pressure, outcome) and compute the Pearson correlation. Returns null when
 * fewer than three pairs exist — a reported number, never a threshold.
 */
export function outcomeCorrelation(
  decisions: readonly DecisionRecord[],
  traces: readonly Trace[],
): number | null {
  const pairs: Array<[number, number]> = [];
  for (const d of decisions) {
    let next: Trace | null = null;
    for (const t of traces) {
      if (t.zone !== d.zone || t.outcome === undefined || t.ts <= d.ts) continue;
      if (next === null || t.ts < next.ts) next = t;
    }
    if (next) pairs.push([d.pressure, next.outcome === 'success' ? 1 : 0]);
  }
  if (pairs.length < 3) return null;

  const n = pairs.length;
  const mx = pairs.reduce((a, [x]) => a + x, 0) / n;
  const my = pairs.reduce((a, [, y]) => a + y, 0) / n;
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (const [x, y] of pairs) {
    num += (x - mx) * (y - my);
    dx += (x - mx) ** 2;
    dy += (y - my) ** 2;
  }
  if (dx === 0 || dy === 0) return null;
  return num / Math.sqrt(dx * dy);
}
