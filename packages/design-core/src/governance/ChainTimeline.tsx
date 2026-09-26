/**
 * @file ChainTimeline — scrollable hash-chained event timeline.
 * The hero of the Loom governance cockpit: each event is a card showing
 * timestamp, actor (human or Lumi), action, and the prev_hash link to the
 * prior block. A broken chain renders the exact divergence point in crimson.
 *
 * @a2ui-component ChainTimeline
 * @a2ui-props events ChainEvent[] - Events to render (oldest-first)
 * @a2ui-props verifyStatus "intact" | "broken" | "pending" - Chain verdict
 */

import { GOVERNANCE } from '../math/colors.js';

export interface ChainEvent {
  seq: number;
  ts: string;
  actor: 'human' | 'agent';
  actorName?: string;
  action: string;
  hash: string;
  prevHash?: string;
  verified?: boolean;
  broken?: boolean;
  kind?: string;
}

export interface ChainTimelineProps {
  events: ChainEvent[];
  verifyStatus?: 'intact' | 'broken' | 'pending';
  className?: string;
  style?: React.CSSProperties;
  maxHeight?: string;
}

const VERIFY_META: Record<NonNullable<ChainTimelineProps['verifyStatus']>, { label: string; dot: string; text: string; border: string }> = {
  intact: { label: 'Chain intact', dot: `bg-[${GOVERNANCE.chainVerified}]`, text: `text-[${GOVERNANCE.chainVerified}]`, border: `border-[${GOVERNANCE.chainVerified}]` },
  broken: { label: 'Chain broken', dot: `bg-[${GOVERNANCE.chainBroken}]`, text: `text-[${GOVERNANCE.chainBroken}]`, border: `border-[${GOVERNANCE.chainBroken}]` },
  pending: { label: 'Verifying…', dot: `bg-[${GOVERNANCE.chainPending}]`, text: `text-[${GOVERNANCE.chainPending}]`, border: `border-[${GOVERNANCE.chainPending}]` },
};

export function ChainTimeline({ events, verifyStatus = 'intact', className, style, maxHeight }: ChainTimelineProps) {
  const meta = VERIFY_META[verifyStatus];

  return (
    <div
      className={`p31-chain-timeline flex flex-col gap-2 overflow-y-auto ${className || ''}`}
      style={{ ...style, maxHeight }}
      data-verify={verifyStatus}
      role="list"
      aria-label="Hash-chained event timeline"
    >
      <div className={`p31-chain-verdict inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium ${meta.border} ${meta.text} bg-black/5`}>
        <span className={`w-2 h-2 rounded-full ${meta.dot}`} aria-hidden="true" />
        {meta.label}
      </div>

      {events.map((ev, i) => {
        const isBroken = verifyStatus === 'broken' && (ev.broken || i === 0);
        const actorClass = ev.actor === 'agent' ? `text-[${GOVERNANCE.agentAccent}]` : 'text-slate-200';
        const borderClass = isBroken ? `border-[${GOVERNANCE.chainBroken}]` : 'border-white/10';

        return (
          <div
            key={ev.seq}
            role="listitem"
            className={`p31-chain-event rounded-lg border ${borderClass} bg-white/[0.03] px-3 py-2 ${isBroken ? 'shadow-[0_0_0_1px_color-mix(in_oklch,var(--p31-accent-red)_25%,transparent)]' : ''}`}
            data-broken={isBroken || undefined}
          >
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-mono">{ev.seq}</span>
              <span className={`font-medium ${actorClass}`}>{ev.actorName || (ev.actor === 'agent' ? 'Lumi' : 'human')}</span>
              {ev.kind ? <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-400">{ev.kind}</span> : null}
              <span className="ml-auto text-slate-500 font-mono">{ev.ts}</span>
            </div>
            <p className="mt-1 text-sm text-slate-200">{ev.action}</p>
            <div className={`mt-1.5 font-mono text-[10px] leading-relaxed ${isBroken ? `text-[${GOVERNANCE.chainBroken}]` : 'text-slate-500'}`}>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-600">prev</span>
                <code>{ev.prevHash || '—'}</code>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-600">this</span>
                <code>{ev.hash}</code>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default ChainTimeline;