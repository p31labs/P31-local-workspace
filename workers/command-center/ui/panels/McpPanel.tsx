import { GlassPanel, MetricBadge } from '@p31/design-core/compositions'
import type { McpState } from '../types'

interface McpPanelProps {
  mcp: McpState
}

export default function McpPanel({ mcp }: McpPanelProps) {
  const okCount = mcp.endpoints.filter((e) => e.ok).length

  return (
    <GlassPanel padding="md">
      <div className="cc-card-title">MCP / Reach</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16 }}>
        <div>
          <span className="cc-secondary">Name: </span>
          <span className="cc-mono">{mcp.name}</span>
        </div>
        <div>
          <span className="cc-secondary">Version: </span>
          <span className="cc-mono">{mcp.version}</span>
        </div>
        <div>
          <span className="cc-secondary">Registry: </span>
          <a
            href={mcp.registry_url}
            className="cc-link cc-mono"
            target="_blank"
            rel="noopener noreferrer"
          >
            {mcp.registry_url}
          </a>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <MetricBadge label="Endpoints" value={`${mcp.endpoints.length}`} />
        <MetricBadge label="Healthy" value={`${okCount}`} />
      </div>
      {mcp.endpoints.length === 0 ? (
        <div className="cc-muted">No MCP endpoints registered.</div>
      ) : (
        <table className="cc-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>URL</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {mcp.endpoints.map((ep) => (
              <tr key={ep.name}>
                <td className="cc-mono">{ep.name}</td>
                <td>
                  <a href={ep.url} className="cc-link" target="_blank" rel="noopener noreferrer">
                    {ep.url}
                  </a>
                </td>
                <td>
                  <span className={`cc-chip ${ep.ok ? 'cc-chip--ok' : 'cc-chip--bad'}`}>
                    {ep.ok ? 'ok' : 'fail'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </GlassPanel>
  )
}

export { McpPanel }
