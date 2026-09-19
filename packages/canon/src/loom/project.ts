/**
 * @p31/canon — loom/project.ts
 *
 * THE paradigm function. `replay()` folds the warp into canonical state.
 * `project()` folds the warp AND the weft through a viewer.
 *
 *   project(warp, weft, viewer, { warpSeq, weftAt? }) → Projection
 *
 * It answers: given the artifact log up to `warpSeq`, and the read log up to
 * `weftAt` (default: the weft head), what does `viewer` see? It returns the
 * canonical warp state plus the viewer's reads — mode, pins, scrub — filtered
 * by the warp seq each read was emitted against.
 *
 * Pure. No model call, no I/O, no mutation. If a model ever enters this path,
 * the determinism contract dies; a model-assisted view is a third-order
 * projection built ON TOP of this, never inside it.
 */
import { replay, type LoomEvent, type LoomState, type SavedRead } from './events.ts';
import type { WeftEvent, WeftMode } from './weft.ts';

export interface Projection {
  viewer: string;
  warpSeq: number;
  warp: LoomState;
  /** The viewer's current mode (last view.mode at or before the horizon). */
  mode: WeftMode | null;
  /** Nodes currently pinned by this viewer. */
  pins: string[];
  /** The viewer's last scrub target, or null. */
  scrub: number | null;
  /** Reads emitted against a warpSeq <= warpSeq. */
  reads: WeftEvent[];
  /** Named reads this viewer has saved into the warp. */
  saves: SavedRead[];
}

export interface ProjectAt {
  warpSeq: number;
  /** The weft horizon. Defaults to the weft head (all reads up to now). */
  weftAt?: number;
}

export function project(
  warp: readonly LoomEvent[],
  weft: readonly WeftEvent[],
  viewer: string,
  at: ProjectAt,
): Projection {
  const warpState = replay(warp, at.warpSeq);

  // A read is this viewer's, and it was emitted while reading the artifact at
  // a warpSeq no later than the horizon. The stamp is what makes the read
  // replayable against the artifact at that point.
  const weftHorizon = at.weftAt ?? Number.POSITIVE_INFINITY;
  const reads = weft.filter(
    (e) =>
      (e.humanId ?? 'unknown') === viewer &&
      e.seq <= weftHorizon &&
      e.warpSeq <= at.warpSeq,
  );

  let mode: WeftMode | null = null;
  const pins = new Set<string>();
  let scrub: number | null = null;
  for (const e of reads) {
    if (e.kind === 'view.mode') mode = e.mode;
    else if (e.kind === 'view.pin') {
      if (e.pinned) pins.add(e.node);
      else pins.delete(e.node);
    } else if (e.kind === 'view.scrub') scrub = e.at;
  }

  const saves = warpState.saves.filter((s) => s.viewer === viewer);

  return { viewer, warpSeq: at.warpSeq, warp: warpState, mode, pins: [...pins].sort(), scrub, reads, saves };
}
