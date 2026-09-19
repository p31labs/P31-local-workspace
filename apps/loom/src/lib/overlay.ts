/**
 * The Loom — overlay derivation.
 *
 * Pure: folds `LoomState` into render instructions, resolving the log's bare
 * node names against the graph's namespaced ids via a reverse index. The log
 * records intent ("focused --p31-accent"); the canvas decides how that renders.
 * No React, no DOM — unit-testable in isolation.
 */
import type { LoomState, Proposal } from '@p31/canon/loom/events';

export interface GhostProposal {
  id: string;
  /** Namespaced graph id the proposal targets, or null if unresolved. */
  nodeId: string | null;
  status: Proposal['status'];
  /** Mean body survival across revisions, 1.0 = untouched. */
  overallSurvival: number;
}

export interface Overlay {
  focusedId: string | null;
  cursorId: string | null;
  attention: number;
  pathIds: string[];
  ghosts: GhostProposal[];
}

export function deriveOverlay(state: LoomState, idIndex: Map<string, string>): Overlay {
  const resolve = (bare: string | null): string | null =>
    bare === null ? null : (idIndex.get(bare) ?? null);

  return {
    focusedId: resolve(state.focused),
    cursorId: resolve(state.agentCursor),
    attention: state.agentAttention,
    pathIds: state.agentPath
      .map((p) => idIndex.get(p))
      .filter((x): x is string => x !== undefined),
    ghosts: [...state.proposals.values()].map((p) => ({
      id: p.id,
      nodeId: idIndex.get(p.node) ?? null,
      status: p.status,
      overallSurvival: p.overallSurvival,
    })),
  };
}
