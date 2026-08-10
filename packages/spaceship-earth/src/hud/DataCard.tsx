import { useState, useRef, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useShipStore } from '../store/shipStore';
import { VERTICES } from '@p31/shared';
import { DOME_VERTICES, assignNodeVertices } from '../math/domeMap';
import type { Axis } from '../math/domeMap';

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

  const { camera, size, scene } = useThree();
  const screenPos = useRef({ x: 0, y: 0 });
  const nodeVisible = useRef(false);
  const domeGroupRef = useRef<THREE.Group>(null);
  const [nodeScreenPos, setNodeScreenPos] = useState({ x: 0, y: 0 });

  const axisCounts = useMemo(() => {
    const counts: Record<string, number> = { Body: 0, Mesh: 0, Forge: 0, Shield: 0 };
    for (const v of VERTICES) {
      counts[v.axis] = (counts[v.axis] || 0) + 1;
    }
    return counts;
  }, []);

  const nodePositions = useMemo(() => {
    const vertexIndices = assignNodeVertices(axisCounts as Record<Axis, number>);
    return VERTICES.slice(0, 58).map((node, i) => {
      const vi = vertexIndices[i] ?? 0;
      return new THREE.Vector3(...DOME_VERTICES[vi]);
    });
  }, [axisCounts]);

  useEffect(() => {
    scene.traverse((obj) => {
      if (obj instanceof THREE.Group && obj.name === 'outer-dome') {
        domeGroupRef.current = obj;
      }
    });
  }, [scene]);

  useFrame(() => {
    if (selectedNode === null || !domeGroupRef.current) {
      nodeVisible.current = false;
      return;
    }

    const localPos = nodePositions[selectedNode];
    if (!localPos) return;

    const worldPos = localPos.clone();
    domeGroupRef.current.localToWorld(worldPos);

    const projected = worldPos.clone().project(camera);
    const x = (projected.x * 0.5 + 0.5) * size.width;
    const y = (-projected.y * 0.5 + 0.5) * size.height;

    nodeVisible.current = projected.z < 1;
    screenPos.current = { x, y };
    setNodeScreenPos({ x, y });
  });

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
  if (selectedNode !== null && nodeVisible.current) {
    const node = VERTICES[selectedNode];
    if (!node) return null;

    const cardLeft = nodeScreenPos.x + 20;
    const cardTop = nodeScreenPos.y - 40;

    return (
      <div style={{ ...cardStyle, left: cardLeft, top: cardTop, right: 'auto' }}>
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
        <div style={{ marginTop: 8, color: '#66ccff', fontSize: 10 }}>
          Coherence {(coherence * 100).toFixed(0)}%
        </div>
        <div style={{ color: '#f59e0b', fontSize: 10 }}>
          Spoons {useShipStore.getState().spoons}/5
        </div>
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
