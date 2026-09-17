import { GlassPanel, MetricBadge } from '@p31/design-core/compositions'
import type { Costs } from '../types'

interface CostsPanelProps {
  costs: Costs | null
}

export default function CostsPanel({ costs }: CostsPanelProps) {
  if (!costs) {
    return (
      <GlassPanel padding="md">
        <div className="cc-card-title">Cost Telemetry</div>
        <div className="cc-muted">EPCP_DB not bound. No cost telemetry.</div>
      </GlassPanel>
    )
  }

  return (
    <GlassPanel padding="md">
      <div className="cc-card-title">Cost Telemetry</div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <MetricBadge label="Total" value={`$${costs.total.toFixed(2)}`} />
        <MetricBadge label="Period" value={`${costs.period_hours}h`} />
        <MetricBadge label="Line Items" value={`${costs.items.length}`} />
      </div>
      {costs.items.length === 0 ? (
        <div className="cc-muted">No cost items recorded.</div>
      ) : (
        <table className="cc-table">
          <thead>
            <tr>
              <th>Service</th>
              <th>Operation</th>
              <th>Qty</th>
              <th>Cost</th>
            </tr>
          </thead>
          <tbody>
            {costs.items.map((item, i) => (
              <tr key={`${item.service}-${item.operation}-${i}`}>
                <td className="cc-mono">{item.service}</td>
                <td>{item.operation}</td>
                <td className="cc-mono">{item.qty}</td>
                <td className="cc-mono">${item.cost.toFixed(4)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </GlassPanel>
  )
}

export { CostsPanel }
