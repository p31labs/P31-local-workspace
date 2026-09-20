import { useCallback, useState } from 'react';
import { Lumi } from './Lumi';

interface Props {
  onProgress: () => void;
  onFocus: (node: string) => void;
}

/**
 * Chapter 1 — "Meet Lumi." One orb, one button, one celebration. Tapping
 * "Say hello" commits a human `focus` on `lumi` — the first proof in the arc
 * that an action leaves a durable mark.
 *
 * `phase` is local UI choreography (which beat of the celebration is
 * showing); the event log stays the durable record of what happened. The
 * celebrated state is driven by the pulse's `animationend`, not a setTimeout,
 * so reduced-motion users (duration ~12ms via --motion-scale) land there
 * almost instantly with no separate code path.
 */
export function ChildChapter({ onProgress, onFocus }: Props) {
  const [phase, setPhase] = useState<'waiting' | 'celebrating' | 'celebrated'>('waiting');

  const handleHello = useCallback(() => {
    setPhase('celebrating');
    onFocus('lumi');
  }, [onFocus]);

  const handlePulseEnd = useCallback(() => setPhase('celebrated'), []);

  return (
    <div className="chapter chapter--child">
      <div className="chapter-lumi">
        <span
          className={`chapter-pulse ${phase === 'celebrating' ? 'chapter-pulse--active' : ''}`}
          aria-hidden="true"
          onAnimationEnd={phase === 'celebrating' ? handlePulseEnd : undefined}
        />
        <Lumi wave={phase === 'waiting'} greeting={phase !== 'waiting'} />
      </div>

      <h1 className="chapter-title" aria-live="polite">
        {phase === 'waiting' ? 'Meet Lumi.' : 'Hi! I\u2019m Lumi.'}
      </h1>

      {phase !== 'celebrated' && (
        <button
          className="chapter-action"
          onClick={handleHello}
          type="button"
          disabled={phase === 'celebrating'}
          aria-label="Say hello to Lumi"
          data-agent-kind="action"
          data-agent-action="loom.focus"
          data-agent-target="lumi"
          data-agent-danger="none"
          data-agent-confirm="never"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path
              d="M7 11V6a2 2 0 1 1 4 0v5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M11 11V4a2 2 0 1 1 4 0v7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M15 11V5a2 2 0 1 1 4 0v9a6 6 0 0 1-6 6h-1a6 6 0 0 1-6-6v-2"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
          Say hello
        </button>
      )}

      {phase === 'celebrating' && (
        <div className="chapter-celebration" role="status">
          Hello!
        </div>
      )}

      {phase === 'celebrated' && (
        <button className="chapter-next" onClick={onProgress} type="button">
          What&rsquo;s next →
        </button>
      )}
    </div>
  );
}