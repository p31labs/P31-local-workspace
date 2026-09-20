import { useCallback, useState } from 'react';
import { Lumi } from './Lumi';
import { MadeArtifact } from './MadeArtifact';
import { useLoomProjection } from '../lib/useLoomProjection';
import type { LoomEvent } from '@p31/canon/loom/events';
import type { LoomEventInput } from '@p31/canon/loom/gate';

interface Props {
  events: LoomEvent[];
  /** Wire to setMode('launchpad') (or wherever the elder came from). */
  onExit: () => void;
  /** Wire to postEvent. The companion commits focus events on Back/Next so
   *  the log stays honest about what was viewed, but nothing here changes
   *  the artifact. */
  commit: (event: LoomEventInput) => void;
}

type Screen = 'welcome' | 'artifact';

const SCREENS: readonly Screen[] = ['welcome', 'artifact'];

/**
 * Companion view — the 70-year-old's window into the same log the child
 * filled. Same events, calmer read.
 *
 * Constraints, all from the master prompt:
 *   - <=4 concurrent elements per screen.
 *   - >=16px text (this view uses 22px for the sentence — larger than the
 *     floor, because the sentence is the only thing to read).
 *   - Every screen has a visible Back. Even the first: Back exits.
 *   - No auto-advance. No timers. Nothing moves without a tap.
 *   - No chip, no count, no graph. The artifact is the payoff, and it is
 *     shown, not scored.
 *   - Plain language, one sentence per screen.
 *
 * The artifact is derived from the log — same source as Chapter 5 — so the
 * two views can never disagree about what was made.
 */
export function CompanionView({ events, onExit, commit }: Props) {
  const [screen, setScreen] = useState<Screen>('welcome');

  const { colorInfo } = useLoomProjection(events);

  const idx = SCREENS.indexOf(screen);
  const canGoForward = idx < SCREENS.length - 1;

  const handleBack = useCallback(() => {
    commit({ writer: 'human', kind: 'focus', node: `companion-back-${screen}` });
    if (idx === 0) {
      onExit();
    } else {
      setScreen(SCREENS[idx - 1]);
    }
  }, [screen, idx, onExit, commit]);

  const handleForward = useCallback(() => {
    if (!canGoForward) return;
    commit({ writer: 'human', kind: 'focus', node: `companion-next-${screen}` });
    setScreen(SCREENS[idx + 1]);
  }, [screen, idx, canGoForward, commit]);

  const handleArtifactTap = useCallback(() => {
    commit({ writer: 'human', kind: 'focus', node: 'artifact' });
  }, [commit]);

  return (
    <main
      className="companion"
      data-agent-kind="region"
      data-agent-action="companion.view"
    >
      <div className="companion-row companion-row--top">
        <button
          type="button"
          className="companion-back"
          onClick={handleBack}
          data-agent-kind="action"
          data-agent-action="companion.back"
          data-agent-danger="none"
          data-agent-confirm="never"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path
              d="M15 5l-7 7 7 7"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
          Back
        </button>
      </div>

      <div className="companion-stage">
        <div className="companion-lumi">
          <Lumi calm greeting={screen !== 'welcome'} />
        </div>

        {screen === 'welcome' && (
          <p className="companion-sentence">
            You and Lumi made something together.
          </p>
        )}

        {screen === 'artifact' && colorInfo && (
          <>
            <p className="companion-sentence">This is what you made.</p>
            <MadeArtifact
              colorName={colorInfo.name}
              colorToken={colorInfo.token}
              onTap={handleArtifactTap}
              calm
            />
          </>
        )}

        {screen === 'artifact' && !colorInfo && (
          <p className="companion-sentence">
            Nothing here yet. Go say hello to Lumi first.
          </p>
        )}
      </div>

      {canGoForward && (
        <div className="companion-row companion-row--bottom">
          <button
            type="button"
            className="companion-next"
            onClick={handleForward}
            data-agent-kind="action"
            data-agent-action="companion.next"
            data-agent-danger="none"
            data-agent-confirm="never"
          >
            Show me
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path
                d="M9 5l7 7-7 7"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </button>
        </div>
      )}
    </main>
  );
}