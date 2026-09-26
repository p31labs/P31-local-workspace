/**
 * @file RefusalFeed — the governance sidecar visualization.
 * Every refused/observed agent action with its reason (scope violation,
 * session cap exceeded, no token). This is the visible evidence of the
 * Loom's co-presence enforcement.
 *
 * @a2ui-component RefusalFeed
 * @a2ui-props refusals Refusal[] - Refusal records
 * @a2ui-props mode "observe" | "enforce"
 */

import { GOVERNANCE } from '../math/colors.js';

export type RefusalReason = 'scope' | 'session-cap' | 'no-token' | 'other';

export interface Refusal {
  id: string;
  ts: string;
  actor: string;
  action: string;
  reason: RefusalReason;
  detail?: string;
}

export interface RefusalFeedProps {
  refusals: Refusal[];
  mode?: 'observe' | 'enforce';
  className?: string;
  style?: React.CSSProperties;
}

const REASON_LABEL: Record<RefusalReason, string> = {
  scope: 'Scope violation',
  'session-cap': 'Session cap exceeded',
  'no-token': 'No capability token',
  other: 'Other',
};

export function RefusalFeed({ refusals, mode = 'enforce', className, style }: RefusalFeedProps) {
  return (
    <div className={`p31-refusal-feed flex flex-col gap-2 ${className || ''}`} style={style} role="list" aria-label="Refusal feed">
      <div className="flex items-center gap-2 px-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Refusals</span>
        <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
          mode === 'observe'
            ? `bg-[${GOVERNANCE.chainPending}]/10 text-[${GOVERNANCE.chainPending}]`
            : `bg-[${GOVERNANCE.chainBroken}]/10 text-[${GOVERNANCE.chainBroken}]`
        }`}>
          {mode}
        </span>
      </div>

      {refusals.length === 0 ? (
        <p className="px-1 text-xs text-slate-500">No refusals recorded.</p>
      ) : (
        refusals.map((r) => (
          <div key={r.id} role="listitem" className={`rounded-lg border border-[${GOVERNANCE.chainBroken}]/25 bg-white/[0.02] px-3 py-2`}>
            <div className="flex items-center gap-2 text-xs">
              <span className={`h-1.5 w-1.5 rounded-full bg-[${GOVERNANCE.chainBroken}]`} aria-hidden="true" />
              <span className="font-medium text-slate-200">{r.actor}</span>
              <span className="ml-auto font-mono text-slate-500">{r.ts}</span>
            </div>
            <p className="mt-1 text-sm text-slate-300">{r.action}</p>
            <p className={`mt-1 text-[11px] font-medium text-[${GOVERNANCE.chainBroken}]`}>{REASON_LABEL[r.reason]}</p>
            {r.detail ? <p className="mt-0.5 font-mono text-[10px] text-slate-500">{r.detail}</p> : null}
          </div>
        ))
      )}
    </div>
  );
}

export default RefusalFeed;