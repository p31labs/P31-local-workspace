import { useCallback, useState } from 'react';
import { Lumi } from './Lumi';
import { Orb } from './Orb';
import { SharedChip } from './SharedChip';
import { SoundToggle } from './SoundToggle';
import { useLoomSound } from '../lib/useLoomSound';
import { useLoomProjection } from '../lib/useLoomProjection';
import type { LoomEvent } from '@p31/canon/loom/events';

interface Props {
  onProgress: () => void;
  onFocus: (node: string) => void;
  events: LoomEvent[];
}

type Phase = 'waiting' | 'celebrating' | 'celebrated';

/**
 * The child's first views — two beats, one phase machine.
 *
 * Beat 1 — "Meet Lumi." One orb-of-a-face, one button, one celebration.
 * Tapping "Say hello" commits a human `focus` on `lumi`.
 *
 * Beat 2 — "Make something happen." Lumi points at the field orb; the child
 * taps it; the orb glows. Tapping commits a human `focus` on `orb` and, if
 * sound is opted in, a celebration chime. The orb is *spent* after the tap,
 * not hidden — the child can see what they did.
 *
 * `phase` is local UI choreography (which beat of a celebration is showing);
 * the event log stays the durable record of what happened. The celebrated
 * state is driven by the pulse's `animationend`, not a setTimeout, so
 * reduced-motion users (duration ~12ms via --motion-scale) land there almost
 * instantly with no separate code path.
 */
export function ChildChapter({ onProgress, onFocus, events }: Props) {
  const [stage, setStage] = useState<'lumi' | 'orb'>('lumi');
  const [phase, setPhase] = useState<Phase>('waiting');
  const sound = useLoomSound();

  // The chip counts the child's own actions — never the agent's.
  const { humanCount } = useLoomProjection(events);

  const handleHello = useCallback(() => {
    setPhase('celebrating');
    onFocus('lumi');
  }, [onFocus]);

  const handleLumiPulseEnd = useCallback(() => {
    // "Hi! I'm Lumi." -> the field orb appears.
    setStage('orb');
    setPhase('waiting');
  }, []);

  const handleOrbTap = useCallback(() => {
    setPhase('celebrating');
    // Sound first, but its return value is deliberately ignored — the visual
    // response below fires regardless. (Research rule: sound never replaces
    // visual feedback.)
    sound.play('celebrate');
    onFocus('orb');
  }, [onFocus, sound]);

  const handleOrbPulseEnd = useCallback(() => setPhase('celebrated'), []);

  const isLumi = stage === 'lumi';
  const celebrating = phase === 'celebrating';

  return (
    <div className="chapter chapter--child">
      {!isLumi && (
        <div className="chapter-topbar">
          <SoundToggle enabled={sound.enabled} onToggle={sound.toggle} />
          <SharedChip count={humanCount} />
        </div>
      )}

      <div className={`chapter-lumi ${isLumi ? '' : 'chapter-lumi--small'}`}>
        <span
          className={`chapter-pulse ${celebrating ? 'chapter-pulse--active' : ''}`}
          aria-hidden="true"
          onAnimationEnd={isLumi ? handleLumiPulseEnd : handleOrbPulseEnd}
        />
        <Lumi wave={isLumi && phase === 'waiting'} greeting={phase !== 'waiting'} />
      </div>

      <h1 className="chapter-title" aria-live="polite">
        {isLumi
          ? phase === 'waiting'
            ? 'Meet Lumi.'
            : 'Hi! I\u2019m Lumi.'
          : phase === 'waiting'
            ? 'Tap the orb.'
            : 'You made it glow!'}
      </h1>

      {isLumi ? (
        <>
          {phase !== 'celebrated' && (
            <button
              className="chapter-action"
              onClick={handleHello}
              type="button"
              disabled={celebrating}
              aria-label="Say hello to Lumi"
              data-agent-kind="action"
              data-agent-action="loom.focus"
              data-agent-target="lumi"
              data-agent-danger="none"
              data-agent-confirm="never"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M7 11V6a2 2 0 1 1 4 0v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
                <path d="M11 11V4a2 2 0 1 1 4 0v7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
                <path d="M15 11V5a2 2 0 1 1 4 0v9a6 6 0 0 1-6 6h-1a6 6 0 0 1-6-6v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
              </svg>
              Say hello
            </button>
          )}
          {phase === 'celebrating' && (
            <div className="chapter-celebration" role="status">
              Hello!
            </div>
          )}
        </>
      ) : (
        <>
          <div className="chapter-orb-stage">
            <Orb
              onTap={handleOrbTap}
              active={celebrating}
              spent={phase === 'celebrated'}
              label="Tap the glowing orb"
            />
          </div>
          {phase === 'celebrated' && (
            <button className="chapter-next" onClick={onProgress} type="button">
              What&rsquo;s next →
            </button>
          )}
        </>
      )}
    </div>
  );
}