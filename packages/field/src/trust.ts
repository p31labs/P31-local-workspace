/**
 * @p31/field — trust.ts
 *
 * Behavioral trust, extracted from index.ts and upgraded. The naive
 * trust() was coherence × outcome. This adds two things the research
 * requires:
 *
 *   - volatility   (ClankerScore, 2026-01): penalise behavioural
 *                   inconsistency, not just failure rates.
 *   - confidence   (PDR in Production, 2026-04): a burst of 30 traces in
 *                   one hour is not 30 hours of evidence; the confidence
 *                   curve penalises narrow observation windows.
 *
 * Both are decay-weighted — the same exponential as the rest of the Field,
 * so "reliable last year, erratic last week" scores as erratic, not steady.
 *
 * Competence (in-lane/out-of-lane) and Red Board state are inputs, never
 * hardcoded paths: the caller supplies them from manifest.yaml and the
 * weft respectively. The trust math is pure and knows nothing about where
 * those live.
 */
import type { Trace, Coherence, RedBoard, Outcome } from './index.ts';

/** A competence map: actor id → { lane: set of zones or patterns }.
 *  Callers derive it from manifest.yaml; trust.ts consumes the SHAPE only. */
export interface CompetenceModel {
  /** Is this actor in-lane for this zone? */
  inLane(actor: string, zone: string): boolean;
}

/** A Red Board model: actor id → operator state. Callers derive it from
 *  the weft; trust.ts consumes the SHAPE only. */
export interface RedBoardModel {
  state(actor: string): RedBoard | undefined;
}

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

function outcomeFactor(o: Outcome | undefined): number {
  switch (o) {
    case 'success':
      return 1;
    case 'failure':
      return 0.7;
    default:
      return 0.85;
  }
}

/**
 * Volatility — the decay-weighted variance of outcomes. High variance means
 * the actor is inconsistent (ClankerScore's "penalises behavioural
 * inconsistency, not just failure rates"). Returns a factor in (0,1]; a
 * perfectly steady actor is 1, an oscillating one approaches 0.
 */
export function volatility(
  actor: string,
  traces: readonly Trace[],
  atMs: number,
  halfLife: number,
): number {
  const own = traces.filter((t) => t.actor === actor && t.outcome !== undefined);
  if (own.length < 2) return 1; // no variance with one observation

  let mean = 0;
  let den = 0;
  for (const t of own) {
    const w = Math.pow(0.5, Math.max(0, atMs - t.ts) / halfLife);
    mean += (t.outcome === 'success' ? 1 : 0) * w;
    den += w;
  }
  if (den === 0) return 1;
  mean /= den;

  let varAcc = 0;
  for (const t of own) {
    const w = Math.pow(0.5, Math.max(0, atMs - t.ts) / halfLife);
    const v = (t.outcome === 'success' ? 1 : 0) - mean;
    varAcc += v * v * w;
  }
  const variance = varAcc / den; // in [0, 0.25]
  // variance 0 → factor 1; variance 0.25 (max oscillation) → factor 0.
  return 1 - variance / 0.25;
}

/**
 * Confidence — multiplicity of distinct zones × temporal spread (PDR's
 * confidence curve). 30 same-zone traces in one hour are one data point,
 * not thirty. Returns a factor in (0,1].
 */
export function confidence(
  actor: string,
  traces: readonly Trace[],
  atMs: number,
  halfLife: number,
): number {
  const own = traces.filter((t) => t.actor === actor);
  if (own.length === 0) return 0;

  const zones = new Set(own.map((t) => t.zone)).size;
  const ts = own.map((t) => t.ts);
  const span = Math.max(...ts) - Math.min(...ts); // ms
  const spanHalfLives = span / halfLife;

  // Diversity: distinct zones, capped contribution at, say, 10 zones.
  const diversity = Math.min(1, zones / 10);
  // Spread: temporal span in half-lives, capped at 1. One half-life of
  // spread is full temporal confidence.
  const spread = Math.min(1, spanHalfLives);
  // Count: volume, capped at 30 (beyond that, diminishing returns).
  const volume = Math.min(1, own.length / 30);

  // Geometric-ish blend, weighted toward spread — the PDR finding is that
  // temporal narrowness is the primary game vector.
  return 0.5 * spread + 0.3 * diversity + 0.2 * volume;
}

/**
 * Behavioral trust — coherence × outcome × volatility × confidence.
 * Out-of-lane traces are rejected, not weighted (SOULSAFE Triad lockout).
 * The competence model and Red Board model are inputs; when absent, an
 * actor is assumed in-lane and coherent.
 */
export function trust(
  actor: string,
  traces: readonly Trace[],
  atMs: number,
  halfLife: number,
  competence?: CompetenceModel,
  redBoard?: RedBoardModel,
): number {
  const own = traces.filter((t) => t.actor === actor);
  if (own.length === 0) return 0.5; // unknown, neutral

  let num = 0;
  let den = 0;
  for (const t of own) {
    if (t.coherence === 'out-of-lane') continue; // the trace's own flag: rejected
    const lane = competence ? competence.inLane(actor, t.zone) : true;
    if (!lane) continue; // the live model: rejected, not weighted
    const w = Math.pow(0.5, Math.max(0, atMs - t.ts) / halfLife);
    const rb = redBoard ? redBoard.state(actor) : t.redBoard;
    num += redBoardFactor(rb) * outcomeFactor(t.outcome) * w;
    den += w;
  }
  if (den === 0) return 0.5;

  // The signal — coherence × outcome × volatility — is what the actor's
  // behaviour says. Confidence is how much evidence backs it. Low evidence
  // shrinks the score toward the neutral prior (0.5), not toward zero: one
  // observation should barely move trust, not swing it to an extreme.
  const base = num / den;
  const vol = volatility(actor, traces, atMs, halfLife);
  const conf = confidence(actor, traces, atMs, halfLife);
  const signal = base * vol;
  const t = 0.5 + conf * (signal - 0.5);
  return t < 0 ? 0 : t > 1 ? 1 : t;
}

// Re-export the types the caller needs to build models, so the imports stay
// honest about where each symbol lives.
export type { Trace, Coherence, RedBoard, Outcome };
