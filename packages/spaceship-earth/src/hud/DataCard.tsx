import { useState } from 'react';
import { useShipStore } from '../store/shipStore';
import { VERTICES } from '@p31/shared';

const AXIS_TYPES = ['family', 'system', 'care', 'shield'] as const;
const AXIS_COLORS: Record<string, string> = {
  family: '#ff9944',
  system: '#44aaff',
  care: '#44ffaa',
  shield: '#ff4466',
};

export default function DataCard() {
  const selectedNode = useShipStore((s) => s.selectedNode);
  const selectedPort = useShipStore((s) => s.selectedPort);
  const dockRecords = useShipStore((s) => s.dockRecords);
  const dockedPorts = useShipStore((s) => s.dockedPorts);
  const coherence = useShipStore((s) => s.coherence);
  const dockMemberAt = useShipStore((s) => s.dockMemberAt);
  const undockMember = useShipStore((s) => s.undockMember);
  const nextDemoMember = useShipStore((s) => s.nextDemoMember);
  const setSelectedPort = useShipStore((s) => s.setSelectedPort);
  const [dockAxis, setDockAxis] = useState<string>('family');

  // ── Port Mode ──
  if (selectedPort !== null) {
    const portRecord = dockRecords.find((r) => r.portIndex === selectedPort);
    const isOccupied = dockedPorts.includes(selectedPort);

    const handleDock = () => {
      const member = nextDemoMember();
      dockMemberAt(selectedPort, member.id, dockAxis as any);
    };

    const handleUndock = () => {
      undockMember(selectedPort);
      setSelectedPort(null);
    };

    return (
      <div style={portCardStyle}>
        <div style={headerStyle('Port')}>
          Port {selectedPort}
          <span style={{ fontSize: 9, color: isOccupied ? '#f59e0b' : '#44ffaa', marginLeft: 8 }}>
            {isOccupied ? 'OCCUPIED' : 'VACANT'}
          </span>
        </div>

        {isOccupied && portRecord && (
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 13, color: AXIS_COLORS[portRecord.axis], fontWeight: 700 }}>
              {portRecord.memberId}
            </div>
            <div style={{ fontSize: 9, color: '#6a7a8a', marginTop: 2 }}>
              Axis: {portRecord.axis} · Docked {new Date(portRecord.dockTime).toLocaleDateString()}
            </div>
            {portRecord.systemProbabilities && (
              <div style={{ marginTop: 4, fontSize: 9, color: '#8899aa' }}>
                Coh {((portRecord.systemProbabilities.coherence ?? 0) * 100).toFixed(0)}% ·
                Eng {((portRecord.systemProbabilities.engagement ?? 0) * 100).toFixed(0)}%
              </div>
            )}
          </div>
        )}

        {!isOccupied && (
          <div>
            <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
              {AXIS_TYPES.map((a) => (
                <button
                  key={a}
                  onClick={() => setDockAxis(a)}
                  style={{
                    background: dockAxis === a ? AXIS_COLORS[a] : 'rgba(255,255,255,0.05)',
                    color: dockAxis === a ? '#05070a' : '#8899aa',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 5, padding: '3px 8px', cursor: 'pointer',
                    fontSize: 9, fontWeight: dockAxis === a ? 700 : 400,
                  }}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ fontSize: 9, color: '#6a7a8a', marginBottom: 6 }}>
          Dock usage: {dockedPorts.length} / 120 · Coh {((coherence ?? 0) * 100).toFixed(0)}%
        </div>

        {isOccupied ? (
          <button onClick={handleUndock} style={actionBtn('#ff4466')}>Undock</button>
        ) : (
          <button onClick={handleDock} style={actionBtn('#22d3ee')}>Dock Demo Member</button>
        )}

        <button onClick={() => setSelectedPort(null)} style={closeBtn}>✕</button>
      </div>
    );
  }

  // ── Node Mode ──
  if (selectedNode !== null) {
    const node = VERTICES[selectedNode];
    if (!node) return null;

    return (
      <div style={cardStyle}>
        <div style={headerStyle('Node')}>
          Node
        </div>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2, color: AXIS_COLORS[node.axis] || '#22d3ee' }}>
          {node.label}
        </div>
        <div style={{ fontSize: 9, color: '#6a7a8a', marginBottom: 4 }}>
          {node.id}
        </div>
        <div style={{ fontSize: 10, color: AXIS_COLORS[node.axis] }}>
          Axis: {node.axis} · State: {node.state}
        </div>
        {node.notes && (
          <div style={{ fontSize: 9, color: '#8899aa', marginTop: 4 }}>
            {node.notes}
          </div>
        )}
      </div>
    );
  }

  return null;
}

const portCardStyle: React.CSSProperties = {
  position: 'fixed',
  top: 80,
  left: 20,
  background: 'rgba(6,10,18,0.88)',
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 12,
  padding: '14px 18px',
  color: '#e0e4ec',
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 11,
  minWidth: 200,
  maxWidth: 260,
  pointerEvents: 'auto',
  boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
  zIndex: 100,
};

const cardStyle: React.CSSProperties = {
  position: 'fixed',
  top: 80,
  right: 20,
  background: 'rgba(6,10,18,0.88)',
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 12,
  padding: '14px 18px',
  color: '#e0e4ec',
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 11,
  minWidth: 200,
  maxWidth: 260,
  pointerEvents: 'auto',
  boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
  zIndex: 100,
};

function headerStyle(label: string): React.CSSProperties {
  return {
    fontSize: 9,
    color: '#6a7a8a',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };
}

function actionBtn(color: string): React.CSSProperties {
  return {
    background: color,
    color: '#05070a',
    border: 'none',
    borderRadius: 6,
    padding: '6px 12px',
    cursor: 'pointer',
    fontSize: 10,
    fontWeight: 700,
    fontFamily: "'JetBrains Mono', monospace",
  };
}

const closeBtn: React.CSSProperties = {
  position: 'absolute',
  top: 8,
  right: 10,
  background: 'none',
  border: 'none',
  color: '#667788',
  cursor: 'pointer',
  fontSize: 12,
};
