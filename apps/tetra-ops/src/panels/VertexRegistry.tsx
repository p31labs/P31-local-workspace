import { useState } from 'react';
import type { Vertex } from '../lib/mapTopology';

const ACCENT_VAR: Record<Vertex['accent'], string> = {
  gold: 'var(--p31-accent-gold)',
  cyan: 'var(--p31-accent)',
  violet: 'var(--p31-accent-violet)',
  green: 'var(--p31-accent-green)',
};

export function VertexRegistry({ vertices, onSelect }: { vertices: Vertex[]; onSelect: (id: number | null) => void }) {
  const [openDetail, setOpenDetail] = useState<number | null>(null);

  const toggle = (id: number) => {
    const next = openDetail === id ? null : id;
    setOpenDetail(next);
    onSelect(next);
  };

  return (
    <div className="tetra-left">
      <div className="tetra-pi">
        <div className="tetra-label">Vertex Registry</div>
        {vertices.map((v) => (
          <button key={v.id} className={`vbtn ${openDetail === v.id ? 'active' : ''}`} onClick={() => toggle(v.id)} aria-expanded={openDetail === v.id}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span className="dot" style={{ background: ACCENT_VAR[v.accent], boxShadow: `0 0 7px ${ACCENT_VAR[v.accent]}` }} />
                <span className="font-mono" style={{ fontSize: 9, color: ACCENT_VAR[v.accent], letterSpacing: '0.1em' }}>V{v.id}</span>
              </div>
              <span className={`chip ${v.alive ? 'text-green' : 'text-red'}`} style={{ background: v.alive ? 'rgba(52,211,153,.1)' : 'rgba(251,113,133,.1)', border: `1px solid ${v.alive ? 'rgba(52,211,153,.2)' : 'rgba(251,113,133,.2)'}` }}>
                {v.alive ? '● live' : '○ down'}
              </span>
            </div>
            <div style={{ fontWeight: 700, fontSize: 12 }}>{v.host}</div>
            <div className="text-muted" style={{ fontSize: 10, marginTop: 2 }}>{v.role}</div>
          </button>
        ))}

        {openDetail !== null && (() => {
          const v = vertices.find((x) => x.id === openDetail);
          if (!v) return null;
          return (
            <div className="fade-up" style={{ padding: '8px 11px', borderRadius: 'var(--p31-radius-lg)', background: 'rgba(255,255,255,.016)', border: '1px solid var(--p31-glass-border)' }}>
              <div style={{ color: ACCENT_VAR[v.accent], fontWeight: 700, fontSize: 11, marginBottom: 4 }}>{v.role}</div>
              <div className="text-muted" style={{ fontSize: 10, lineHeight: 1.65 }}>Vertex V{v.id} in the K₄ tetrahedral mesh. Edges: {v.edges.join(', ')}.</div>
              <a href={`https://${v.host}`} target="_blank" rel="noopener" className="font-mono" style={{ fontSize: 10, color: ACCENT_VAR[v.accent], textDecoration: 'none', display: 'inline-block', marginTop: 6 }}>
                ↗ {v.host}
              </a>
            </div>
          );
        })()}

        <div style={{ marginTop: 'auto' }}>
          <div className="div" style={{ marginBottom: 7 }} />
          <div style={{ padding: 9, borderRadius: 'var(--p31-radius-lg)', background: 'rgba(255,255,255,.016)', border: '1px solid var(--p31-glass-border)' }}>
            <div className="tetra-label" style={{ paddingBottom: 3 }}>Sierpinski Invariant</div>
            <div style={{ fontSize: 10, color: 'var(--p31-text-tertiary)', lineHeight: 1.65 }}>
              Each vertex Vᵢ contains the full ecosystem 𝒯 in miniature. Self-similar at every scale.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
