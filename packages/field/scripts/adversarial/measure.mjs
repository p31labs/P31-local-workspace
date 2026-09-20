#!/usr/bin/env node
/**
 * @p31/field — adversarial/measure.mjs
 *
 * The paper's own metric: interface compatibility at the boundary. A
 * compatibility count, not a percentage — "N of M boundaries held." This is
 * the honest reading of "9/28" in the Organizational Physics paper: a count
 * of boundaries, not a normalized score that hides the denominator.
 */

import { simulateStigmergicSwarm } from './replay.mjs';

/** Measure interface compatibility of a simulated swarm. */
export function measure(sim) {
  const held = sim.boundariesCoherent;
  const total = sim.boundariesChecked;
  return {
    held,
    total,
    enclosed: sim.globalEnclosed,
    ratio: total > 0 ? held / total : 0,
  };
}

// CLI: print the measurement for a default swarm (8 agents, depth 4).
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop() ?? '')) {
  const sim = simulateStigmergicSwarm(8, 4);
  const m = measure(sim);
  console.log(`boundaries held: ${m.held}/${m.total} (${m.ratio.toFixed(2)})`);
  console.log(`global enclosure: ${m.enclosed ? 'yes (β₂ = 1)' : 'no (β₂ = 0)'}`);
  console.log('note: boundaries "hold" locally, but the whole never encloses — the Sierpiński gap.');
}
