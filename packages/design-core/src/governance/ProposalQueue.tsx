/**
 * @file ProposalQueue — Lumi's co-presence proposals.
 * Every Lumi action appears as a proposal card with Accept / Reject — the
 * human is always the final actor. This is the UI for the co-presence scope
 * declaration ("Lumi proposes, the human decides").
 *
 * @a2ui-component ProposalQueue
 * @a2ui-props proposals Proposal[] - Pending proposals
 * @a2ui-props onAccept (id) => void
 * @a2ui-props onReject (id, reason?) => void
 */

import { GOVERNANCE } from '../math/colors.js';

export interface Proposal {
  id: string;
  ts: string;
  action: string;
  summary?: string;
  node?: string;
}

export interface ProposalQueueProps {
  proposals: Proposal[];
  onAccept?: (id: string) => void;
  onReject?: (id: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

export function ProposalQueue({ proposals, onAccept, onReject, className, style }: ProposalQueueProps) {
  return (
    <div className={`p31-proposal-queue flex flex-col gap-2 ${className || ''}`} style={style} role="list" aria-label="Lumi proposals awaiting human approval">
      {proposals.length === 0 ? (
        <p className="px-1 text-xs text-slate-500">No pending proposals.</p>
      ) : (
        proposals.map((p) => (
          <div key={p.id} role="listitem" className="rounded-lg border border-white/12 border-dashed bg-white/[0.02] p-3">
            <div className="flex items-center gap-2 text-xs">
              <span className={`text-[10px] font-semibold uppercase tracking-wider text-[${GOVERNANCE.agentAccent}]`}>Proposal</span>
              <span className="ml-auto font-mono text-slate-500">{p.ts}</span>
            </div>
            <p className="mt-1.5 text-sm font-medium text-slate-100">{p.action}</p>
            {p.summary ? <p className="mt-1 text-xs text-slate-400">{p.summary}</p> : null}
            {p.node ? <p className="mt-1 font-mono text-[10px] text-slate-500">{p.node}</p> : null}
            <div className="mt-2.5 flex gap-2">
              <button
                onClick={() => onAccept?.(p.id)}
                className={`inline-flex min-h-[44px] flex-1 items-center justify-center rounded-full border border-[${GOVERNANCE.chainVerified}]/40 bg-[${GOVERNANCE.chainVerified}]/10 px-3 text-sm font-medium text-[${GOVERNANCE.chainVerified}] transition-colors hover:bg-[${GOVERNANCE.chainVerified}]/20`}
              >
                Accept
              </button>
              <button
                onClick={() => onReject?.(p.id)}
                className={`inline-flex min-h-[44px] flex-1 items-center justify-center rounded-full border border-white/15 bg-white/5 px-3 text-sm font-medium text-slate-300 transition-colors hover:border-white/30`}
              >
                Reject
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default ProposalQueue;