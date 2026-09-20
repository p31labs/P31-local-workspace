import { Lumi } from './Lumi';

/**
 * The Launchpad — the Loom's front door.
 *
 * One screen, one character, one button, one line of copy. The instrument and
 * its chrome are gated behind this (data-loom-level), so a 7-year-old and a
 * 70-year-old both find the same warm entry point.
 */
export function Launchpad({ onStart }: { onStart: () => void }) {
  return (
    <div className="launchpad">
      <Lumi />
      <h1 className="launchpad-title">Welcome to the Loom</h1>
      <p className="launchpad-copy">You and Lumi are going to build something together.</p>
      <button className="launchpad-start" onClick={onStart} type="button">
        ▶ Start
      </button>
    </div>
  );
}
