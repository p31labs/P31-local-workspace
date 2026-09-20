#!/usr/bin/env node
/**
 * @p31/field — adversarial/replay.mjs
 *
 * The falsification harness. It reconstructs the conditions of "The
 * Organizational Physics of Multi-Agent AI" (2026-02): N concurrent agents
 * each completing their local interface, and asks whether the boundaries
 * between them close into a coherent whole.
 *
 * We do NOT call an LLM — the Field's substrate has no model calls, and the
 * counter-evidence's point is topological, not linguistic. The model is the
 * Sierpiński composition: every agent locally completes its cell (β₂ = 1 in
 * the cell), and we measure whether the GLOBAL structure encloses (β₂ = 1
 * overall). The answer is known to be "no" — that is the finding the paper
 * reported as "incompatible interfaces at every boundary."
 *
 * The harness exists so that the answer is MEASURED, not asserted. A future
 * Field topology that composes local rigidity into global enclosure would
 * flip this harness's output, and the harness must be able to report that
 * too.
 */

import { sierpinskiGasket, enclosureGap } from '../../src/sierpinski.ts';

/**
 * Simulate `agents` concurrent locally-complete cells composed as a
 * Sierpiński gasket of `levels` depth. The gasket's edges ARE the interfaces
 * between cells; coherence is whether the whole encloses (β₂ = 1).
 */
export function simulateStigmergicSwarm(agents, levels) {
  const g = sierpinskiGasket(levels);
  const gap = enclosureGap(levels);
  // The gasket models `agents` many cells; the recursion level stands in for
  // agent count (3^level cells). Report the boundary surface: every edge is
  // an interface between two locally-complete regions.
  return {
    agents,
    recursionLevels: levels,
    localComplete: gap.localBeta2 === 1,
    globalEnclosed: gap.globalBeta2 === 1,
    boundariesChecked: g.edges,
    boundariesCoherent: g.edges, // every edge connects; none of them CLOSE a volume
  };
}
