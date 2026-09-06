import type { Edge, Vertex } from '../lib/mapTopology';

const ACCENT_VAR: Record<'gold' | 'cyan' | 'violet' | 'green', string> = {
  gold: 'var(--p31-accent-gold)',
  cyan: 'var(--p31-accent)',
  violet: 'var(--p31-accent-violet)',
  green: 'var(--p31-accent-green)',
};

const HEALTH_COLOR = {
  up: 'var(--p31-accent-green)',
  partial: 'var(--p31-accent-gold)',
  down: 'var(--p31-accent-red)',
} as const;

type Health = keyof typeof HEALTH_COLOR;

function edgeHealth(e: Edge, byId: Map<number, Vertex>): Health {
  const a = byId.get(e.from)?.alive;
  const b = byId.get(e.to)?.alive;
  if (a && b) return 'up';
  if (a || b) return 'partial';
  return 'down';
}

export function EdgeRegistry({ edges, vertices }: { edges: Edge[]; vertices: Vertex[] }) {
  const byId = new Map(vertices.map((v) => [v.id, v]));
  return (
    <div>
      <div className="tetra-label">Edge Registry (6/6)</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {edges.map((e) => {
          const h = edgeHealth(e, byId);
          return (
            <div key={e.id} className="epill">
              <span className="dot" style={{ background: HEALTH_COLOR[h], boxShadow: `0 0 6px ${HEALTH_COLOR[h]}` }} />
              <span>{e.id}</span>
              <span style={{ color: ACCENT_VAR[vertexAccent(e.from)] }}>V{e.from}</span>
              <span style={{ color: 'var(--p31-text-tertiary)' }}>↔</span>
              <span style={{ color: ACCENT_VAR[vertexAccent(e.to)] }}>V{e.to}</span>
              <span className="text-dim" style={{ marginLeft: 4 }}>{e.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function vertexAccent(v: number): 'gold' | 'cyan' | 'violet' | 'green' {
  return v === 1 ? 'gold' : v === 2 ? 'cyan' : v === 3 ? 'violet' : 'green';
}
