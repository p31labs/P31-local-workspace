import { useShipStore } from '../store/shipStore';

const PANEL: React.CSSProperties = {
  position: 'fixed',
  top: 20,
  right: 20,
  width: 240,
  marginTop: 122,
  background: 'rgba(0,0,0,0.85)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  padding: '12px 16px',
  borderRadius: '12px',
  border: '1px solid rgba(255,255,255,0.08)',
  color: '#d8d6d0',
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 11,
  zIndex: 90,
  pointerEvents: 'auto',
};

export default function SystemBoard() {
  const spoons = useShipStore((s) => s.spoons);
  const coherence = useShipStore((s) => s.coherence);
  const didKey = useShipStore((s) => s.didKey);

  const spoonDots = Array.from({ length: 5 }, (_, i) => (i < spoons ? '●' : '○')).join('');
  const meshOnline = coherence > 0.4;

  const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 9, textTransform: 'uppercase', color: '#8899aa' }}>{label}</span>
      {children}
    </div>
  );

  return (
    <div style={PANEL} data-testid="system-board">
      <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '1px', color: '#c97b52', fontWeight: 700, marginBottom: 8 }}>
        System · Health
      </div>

      <Row label="Coherence">
        <span style={{ fontSize: 12, fontWeight: 700, color: '#22d3ee' }}>{(coherence * 100).toFixed(0)}%</span>
      </Row>
      <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, margin: '6px 0 8px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.min(100, coherence * 100)}%`, background: 'linear-gradient(90deg, #22d3ee, #8fae83)', borderRadius: 2, transition: 'width 500ms ease' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Row label="Spoons">
          <span style={{ fontSize: 12, fontWeight: 700, color: '#e0b968' }}>
            <span style={{ letterSpacing: 2 }}>{spoonDots}</span> {spoons}/5
          </span>
        </Row>
        <Row label="Mesh">
          <span style={{ fontSize: 12, fontWeight: 700, color: meshOnline ? '#8fae83' : '#f87171' }}>
            ● {meshOnline ? 'connected' : 'offline'}
          </span>
        </Row>
        <Row label="Identity">
          <span style={{ fontSize: 12, fontWeight: 700, color: didKey ? '#8fae83' : '#8899aa' }}>
            {didKey ? '✓ active' : 'pending'}
          </span>
        </Row>
      </div>
    </div>
  );
}
