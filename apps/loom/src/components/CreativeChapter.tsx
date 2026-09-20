import { useCallback, useEffect, useMemo, useState } from 'react';
import { Lumi } from './Lumi';
import { ColorPicker } from './ColorPicker';
import { ReviewCard } from './ReviewCard';
import { SharedChip } from './SharedChip';
import { SoundToggle } from './SoundToggle';
import { useLoomSound } from '../lib/useLoomSound';
import type { LoomEvent } from '@p31/canon/loom/events';
import type { LoomEventInput } from '@p31/canon/loom/gate';

interface Props {
  events: LoomEvent[];
  onProgress: () => void;
  /** The parent wires this to postEvent. The chapter drives its own arc. */
  commit: (event: LoomEventInput) => void;
}

type Stage = 'pick' | 'review' | 'celebrating' | 'celebrated';

/** Child-facing colors. Not token names — the swatch is the icon, the word
 *  is the label. */
const COLORS = [
  { name: 'Amber', token: '--p31-accent' },
  { name: 'Green', token: '--p31-accent-green' },
  { name: 'Pink', token: '--p31-accent-iris' },
] as const;

const REVIEW_TEXT = 'I like this! Can I make it for you?';

/**
 * Chapter 4 — "You have an idea." The roles reverse: the child proposes, Lumi
 * reviews, the child confirms.
 *
 * Event flow, within the canon's writer-per-kind gate (propose/review are
 * agent-only; the child cannot commit a `propose`):
 *   1. The child picks a color            -> `focus` (human) on the color node
 *   2. Lumi formalizes the idea          -> `propose` (agent) with the color
 *   3. The child confirms                -> `approve` (human) on Lumi's proposal
 *
 * The child's pick is the seed of the idea; Lumi makes it concrete; the
 * child's "Yes" is the decision. The loop is symmetric with Chapter 3 — the
 * human initiates, the agent responds, the human decides.
 *
 * Lumi's propose is committed once per color (the effect refuses to commit a
 * second proposal for a color that already has one), so re-picking a color
 * generates a fresh propose -> fresh decision, with the full history intact in
 * the append-only log. Same phase discipline as the earlier beats: the pulse
 * drives the celebrated state via animationend.
 */
export function CreativeChapter({ events, onProgress, commit }: Props) {
  const [stage, setStage] = useState<Stage>('pick');
  const [pickedColor, setPickedColor] = useState<string | null>(null);
  const sound = useLoomSound();

  const humanCount = useMemo(
    () => events.filter((e) => e.writer === 'human').length,
    [events],
  );

  // The latest agent proposal that formalizes a color pick — the proposal the
  // child's confirm will approve.
  const latestPropose = useMemo(() => {
    for (let i = events.length - 1; i >= 0; i--) {
      const e = events[i];
      if (e.writer === 'agent' && e.kind === 'propose') return e;
    }
    return undefined;
  }, [events]);

  // Lumi formalizes the pick as a proposal — once per color.
  useEffect(() => {
    if (stage !== 'review' || !pickedColor) return;
    const already = events.some((e) => {
      if (e.writer !== 'agent' || e.kind !== 'propose') return false;
      const body = e.body as { color?: unknown } | undefined;
      return body?.color === pickedColor;
    });
    if (already) return;
    commit({
      writer: 'agent',
      kind: 'propose',
      id: `lumi-make-${Date.now()}`,
      node: `color-${pickedColor.toLowerCase()}`,
      body: { color: pickedColor },
      author: 'lumi',
    });
  }, [stage, pickedColor, events, commit]);

  const handlePick = useCallback(
    (color: string) => {
      sound.play('tap');
      commit({ writer: 'human', kind: 'focus', node: `color-${color.toLowerCase()}` });
      setPickedColor(color);
      setStage('review');
    },
    [commit, sound],
  );

  const handleConfirm = useCallback(() => {
    if (!latestPropose) return;
    sound.play('celebrate');
    setStage('celebrating');
    commit({ writer: 'human', kind: 'approve', proposal: latestPropose.id });
  }, [commit, latestPropose, sound]);

  const handlePickAnother = useCallback(() => {
    // Reversing is a navigation, not a decision. Committing `focus` back to
    // the picker keeps the log honest — a reader can see the child changed
    // their mind — without pretending they said "no".
    commit({ writer: 'human', kind: 'focus', node: 'color-picker' });
    setStage('pick');
  }, [commit]);

  const handlePulseEnd = useCallback(() => setStage('celebrated'), []);

  const celebrating = stage === 'celebrating';
  const confirmed = stage === 'celebrating' || stage === 'celebrated';

  const heading =
    stage === 'pick'
      ? 'Your turn.'
      : stage === 'review'
        ? 'Lumi likes it.'
        : 'Making it!';

  return (
    <div className="chapter chapter--creative">
      <div className="chapter-topbar">
        <SoundToggle enabled={sound.enabled} onToggle={sound.toggle} />
        <SharedChip count={humanCount} />
      </div>

      <div className="chapter-lumi chapter-lumi--small">
        <span
          className={`chapter-pulse ${celebrating ? 'chapter-pulse--active' : ''}`}
          aria-hidden="true"
          onAnimationEnd={celebrating ? handlePulseEnd : undefined}
        />
        <Lumi greeting={stage !== 'pick'} />
      </div>

      <h1 className="chapter-title" aria-live="polite">
        {heading}
      </h1>

      {stage === 'pick' && (
        <>
          <p className="chapter-subtitle">What color should we make?</p>
          <ColorPicker colors={COLORS} onPick={handlePick} />
        </>
      )}

      {stage !== 'pick' && (
        <ReviewCard
          review={REVIEW_TEXT}
          onConfirm={handleConfirm}
          onPickAnother={handlePickAnother}
          celebrating={celebrating}
          confirmed={confirmed}
        />
      )}

      {stage === 'celebrated' && (
        <button className="chapter-next" onClick={onProgress} type="button">
          See what we made &rarr;
        </button>
      )}
    </div>
  );
}