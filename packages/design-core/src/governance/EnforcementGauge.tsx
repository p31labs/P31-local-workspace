/**
 * @file EnforcementGauge — observe vs enforce state for the Loom's policy gate.
 * Shows the current enforcement mode and a live "would-refuse" counter — the
 * visible evidence of guardAgentEvent in action.
 *
 * @a2ui-component EnforcementGauge
 * @a2ui-props mode "observe" | "enforce" | "off"
 * @a2ui-props wouldRefuse number - Refusals in the observation window
 * @a2ui-props sessionCaps string - Session-cap summary (optional)
 */

import { GOVERNANCE } from '../math/colors.js';

export type EnforcementMode = 'observe' | 'enforce' | 'off';

export interface EnforcementGaugeProps {
  mode: EnforcementMode;
  wouldRefuse?: number;
  sessionCaps?: string;
  className?: string;
  style?: React.CSSProperties;
}

const MODE_META: Record<EnforcementMode, { label: string; color: string; bar: string; note: string }> = {
  observe: { label: 'Observe', color: `text-[${GOVERNANCE.statusObserve}]`, bar: `bg-[${GOVERNANCE.statusObserve}]`, note: 'Enforcement warm-up — violations recorded, not blocked' },
  enforce: { label: 'Enforce', color: `text-[${GOVERNANCE.statusEnforce}]`, bar: `bg-[${GOVERNANCE.statusEnforce}]`, note: 'Enforcement active — violations refused at the gate' },
  off: { label: 'Off', color: 'text-slate-400', bar: 'bg-slate-400', note: 'Policy gate disabled' },
};

export function EnforcementGauge({ mode, wouldRefuse = 0, sessionCaps, className, style }: EnforcementGaugeProps) {
  const meta = MODE_META[mode];

  return (
    <div className={`p31-enforcement-gauge rounded-lg border border-white/10 bg-white/[0.03] p-3 ${className || ''}`} style={style} data-mode={mode}>
      <div className="flex items-center gap-2">
        <span className={`text-xs font-semibold uppercase tracking-wider ${meta.color}`}>{meta.label}</span>
        <span className="ml-auto font-mono text-xs text-slate-400" aria-label="would-refuse counter">
          {wouldRefuse.toLocaleString()} would-refuse
        </span>
      </div>
      <div className="mt-2 h-1.5 w-full rounded-full bg-white/10" aria-hidden="true">
        <div className={`h-full rounded-full ${meta.bar}`} style={{ width: mode === 'enforce' ? '100%' : mode === 'observe' ? '45%' : '0%' }} />
      </div>
      <p className="mt-2 text-xs text-slate-400">{meta.note}{sessionCaps ? ` · ${sessionCaps}` : ''}</p>
    </div>
  );
}

export default EnforcementGauge;