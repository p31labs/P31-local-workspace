import { useShipStore } from '../store/shipStore';

const PANEL: React.CSSProperties = {
  position: 'fixed',
  top: 20,
  right: 20,
  width: 240,
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

export default function DunaBoard() {
  const members = useShipStore((s) => s.memberCount);
  const target = useShipStore((s) => s.dunaTarget);
  const active = useShipStore((s) => s.dockedPorts.length);

  const pct = Math.min(100, (members / Math.max(1, target)) * 100);

  return (
    <div style={PANEL} data-testid="duna-board">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '1px', color: '#e0b968', fontWeight: 700 }}>DUNA · 8.08</span>
        <span style={{ fontSize: 9, color: '#667788' }}>docking</span>
      </div>

      <div style={{ fontSize: 26, fontWeight: 800, color: '#e0b968', lineHeight: 1 }}>
        {members}
        <span style={{ fontSize: 11, color: '#8899aa', fontWeight: 400 }}> / {target}</span>
      </div>

      <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, margin: '8px 0 6px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #e0b968, #22d3ee)', borderRadius: 2, transition: 'width 500ms ease' }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#8899aa' }}>
        <span>{active} active ships</span>
        <span>{Math.max(0, target - members)} to launch</span>
      </div>

      {members >= target && (
        <div style={{ fontSize: 9, color: '#8fae83', fontWeight: 700, marginTop: 4 }}>Ready for launch</div>
      )}
    </div>
  );
}
