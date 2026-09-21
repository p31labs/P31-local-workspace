import { Lumi } from './Lumi';

/**
 * The Launchpad — the Loom's front door.
 *
 * One screen, one character, one button, one line of copy. The instrument and
 * its chrome are gated behind this (data-loom-level), so a 7-year-old and a
 * 70-year-old both find the same warm entry point.
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
}: {
  onStart: () => void;
  onCompanion: () => void;
  onFamily: () => void;
}) {
  return (
    <div className="launchpad">
      <Lumi />
      <h1 className="launchpad-title">Welcome to the Loom</h1>
      <p className="launchpad-copy">You and Lumi are going to build something together.</p>
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