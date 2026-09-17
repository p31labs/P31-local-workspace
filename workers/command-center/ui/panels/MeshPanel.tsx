import { GlassPanel, MetricBadge } from '@p31/design-core/compositions'
import type { MeshState } from '../types'

interface MeshPanelProps {
  mesh: MeshState
}

export default function MeshPanel({ mesh }: MeshPanelProps) {
  const rigidityDisplay =
    mesh.vertices > 2
      ? (mesh.edges / (3 * mesh.vertices - 6)).toFixed(3)
      : '0.000'

  return (
    <GlassPanel padding="md">
      <div className="cc-card-title">K₄ Mesh</div>
      <div className="cc-grid" style={{ marginBottom: 16 }}>
        <MetricBadge label="Vertices" value={`${mesh.vertices}`} />
        <MetricBadge label="Edges" value={`${mesh.edges}`} />
        <MetricBadge label="LOVE Total" value={`${mesh.love}`} />
        <MetricBadge label="Rigidity" value={rigidityDisplay} />
        <div>
          <div className="cc-muted" style={{ fontSize: 11, marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Isostatic
          </div>
          <span className={`cc-chip ${mesh.isostatic ? 'cc-chip--ok' : 'cc-chip--bad'}`}>
            {mesh.isostatic ? 'yes' : 'no'}
          </span>
        </div>
      </div>
      {mesh.edgesList.length === 0 ? (
        <div className="cc-muted">No edges in mesh.</div>
      ) : (
        <table className="cc-table">
          <thead>
            <tr>
              <th>Edge</th>
              <th>Weight</th>
            </tr>
          </thead>
          <tbody>
            {mesh.edgesList.map((edge, i) => (
              <tr key={`${edge.a}-${edge.b}-${i}`}>
                <td className="cc-mono">
                  {edge.a} &rarr; {edge.b}
                </td>
                <td className="cc-mono">{edge.weight}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </GlassPanel>
  )
}

export { MeshPanel }
