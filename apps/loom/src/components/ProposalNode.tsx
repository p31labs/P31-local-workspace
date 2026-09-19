import type { NodeProps } from '@xyflow/react';

/**
 * Custom node for proposal ghosts: the label plus a thin body-survival bar.
 * Green > 0.8, amber 0.5–0.8, red < 0.5. The bar makes revision drift visible
 * at a glance — a proposal rewritten past ~0.5 per revision has been
 * redirected, not refined.
 */
export function ProposalNode({ data }: NodeProps) {
  const { label, survival, tone } = data as { label: string; survival: number; tone: string };
  const pct = `${Math.round(Math.max(0, Math.min(1, survival)) * 100)}%`;
  return (
    <div className="loom-proposal-node">
      <span className="loom-proposal-label">{label}</span>
      <span className="loom-survival-track" title={`body survival ${pct}`}>
        <span className={`loom-survival-fill ${tone}`} style={{ width: pct }} />
      </span>
    </div>
  );
}
