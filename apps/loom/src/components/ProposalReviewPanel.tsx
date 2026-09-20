import type { Proposal } from '@p31/canon/loom/events'
import type { Tier } from '../lib/profile'
import { approveLabel } from '../lib/surface'
import { useLiteralLabels } from '../lib/usePresentation'
import { summarizeBody } from '../lib/copy'

interface Props {
  proposal: Proposal
  tier: Tier
  reason: string
  notYet: boolean
  onApprove: () => void
  onReject: (reason: string) => void
  onReasonChange: (reason: string) => void
  onToggleNotYet: () => void
  /** Optional — when provided, a "Back to field" button is rendered. */
  onBack?: () => void
}

/**
 * The review panel for a selected proposal: metadata, tier-specific decision
 * controls (approve / reject with reason / beginner "Not yet" gate), and the
 * advanced-tier raw body. Pure consumer — callbacks out, no writes. App owns
 * the `postEvent` wiring and the `reason`/`notYet` state.
 */
export function ProposalReviewPanel({
  proposal,
  tier,
  reason,
  notYet,
  onApprove,
  onReject,
  onReasonChange,
  onToggleNotYet,
  onBack,
}: Props) {
  const literal = useLiteralLabels()
  return (
    <div>
      {onBack && (
        <button className="loom-btn" type="button" onClick={onBack}>
          ← Back to field
        </button>
      )}
      <div className="loom-kind loom-kind--component">proposal</div>
      <h2>{proposal.id}</h2>
      <p className="loom-hint">
        node: {proposal.node} · status: {proposal.status} · rev {proposal.revision}
      </p>
      <p className="loom-summary">
        An agent proposed a change to <code>{proposal.node}</code>
        {proposal.author !== 'unknown' ? ` · authored by ${proposal.author}` : ''}.
        Nothing in the canon changes until you approve.
      </p>
      <div className="loom-actions">
        <button className="loom-btn loom-btn--ok" onClick={onApprove}>
          {approveLabel(tier)}
        </button>
        {tier === 'beginner' && !notYet ? (
          <button className="loom-btn loom-btn--no" onClick={onToggleNotYet}>
            Not yet
          </button>
        ) : (
          <div className="loom-reject">
            <input
              className="loom-reason"
              placeholder="reason (optional)"
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
            />
            <button className="loom-btn loom-btn--no" onClick={() => onReject(reason)}>
              Reject
            </button>
          </div>
        )}
      </div>
      {tier === 'advanced' && (
        literal ? (
          <p className="loom-summary">{summarizeBody(proposal.body)}</p>
        ) : (
          <pre className="loom-json">{JSON.stringify(proposal.body, null, 2)}</pre>
        )
      )}
    </div>
  )
}
