interface ReviewCardProps {
  /** Lumi's review, in plain language. One sentence. */
  review: string;
  /** Fires on "Yes, make it." Caller commits the human's `approve`. */
  onConfirm: () => void;
  /** Fires on "Pick another color." Caller commits a `focus` back to the
   *  picker — reversing, not deciding against. */
  onPickAnother: () => void;
  /** True while the celebration pulse is playing. Buttons stay mounted
   *  (AAF actions visible to tests/agents) but are disabled. */
  celebrating?: boolean;
  /** True once the child has confirmed — the buttons unmount, the text stays. */
  confirmed?: boolean;
}

/**
 * Lumi's review of the child's idea. The mirror image of ProposalCard, but
 * structurally distinct enough to warrant its own component:
 *
 *   - ProposalCard (Ch 3) presents Lumi's idea and asks the human to decide
 *     between Yes and Not yet. Both answers are decisions.
 *   - ReviewCard (Ch 4) presents Lumi's *reaction* to the human's idea, with
 *     a single forward action ("Yes, make it") and a single backward one
 *     ("Pick another color"). There is no "no" — going back to the picker
 *     *is* the reverse, and it is fully reversible.
 *
 * When Chapter 5's workshop needs a third card shape, that is the point to
 * unify this and ProposalCard into one parameterized component. Two call
 * sites is too early; three is not.
 */
export function ReviewCard({
  review,
  onConfirm,
  onPickAnother,
  celebrating = false,
  confirmed = false,
}: ReviewCardProps) {
  return (
    <div className="proposal-card" role="group" aria-label="Lumi's review">
      <p className="proposal-text">{review}</p>

      {!confirmed && (
        <div className="proposal-actions">
          <button
            type="button"
            className="proposal-action proposal-action--yes"
            onClick={onConfirm}
            disabled={celebrating}
            data-agent-kind="action"
            data-agent-action="make.confirm"
            data-agent-target="make"
            data-agent-danger="none"
            data-agent-confirm="never"
          >
            Yes, make it
          </button>
          <button
            type="button"
            className="proposal-action proposal-action--not-yet"
            onClick={onPickAnother}
            disabled={celebrating}
            data-agent-kind="action"
            data-agent-action="color.repick"
            data-agent-target="color"
            data-agent-danger="none"
            data-agent-confirm="never"
          >
            Pick another color
          </button>
        </div>
      )}
    </div>
  );
}