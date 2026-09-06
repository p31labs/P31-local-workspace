import { useMemo } from 'react';
import { HOUSE_NEURO_MAP } from '@p31/quantum-core/cosmic';

export function CosmicMap() {
  const houses = useMemo(() => HOUSE_NEURO_MAP, []);

  return (
    <div className="glass-panel p-6 rounded-2xl" data-quantum="cosmic">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <span style={{ fontSize: 12, fontFamily: 'monospace', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>
          COSMIC MAP &middot; 12 HOUSES &middot; NEUROBEHAVIORAL
        </span>
      </div>

      <div
        className="tetra-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: '0.333rem',
        }}
      >
        {houses.map((h) => (
          <div
            key={h.house}
            className="glass-subtle p-3 rounded-xl"
            style={{
              borderLeft: `3px solid ${h.color}`,
              transition: 'all 0.2s',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 10, fontFamily: 'monospace', color: h.color }}>
                House {h.house}
              </span>
              <span style={{ fontSize: 9, fontFamily: 'monospace', color: 'rgba(255,255,255,0.2)' }}>
                {h.element}
              </span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'white', marginTop: 2 }}>
              {h.label}
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
              {h.neuroSystem}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 12,
          fontSize: 9,
          fontFamily: 'monospace',
          color: 'rgba(255,255,255,0.15)',
          textAlign: 'center',
        }}
      >
        ⚠️ Archetypal mapping — not peer-reviewed neuroscience
      </div>
    </div>
  );
}
