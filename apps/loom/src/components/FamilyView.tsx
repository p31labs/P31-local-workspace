import { useCallback, useMemo } from 'react';
import { MadeArtifact } from './MadeArtifact';
import { Lumi } from './Lumi';
import { useLoomProjection } from '../lib/useLoomProjection';
import { codename } from '@p31/canon/loom/codename';
import type { LoomEvent } from '@p31/canon/loom/events';
import type { LoomEventInput } from '@p31/canon/loom/gate';

interface CareProofLike {
  did: string;
  codename: string;
  bound: boolean;
  careScore: number;
  verified: boolean;
  sovereigntyPool: number;
  performancePool: number;
  totalEarned: number;
  updatedAt: number | null;
}

interface Props {
  events: LoomEvent[];
  care: CareProofLike | null;
  onExit: () => void;
  commit: (event: LoomEventInput) => void;
}

/**
 * Family view — one short page the whole family (and their agents) reads
 * together. The family-memory pattern: shared artifacts + the care circle +
 * the last shared events, with provenance always one tap away.
 *
 * Constraints (from the same family floor as the companion):
 *   - Shared-scope events ONLY. Personal records never reach this surface —
 *     the read path already filtered them out before this component saw them.
 *   - One sentence, no counts-as-scores. The care circle is presence, not a
 *     leaderboard.
 *   - Every shared write gets a receipt (its seq), and the receipt links to
 *     /provenance/:seq — "prove what happened." Undo is an event, never a
 *     delete (the log is append-only and tamper-evident).
 *   - No auto-advance, no timers, no chip.
 */
export function FamilyView({ events, care, onExit, commit }: Props) {
  const { colorInfo } = useLoomProjection(events);

  // Shared-scope events only (defense in depth — the read path already
  // filtered, but this component refuses to render a personal record).
  // Agent events are always shared by the gate; human events carry scope.
  const sharedEvents = useMemo(
    () => events.filter((e) => e.writer === 'agent' || e.scope !== 'personal'),
    [events],
  );
  const lastShared = sharedEvents.slice(-5);

  // The receipt: the latest shared event, with its seq + prev_hash link.
  const receipt = lastShared[lastShared.length - 1] ?? null;

  const handleArtifactTap = useCallback(() => {
    commit({ writer: 'human', kind: 'focus', node: 'family-artifact' });
  }, [commit]);

  // Undo is a compensating shared event (a "revert" focus). The log is
  // append-only: we never delete, we append the reversal. Provenance shows
  // both the original and the undo, in order.
  const handleUndo = useCallback(() => {
    if (!receipt) return;
    commit({ writer: 'human', kind: 'focus', node: `family-undo-${receipt.seq}` });
  }, [receipt, commit]);

  const handleBack = useCallback(() => {
    commit({ writer: 'human', kind: 'focus', node: 'family-back' });
    onExit();
  }, [commit, onExit]);

  return (
    <main
      className="family"
      data-agent-kind="region"
      data-agent-action="family.view"
    >
      <div className="family-row family-row--top">
        <button
          type="button"
          className="family-back"
          onClick={handleBack}
          data-agent-kind="action"
          data-agent-action="family.back"
          data-agent-danger="none"
          data-agent-confirm="never"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
          Back
        </button>
      </div>

      <div className="family-stage">
        <div className="family-lumi">
          <Lumi calm greeting />
        </div>

        <p className="family-sentence">What your family and Lumi made together.</p>

        {colorInfo ? (
          <MadeArtifact colorName={colorInfo.name} colorToken={colorInfo.token} onTap={handleArtifactTap} calm />
        ) : (
          <p className="family-sentence family-sentence--empty">
            Nothing made yet. Someone has to say hello to Lumi first.
          </p>
        )}

        {/* Care circle — presence, not a score. */}
        <div className="family-care" data-agent-kind="status" data-agent-action="family.care">
          {care && care.bound ? (
            <>
              <p className="family-care-name">{care.codename}</p>
              <p className="family-care-line">
                {care.verified
                  ? `a verified caregiver in this family (care ${Math.round(care.careScore * 100)}%).`
                  : 'a caregiver building a record here.'}
              </p>
              <p className="family-care-pools">
                Sovereignty pool {Math.round(care.sovereigntyPool)} · Performance pool {Math.round(care.performancePool)}
              </p>
            </>
          ) : (
            <p className="family-care-line">
              No care record bound yet — the family's LOVE journey starts with their first care act.
            </p>
          )}
        </div>

        {/* Receipt + provenance for the latest shared event. */}
        {receipt && (
          <div className="family-receipt" data-agent-kind="status" data-agent-action="family.receipt">
            <p className="family-receipt-line">
              Last shared moment: {describeEvent(receipt)}.
            </p>
            <div className="family-receipt-actions">
              <a
                className="family-proof"
                href={`/api/loom/provenance/${receipt.seq}`}
                data-agent-kind="action"
                data-agent-action="family.provenance"
                data-agent-danger="none"
                data-agent-confirm="never"
              >
                Prove it
              </a>
              <button
                type="button"
                className="family-undo"
                onClick={handleUndo}
                data-agent-kind="action"
                data-agent-action="family.undo"
                data-agent-danger="low"
                data-agent-confirm="optional"
              >
                Undo
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

/** A one-line, plain-language description of an event, naming people by code
 *  name (never a raw id). Shared events carry no humanId, so the actor is
 *  "someone in the family" unless an agent authored it. */
function describeEvent(e: LoomEvent): string {
  if (e.writer === 'agent') {
    switch (e.kind) {
      case 'propose':
        return 'Lumi proposed something';
      case 'traverse':
        return 'Lumi looked around';
      case 'review':
        return `Lumi reviewed ${codename(e.agent)}'s work`;
      default:
        return 'Lumi was here';
    }
  }
  switch (e.kind) {
    case 'focus':
      return `someone focused on ${e.node}`;
    case 'approve':
      return 'someone said yes';
    case 'reject':
      return 'someone said not yet';
    case 'view.save':
      return 'someone saved a read';
    default:
      return 'someone did something';
  }
}