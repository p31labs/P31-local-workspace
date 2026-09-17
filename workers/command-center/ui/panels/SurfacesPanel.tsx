import { GlassPanel, MetricBadge } from '@p31/design-core/compositions'
import type { Surface } from '../types'

interface SurfacesPanelProps {
  surfaces: Surface[]
}

export default function SurfacesPanel({ surfaces }: SurfacesPanelProps) {
  const okCount = surfaces.filter((s) => s.ok).length

  return (
    <GlassPanel padding="md">
      <div className="cc-card-title">Surface Monitor</div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <MetricBadge label="Healthy" value={`${okCount}`} />
        <MetricBadge label="Total" value={`${surfaces.length}`} />
      </div>
      {surfaces.length === 0 ? (
        <div className="cc-muted">No surfaces registered.</div>
      ) : (
        <table className="cc-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>URL</th>
              <th>Code</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {surfaces.map((s) => (
              <tr key={s.name}>
                <td className="cc-mono">{s.name}</td>
                <td>
                  <a href={s.url} className="cc-link" target="_blank" rel="noopener noreferrer">
                    {s.url}
                  </a>
                </td>
                <td className="cc-mono">{s.code}</td>
                <td>
                  <span className={`cc-chip ${s.ok ? 'cc-chip--ok' : 'cc-chip--bad'}`}>
                    {s.ok ? 'ok' : 'fail'}
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

export { SurfacesPanel }
