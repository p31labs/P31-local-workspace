import { Lumi } from './Lumi';

/**
 * The Launchpad — the Loom's front door.
 *
 * One screen, one character, one button, one line of copy. The instrument and
 * its chrome are gated behind this (data-loom-level), so a 7-year-old and a
 * 70-year-old both find the same warm entry point.
 *
 * `memory` is Lumi's derived memory (folded from the log). When there is prior
 * work, the launchpad shows a gentle "Lumi remembers" line — derived, never
 * auto-advancing; the child still taps Start. The memory is a fold, not a
 * store: same log, same sentence, every time.
 *
 * Three doors:
 *   - `Start` (primary) opens the child's arc.
 *   - `See what you and Lumi made` (quiet) opens the companion view — the
 *     elder's window into the same log.
 *   - `See what the family made` (quiet) opens the family view — one short
 *     page the whole household (and their agents) reads together: the shared
 *     artifact, the care circle, the last shared moments, with provenance one
 *     tap away.
 * All doors are 48px tall (the family floor) and never auto-advance.
 */
export function Launchpad({
  onStart,
  onCompanion,
  onFamily,
  memory,
}: {
  onStart: () => void;
  onCompanion: () => void;
  onFamily: () => void;
  memory?: { narrative: string; colors: string[]; sharedHumanCount: number } | null;
}) {
  const hasMemory = !!memory && (memory.colors.length > 0 || memory.sharedHumanCount > 0);
  return (
    <div className="launchpad">
      <Lumi />
      <h1 className="launchpad-title">Welcome to the Loom</h1>
      <p className="launchpad-copy">You and Lumi are going to build something together.</p>
      {hasMemory && memory && (
        <p className="launchpad-memory" data-agent-kind="status" data-agent-action="family.memory">
          {memory.narrative}
        </p>
      )}
      <button className="launchpad-start" onClick={onStart} type="button">
        ▶ Start
      </button>
      <div className="launchpad-doors">
        <button
          className="launchpad-companion"
          onClick={onCompanion}
          type="button"
          data-agent-kind="action"
          data-agent-action="companion.open"
          data-agent-danger="none"
          data-agent-confirm="never"
        >
          See what you and Lumi made
        </button>
        <button
          className="launchpad-family"
          onClick={onFamily}
          type="button"
          data-agent-kind="action"
          data-agent-action="family.open"
          data-agent-danger="none"
          data-agent-confirm="never"
        >
          See what the family made
        </button>
      </div>
    </div>
  );
}