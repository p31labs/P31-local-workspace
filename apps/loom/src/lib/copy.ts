/**
 * The Loom — copy: technical terms and their plain-language equivalents.
 *
 * The Instrument draws readout labels on a 2D canvas and the Jitterbug paints
 * narration on WebGL/DOM, so the presentation-axis "literal labels" toggle
 * (useLiteralLabels) cannot just swap React text. This module is the single
 * mapping: the TECHNICAL string is the key, and `copy()` returns the plain
 * equivalent when literal mode is on, otherwise the term unchanged.
 *
 * The default path (literal === false) is a byte-for-byte pass-through — this
 * is a migration layer, never a rewrite. Unknown terms always pass through.
 */

const PLAIN: Record<string, string> = {
  // Instrument readouts — constellation scale.
  ENTROPY: 'Chaos',
  EDGE: 'Connections',
  WHITE: 'Open space',
  // Instrument readouts — zone scale.
  PRESSURE: 'Attention',
  HAZARD: 'Detached',
  BETAS: 'Gaps',
  TRACES: 'Footprints',
  // Event overlay — writer tags (human vs agent, never color-only).
  human: 'you',
  // Event overlay — empty state.
  'no events yet': 'nothing has happened yet',
  // Jitterbug readout labels.
  PHASE: 'Step',
  VOLUME: 'Size',
  CLOSURE: 'Closed',
  'BETTI β₂': 'Loops',
  SIERPIŃSKI: 'Open shape',
  'β₂ = 0 · always': 'open · always',
  // Jitterbug phase names (from @p31/field jitterbugPhase).
  'vector-equilibrium': 'Open shape',
  icosahedron: 'Round shape',
  octahedron: 'Diamond',
  tetrahedron: 'Pyramid',
  // Jitterbug phase narration — attributions.
  'Vector equilibrium — β₂ = 0': 'Open shape — nothing enclosed',
  'Icosahedron — 30 edges': 'A round shape with 30 edges',
  'Octahedron — 12 edges': 'A shape with 12 edges',
  'Tetrahedron — K₄, β₂ = 1': 'A pyramid — fully enclosed',
  // Jitterbug phase narration — quotes.
  'Sizeless, nuclear, omnidirectionally pulsing.': 'Spreading out evenly in every direction.',
  'The golden ratio enters. The squares split into triangles.': 'The squares turn into triangles.',
  'Six vertices remain. The framework is isostatic — just.': 'Only six points remain. The frame holds steady.',
  'The minimum-limit-case structural system of Universe.': 'The smallest shape that can fully close.',
};

/**
 * Resolve a technical term to its display string. When `literal` is true the
 * plain-language equivalent is returned; otherwise the term passes through
 * unchanged. Unknown terms always pass through.
 */
export function copy(term: string, literal: boolean): string {
  if (!literal) return term;
  return PLAIN[term] ?? term;
}

/**
 * A deterministic, model-free one-sentence summary of a proposal body. No
 * language model and no key-value inspection — the summary is the structure
 * of the body, nothing more.
 */
export function summarizeBody(body: unknown): string {
  if (body !== null && typeof body === 'object' && !Array.isArray(body)) {
    const keys = Object.keys(body as Record<string, unknown>);
    if (keys.length === 0) return 'This change has no detail.';
    const shown = keys.slice(0, 4);
    const rest = keys.length - shown.length;
    const list = shown.join(', ') + (rest > 0 ? `, and ${rest} more` : '');
    return `This changes ${list}.`;
  }
  if (Array.isArray(body)) {
    return `This changes a list of ${body.length} items.`;
  }
  if (body === null || body === undefined) {
    return 'This change has no detail.';
  }
  return `This changes: ${String(body).slice(0, 120)}`;
}
