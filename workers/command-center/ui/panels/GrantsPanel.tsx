import { GlassPanel, MetricBadge } from '@p31/design-core/compositions'
import type { Grant, LegalState } from '../types'

interface GrantsPanelProps {
  grants: Grant[]
  legal: LegalState
}

function deadlineChip(days: number) {
  if (days <= 7) return 'cc-chip--bad'
  if (days <= 21) return 'cc-chip--warn'
  return 'cc-chip--ok'
}

export default function GrantsPanel({ grants, legal }: GrantsPanelProps) {
  const sorted = [...grants].sort((a, b) => a.days - b.days)

  return (
    <GlassPanel padding="md">
      <div className="cc-card-title">Funding Rail</div>

      <div className="cc-hearing" style={{ marginBottom: 16 }}>
        <span className="cc-hearing__days">{legal.days_to_hearing}</span>
        <span style={{ fontSize: 13 }}>days to hearing</span>
        <span className="cc-muted" style={{ fontSize: 12, marginLeft: 'auto' }}>
          {legal.case} &middot; {legal.judge} &middot; {legal.hearing_date}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <MetricBadge label="Active Grants" value={`${grants.length}`} />
        <MetricBadge label="Next Deadline" value={`${sorted.length > 0 ? sorted[0].days : '--'}d`} />
      </div>

      {sorted.length === 0 ? (
        <div className="cc-muted">No grants active.</div>
      ) : (
        sorted.map((g) => (
          <div className="cc-row" key={g.name}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
              <a href={g.url} className="cc-link cc-mono" target="_blank" rel="noopener noreferrer">
                {g.name}
              </a>
              <span className="cc-secondary">{g.amount}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <span className="cc-muted">{g.deadline}</span>
              <span className={`cc-chip ${deadlineChip(g.days)}`}>
                {g.days}d
              </span>
            </div>
          </div>
        ))
      )}
    </GlassPanel>
  )
}

export { GrantsPanel }
