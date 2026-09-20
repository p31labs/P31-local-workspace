interface ProposalCardProps {
  /** The proposal in plain language — one sentence, no jargon. */
  proposal: string;
  /** Fires on Yes. Caller commits `approve`. */
  onApprove: () => void;
  /** Fires on Not yet. Caller commits `reject` with a friendly reason. */
  onReject: () => void;
  /** Which decision landed, or null while undecided. */
  decided: 'yes' | 'not-yet' | null;
  /** True while the celebration pulse is playing — the buttons stay mounted
   *  (so the AAF actions remain in the DOM) but are disabled. */
  celebrating?: boolean;
}

/**
 * Lumi's proposal, presented in plain language, with a two-answer decision.
 *
 * Design constraints:
 *   - Two buttons only: "Yes, do it" / "Not yet". No third option — the
 *     child is not asked to reason or negotiate.
 *   - Both buttons are visually equal weight. "Not yet" is not styled as a
 *     warning, a cancel, or a lesser action.
 *   - Each button carries its own AAF action so tests and agents can find
 *     them independently.
 *   - The card never blocks a decision with a timer. No default, no
 *     auto-advance, no "if you do nothing" fallback.
 */
export function ProposalCard({
  proposal,
  onApprove,
  onReject,
  decided,
  celebrating = false,
}: ProposalCardProps) {
  return (
    <div className="proposal-card" role="group" aria-label="Lumi's idea">
      <p className="proposal-text">{proposal}</p>

      {(decided === null || celebrating) && (
        <div className="proposal-actions">
          <button
            type="button"
            className="proposal-action proposal-action--yes"
            onClick={onApprove}
            disabled={celebrating}
            data-agent-kind="action"
            data-agent-action="proposal.approve"
            data-agent-target="proposal"
            data-agent-danger="none"
            data-agent-confirm="never"
          >
            Yes, do it
          </button>
          <button
            type="button"
            className="proposal-action proposal-action--not-yet"
            onClick={onReject}
            disabled={celebrating}
            data-agent-kind="action"
            data-agent-action="proposal.defer"
            data-agent-target="proposal"
            data-agent-danger="none"
            data-agent-confirm="never"
          >
            Not yet
          </button>
        </div>
      )}
    </div>
  );
}