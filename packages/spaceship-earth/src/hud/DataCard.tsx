import { useState } from 'react';
import { useShipStore } from '../store/shipStore';
import { useActiveVertexData } from '../store/datasetStore';
import A2DataCard from '@p31/design-core/a2ui/DataCard';

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
  const spoons = useShipStore((s) => s.spoons);
  const nodeScreenPos = useShipStore((s) => s.nodeScreenPos);
  const nodeVisible = useShipStore((s) => s.nodeVisible);
  const dockMemberAt = useShipStore((s) => s.dockMemberAt);
  const undockMember = useShipStore((s) => s.undockMember);
  const demoMode = useShipStore((s) => s.demoMode);
  const nextDemoMember = useShipStore((s) => s.nextDemoMember);
  const setSelectedPort = useShipStore((s) => s.setSelectedPort);
  const setSelectedNode = useShipStore((s) => s.setSelectedNode);
  const vertexData = useActiveVertexData();
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

    const status = isOccupied
      ? { label: 'OCCUPIED', state: 'warning' as const }
      : { label: 'VACANT', state: 'online' as const };

    const metrics = [
      ...(isOccupied && portRecord ? [
        { label: 'Member', value: portRecord.memberId, color: AXIS_COLORS[portRecord.axis] },
        { label: 'Axis', value: portRecord.axis },
        { label: 'Docked', value: new Date(portRecord.dockTime).toLocaleDateString() },
        ...(portRecord.systemProbabilities ? [
          { label: 'Coherence', value: `${((portRecord.systemProbabilities.coherence ?? 0) * 100).toFixed(0)}%` },
          { label: 'Engagement', value: `${((portRecord.systemProbabilities.engagement ?? 0) * 100).toFixed(0)}%` },
        ] : []),
      ] : [
        { label: 'Dock usage', value: `${dockedPorts.length} / 120` },
        { label: 'Coherence', value: `${((coherence ?? 0) * 100).toFixed(0)}%` },
      ]),
    ];

    return (
      <A2DataCard
        title={`Port ${selectedPort}`}
        variant="port"
        status={status}
        metrics={metrics}
        actions={isOccupied ? [
          { label: 'Undock', onClick: handleUndock, variant: 'danger' },
        ] : demoMode ? [
          { label: 'Dock Demo Member', onClick: handleDock, variant: 'primary' },
        ] : []}
        onClose={() => setSelectedPort(null)}
      >
        {!isOccupied && demoMode && (
          <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
            {AXIS_TYPES.map((a) => (
              <button
                key={a}
                onClick={() => setDockAxis(a)}
                style={{
                  background: dockAxis === a ? AXIS_COLORS[a] : 'rgba(255,255,255,0.05)',
                  color: dockAxis === a ? '#05070a' : '#8899aa',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 5,
                  padding: '3px 8px',
                  cursor: 'pointer',
                  fontSize: 9,
                  fontWeight: dockAxis === a ? 700 : 400,
                }}
              >
                {a}
              </button>
            ))}
          </div>
        )}
      </A2DataCard>
    );
  }

  // ── Node Mode ──
  if (selectedNode !== null && nodeVisible) {
    // Same filtered index as GraphNodes renders (value !== null placeholders skipped).
    const active = vertexData.filter((v) => v.value !== null);
    const node = active[selectedNode];
    if (!node) return null;

    const cardLeft = Math.min(nodeScreenPos.x + 20, window.innerWidth - 280);
    const cardTop = Math.max(nodeScreenPos.y - 40, 60);

    return (
      <A2DataCard
        title={node.label}
        subtitle={`${node.id ?? node.vertexIndex} · ${node.category ?? 'node'} · vertex ${node.vertexIndex}`}
        variant="node"
        metrics={[
          { label: 'Coherence', value: `${((coherence ?? 0) * 100).toFixed(0)}%`, color: node.color },
          { label: 'Spoons', value: `${spoons}/5` },
        ]}
        onClose={() => setSelectedNode(null)}
      />
    );
  }

  return null;
}
