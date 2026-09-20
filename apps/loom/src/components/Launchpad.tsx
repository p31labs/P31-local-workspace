import { Lumi } from './Lumi';

/**
 * The Launchpad — the Loom's front door.
 *
 * One screen, one character, one button, one line of copy. The instrument and
 * its chrome are gated behind this (data-loom-level), so a 7-year-old and a
 * 70-year-old both find the same warm entry point.
 *
 * Two doors:
 *   - `Start` (primary) opens the child's arc.
 *   - `See what you and Lumi made` (quiet, below) opens the companion view —
 *     the elder's window into the same log. It is deliberately secondary:
 *     a link, not a second primary CTA, and 48px tall because an elder
 *     touches it. A returning visitor whose log has an artifact lands on
 *     "This is what you made." A fresh visitor lands on a gentle "go say
 *     hello first."
 */
export function Launchpad({ onStart, onCompanion }: { onStart: () => void; onCompanion: () => void }) {
  return (
    <div className="launchpad">
      <Lumi />
      <h1 className="launchpad-title">Welcome to the Loom</h1>
      <p className="launchpad-copy">You and Lumi are going to build something together.</p>
      <button className="launchpad-start" onClick={onStart} type="button">
        ▶ Start
      </button>
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
    </div>
  );
}