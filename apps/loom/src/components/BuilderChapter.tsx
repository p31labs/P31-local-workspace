import { useCallback, useState } from 'react';
import { Lumi } from './Lumi';
import { ProposalCard } from './ProposalCard';
import { SharedChip } from './SharedChip';
import { useLoomSound } from '../lib/useLoomSound';
import { useLoomProjection } from '../lib/useLoomProjection';
import type { LoomEvent } from '@p31/canon/loom/events';

interface Props {
  events: LoomEvent[];
  onProgress: () => void;
  onApprove: (proposalId: string) => void;
  onReject: (proposalId: string, reason: string) => void;
}

type Phase = 'proposing' | 'celebrating' | 'celebrated';

function proposalText(body: unknown): string {
  if (body !== null && typeof body === 'object' && !Array.isArray(body)) {
    const change = (body as Record<string, unknown>).change;
    if (typeof change === 'string') return `I want to ${change}. Is that okay?`;
  }
  return 'I want to make the buttons rounder. Is that okay?';
}

/**
 * The "Lumi has an idea" beat. Lumi proposes in plain language; the child
 * answers Yes or Not yet. Both answers are completions — each commits an
 * event (approve / reject) and each celebrates. "Not yet" is a valid
 * decision, not a failure: same weight of button, gentler copy and a soft
 * descending sound instead of the ascending chime.
 *
 * Same phase discipline as the earlier beats: `phase` is local choreography,
 * the log is the durable record, and the celebrated state is driven by the
 * pulse's animationend (so reduced-motion collapses it to ~instant with no
 * separate path). The buttons stay mounted, disabled, through the pulse so
 * the AAF actions remain in the DOM while the commit lands.
 */
export function BuilderChapter({ events, onProgress, onApprove, onReject }: Props) {
  const [phase, setPhase] = useState<Phase>('proposing');
  const [decided, setDecided] = useState<'yes' | 'not-yet' | null>(null);
  const sound = useLoomSound();

  const { humanCount, latestPropose } = useLoomProjection(events);

  const handleApprove = useCallback(() => {
    if (!latestPropose) return;
    setDecided('yes');
    setPhase('celebrating');
    sound.play('celebrate');
    onApprove(latestPropose.id);
  }, [latestPropose, onApprove, sound]);

  const handleReject = useCallback(() => {
    if (!latestPropose) return;
    setDecided('not-yet');
    setPhase('celebrating');
    // The defer cue, not the celebrate cue — different sound, equal warmth.
    sound.play('defer');
    onReject(latestPropose.id, 'not-yet');
  }, [latestPropose, onReject, sound]);

  const handlePulseEnd = useCallback(() => setPhase('celebrated'), []);

  if (!latestPropose) {
    return (
      <div className="chapter chapter--builder">
        <div className="chapter-topbar">
          <SharedChip count={humanCount} />
        </div>
        <div className="chapter-lumi chapter-lumi--small">
          <Lumi />
        </div>
        <p className="chapter-copy">Lumi has an idea.</p>
        <p className="chapter-hint">Lumi is thinking…</p>
      </div>
    );
  }

  const celebrating = phase === 'celebrating';
  const title =
    phase === 'proposing'
      ? 'Lumi has an idea.'
      : decided === 'yes'
        ? 'Great! Let\u2019s make it.'
        : 'Okay. Maybe later.';

  return (
    <div className="chapter chapter--builder">
      <div className="chapter-topbar">
        <SharedChip count={humanCount} />
      </div>

      <div className="chapter-lumi chapter-lumi--small">
        <span
          className={`chapter-pulse ${celebrating ? 'chapter-pulse--active' : ''}`}
          aria-hidden="true"
          onAnimationEnd={celebrating ? handlePulseEnd : undefined}
        />
        <Lumi greeting={phase !== 'proposing'} />
      </div>

      <h1 className="chapter-title" aria-live="polite">
        {title}
      </h1>

      <ProposalCard
        proposal={proposalText(latestPropose.body)}
        onApprove={handleApprove}
        onReject={handleReject}
        decided={decided}
        celebrating={celebrating}
      />

      {phase === 'celebrated' && (
        <button className="chapter-next" onClick={onProgress} type="button">
          See what we made &rarr;
        </button>
      )}
    </div>
  );
}