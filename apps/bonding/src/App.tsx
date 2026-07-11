import { useState } from 'react';

export function BondingApp() {
  const [spoons, setSpoons] = useState(3);

  return (
    <div data-spoons={spoons} style={{
      minHeight: '100vh', background: '#0a0e14', color: '#e2e8f0',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8, color: '#00F0FF' }}>Bonding</h1>
      <p style={{ fontSize: 14, color: '#999', marginBottom: 24 }}>
        Molecule-building chemistry game for neurodivergent children
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
        {[0, 1, 2, 3, 4, 5].map(s => (
          <button key={s} onClick={() => setSpoons(s)} style={{
            padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: spoons === s ? '#00F0FF' : 'rgba(255,255,255,0.06)',
            color: spoons === s ? '#0a0e14' : '#e2e8f0',
            fontWeight: spoons === s ? 600 : 400, fontSize: 13,
          }}>
            {s}
          </button>
        ))}
      </div>

      <div style={{
        width: 200, height: 200, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,240,255,0.2) 0%, transparent 70%)',
        border: '2px solid rgba(0,240,255,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 48, marginBottom: 24,
        animation: spoons >= 2 ? 'pulse 2s ease-in-out infinite' : 'none',
      }}>
        ⚗️
      </div>

      <p style={{ fontSize: 12, color: '#666' }}>
        Spoons: {spoons} — {spoons <= 1 ? 'Motion disabled' : 'Active'}
      </p>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}
