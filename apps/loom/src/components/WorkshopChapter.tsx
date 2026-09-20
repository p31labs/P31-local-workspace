import { useCallback } from 'react';
import { Lumi } from './Lumi';
import { MadeArtifact } from './MadeArtifact';
import { SharedChip } from './SharedChip';
import { SoundToggle } from './SoundToggle';
import { useLoomSound } from '../lib/useLoomSound';
import { useLoomProjection } from '../lib/useLoomProjection';
import type { LoomEvent } from '@p31/canon/loom/events';
import type { LoomEventInput } from '@p31/canon/loom/gate';

interface Props {
  events: LoomEvent[];
  /** Fired when the child leaves the chapter arc and enters the Workshop
   *  proper (mode === 'instrument' in the shell). */
  onProgress: () => void;
  /** The parent wires this to postEvent. */
  commit: (event: LoomEventInput) => void;
}

/**
 * Chapter 5 — "The Workshop." The arc closes: the child sees what the loop
 * produced, taps it to prove it works, and the door to the full instrument
 * opens.
 *
 * The artifact is *derived from the log*, not carried in component state.
 * That is the whole point of the append-only log: the last agent `propose`
 * with a `body.color` IS the artifact. If the child navigates back to
 * Chapter 4 and picks a different color, Chapter 5 automatically shows the
 * new one — no prop drilling, no sync bug waiting to happen.
 *
 * No timer, no auto-advance. The "See the workshop" hand-off appears as soon
 * as the artifact does, but nothing moves without the child's tap.
 */
export function WorkshopChapter({ events, onProgress, commit }: Props) {
  const sound = useLoomSound();

  const { humanCount, colorInfo } = useLoomProjection(events);

  const handleArtifactTap = useCallback(() => {
    sound.play('celebrate');
    commit({ writer: 'human', kind: 'focus', node: 'artifact' });
  }, [commit, sound]);

  const handleSeeWorkshop = useCallback(() => {
    commit({ writer: 'human', kind: 'focus', node: 'workshop-open' });
    onProgress();
  }, [commit, onProgress]);

  // If Chapter 4 was never completed (the child navigated in by URL, or the
  // log was cleared), there is no artifact to show. Do not fake one. Point
  // them back rather than onward.
  if (!colorInfo) {
    return (
      <div className="chapter chapter--workshop">
        <div className="chapter-topbar">
          <SharedChip count={humanCount} />
        </div>
        <div className="chapter-lumi chapter-lumi--small">
          <Lumi />
        </div>
        <h1 className="chapter-title">Nothing here yet.</h1>
        <p className="chapter-subtitle">
          Pick a color with Lumi first, then come back.
        </p>
      </div>
    );
  }

  return (
    <div className="chapter chapter--workshop">
      <div className="chapter-topbar">
        <SoundToggle enabled={sound.enabled} onToggle={sound.toggle} />
        <SharedChip count={humanCount} />
      </div>

      <div className="chapter-lumi chapter-lumi--small">
        <Lumi greeting />
      </div>

      <h1 className="chapter-title" aria-live="polite">
        Look what we made.
      </h1>

      <MadeArtifact
        colorName={colorInfo.name}
        colorToken={colorInfo.token}
        onTap={handleArtifactTap}
      />

      <p className="chapter-subtitle">
        You picked {colorInfo.name}. Lumi had an idea. You said yes.
      </p>

      <button
        className="chapter-next"
        onClick={handleSeeWorkshop}
        type="button"
        data-agent-kind="action"
        data-agent-action="chapter.workshop.open"
        data-agent-target="workshop"
        data-agent-danger="none"
        data-agent-confirm="never"
      >
        See the workshop &rarr;
      </button>
    </div>
  );
}