import { useState } from 'react'
import { GlassPanel, MetricBadge, StatusBadge, Button } from '@p31/design-core/compositions'
import type { FleetNode, NodeStatus } from '../types'

const STATUS_MAP: Record<NodeStatus, 'online' | 'offline' | 'busy'> = {
  online: 'online',
  degraded: 'busy',
  offline: 'offline',
}

interface FleetPanelProps {
  fleet: FleetNode[]
  canControl: boolean
  onQuarantine: (name: string) => void
  onRollback: (name: string) => void
}

export default function FleetPanel({
  fleet,
  canControl,
  onQuarantine,
  onRollback,
}: FleetPanelProps) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const onlineCount = fleet.filter((n) => n.status === 'online').length

  function handleQuarantine(name: string) {
    if (window.confirm(`Quarantine node "${name}"?`)) {
      onQuarantine(name)
    }
  }

  function handleRollback(name: string) {
    if (window.confirm(`Rollback node "${name}"?`)) {
      onRollback(name)
    }
  }

  return (
    <GlassPanel padding="md">
      <div className="cc-card-title">Fleet Matrix</div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <MetricBadge label="Online" value={`${onlineCount}`} />
        <MetricBadge label="Total" value={`${fleet.length}`} />
      </div>
      {fleet.length === 0 ? (
        <div className="cc-muted">No fleet nodes reported.</div>
      ) : (
        fleet.map((node) => (
          <div key={node.name}>
            <div
              className="cc-row cc-row--click"
              onClick={() => setExpanded(expanded === node.name ? null : node.name)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setExpanded(expanded === node.name ? null : node.name)
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                <StatusBadge status={STATUS_MAP[node.status]} label={node.status} />
                <span className="cc-mono">{node.name}</span>
                {node.group ? (
                  <span className="cc-secondary">{node.group}</span>
                ) : null}
              </div>
            </div>
            {expanded === node.name && (
              <div style={{ padding: '8px 0 12px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div>
                  <span className="cc-secondary">Endpoint: </span>
                  <a href={node.url} className="cc-link cc-mono" target="_blank" rel="noopener noreferrer">
                    {node.url}
                  </a>
                </div>
                {node.latency_ms != null && (
                  <div>
                    <span className="cc-secondary">Latency: </span>
                    <span className="cc-mono">{node.latency_ms}ms</span>
                  </div>
                )}
                {canControl && (
                  <div className="cc-actions">
                    <Button onClick={() => handleQuarantine(node.name)}>Quarantine</Button>
                    <Button onClick={() => handleRollback(node.name)}>Rollback</Button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))
      )}
    </GlassPanel>
  )
}

export { FleetPanel }
