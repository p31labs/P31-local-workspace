import { useState } from 'react';
import { K4Graph } from '@p31/quantum-core/k4';

const VERTEX_COLORS = ['#00F0FF', '#A78BFA', '#FBBF24', '#34D399'];
const EDGE_COLORS = ['#6EE7B7', '#FCD34D', '#6EE7B7', '#D8B4FE', '#A7F3D0', '#FDE68A'];
const VERTEX_LABELS = ['Apex', 'Nonprofit', 'Workspace', 'Companion'];

export interface K4MeshProps {
  spoons?: number;
  vertexHealth?: number[];
}

export function K4Mesh({ spoons = 5, vertexHealth: externalHealth }: K4MeshProps) {
  const [graph] = useState(() => new K4Graph());
  const [health] = useState<number[]>(
    externalHealth || graph.vertices.map((_, i) => 0.7 + (i / 4) * 0.3)
  );

  const isComplete = graph.isComplete();
  const isPlanar = graph.isPlanar();
  const maxwell = graph.edgeCount === 3 * graph.vertexCount - 6;

  return (
    <div className="glass-card p-6 rounded-xl">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>K₄ Tetrahedral Mesh</h3>
        <div
          style={{
            display: 'flex',
            gap: 12,
            fontSize: 10,
            fontFamily: 'monospace',
            color: 'rgba(255,255,255,0.3)',
          }}
        >
          <span>V={graph.vertexCount}</span>
          <span>E={graph.edgeCount}</span>
          <span>{isComplete ? 'K₄ ✓' : 'K₄ ✗'}</span>
          <span>{maxwell ? 'Rigid ✓' : 'Rigid ✗'}</span>
        </div>
      </div>

      <div style={{ position: 'relative', aspectRatio: '1', maxWidth: 360, margin: '0 auto' }}>
        {graph.edges.map((edge, i) => {
          const angle1 = ((edge.source - 1) / 4) * 2 * Math.PI - Math.PI / 2;
          const angle2 = ((edge.target - 1) / 4) * 2 * Math.PI - Math.PI / 2;
          const r = 0.85;
          const x1 = 0.5 + r * 0.5 * Math.cos(angle1);
          const y1 = 0.5 + r * 0.5 * Math.sin(angle1);
          const x2 = 0.5 + r * 0.5 * Math.cos(angle2);
          const y2 = 0.5 + r * 0.5 * Math.sin(angle2);
          const avgHealth = ((health[edge.source - 1] ?? 1) + (health[edge.target - 1] ?? 1)) / 2;

          return (
            <div
              key={i}
              className="k4-edge"
              style={{
                position: 'absolute',
                top: `${Math.min(y1, y2) * 100}%`,
                left: `${Math.min(x1, x2) * 100}%`,
                width: `${Math.hypot(x2 - x1, y2 - y1) * 100}%`,
                height: `${2 + 4 * avgHealth}px`,
                transform: `rotate(${Math.atan2(y2 - y1, x2 - x1)}rad)`,
                transformOrigin: '0 0',
                background: EDGE_COLORS[i % EDGE_COLORS.length],
                opacity: 0.3 + 0.5 * avgHealth,
                borderRadius: 2,
                transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />
          );
        })}

        {graph.vertices.map((v, i) => {
          const angle = (i / 4) * 2 * Math.PI - Math.PI / 2;
          const r = 0.85;
          const x = 0.5 + r * 0.5 * Math.cos(angle);
          const y = 0.5 + r * 0.5 * Math.sin(angle);
          const h = health[i] ?? 1;

          return (
            <div
              key={v.id}
              className="k4-node"
              style={{
                position: 'absolute',
                top: `${y * 100 - 3}%`,
                left: `${x * 100 - 3}%`,
                width: `${6 + 12 * h}px`,
                height: `${6 + 12 * h}px`,
                borderRadius: '50%',
                background: VERTEX_COLORS[i % VERTEX_COLORS.length],
                boxShadow: `0 0 ${20 + 30 * h}px ${VERTEX_COLORS[i % VERTEX_COLORS.length]}40`,
                transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: 'translate(-50%, -50%)',
                cursor: 'pointer',
              }}
              title={`${VERTEX_LABELS[i]}\nHealth: ${(h * 100).toFixed(0)}%`}
            >
              <span style={{ fontSize: 8, color: 'white', fontWeight: 600, fontFamily: 'monospace' }}>
                {v.id}
              </span>
            </div>
          );
        })}
      </div>

      <div
        style={{
          marginTop: 16,
          fontSize: 10,
          fontFamily: 'monospace',
          color: 'rgba(255,255,255,0.3)',
          textAlign: 'center',
        }}
      >
        {isComplete && isPlanar && maxwell
          ? '✦ K₄ Complete Graph — Isostatically Rigid (E = 3V - 6 = 6)'
          : '⚠ K₄ graph incomplete'}
        <span style={{ marginLeft: 12 }}>&middot; 863 Hz</span>
      </div>
    </div>
  );
}
