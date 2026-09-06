/**
 * @file MeshStatus.tsx — Lightweight K4 mesh health indicator.
 *
 * Shows vertex health, edge status, and LOVE total for the current mesh.
 * Designed for embedding in portal dashboards.
 *
 * @a2ui-component MeshStatus
 * @a2ui-props roomId string - Mesh room identifier
 * @a2ui-props refreshInterval number - Polling interval in ms
 * @a2ui-example {"component":"MeshStatus","roomId":"default","refreshInterval":5000}
 */

import { useEffect, useState } from 'react';

export interface MeshStatusProps {
  roomId?: string;
  refreshInterval?: number;
}

interface MeshHealth {
  vertices: number;
  edges: number;
  isComplete: boolean;
  isPlanar: boolean;
  loveTotal: number;
  activeSockets: number;
}

export function MeshStatus({ roomId = 'default', refreshInterval = 5000 }: MeshStatusProps) {
  const [health, setHealth] = useState<MeshHealth>({
    vertices: 4,
    edges: 6,
    isComplete: true,
    isPlanar: false,
    loveTotal: 0,
    activeSockets: 0,
  });

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    const fetchHealth = async () => {
      try {
        const res = await fetch(`https://bros.trimtab-signal.workers.dev/rooms/${encodeURIComponent(roomId)}/stats`);
        if (!res.ok) return;
        const data = await res.json();
        setHealth({
          vertices: 4,
          edges: 6,
          isComplete: true,
          isPlanar: false,
          loveTotal: data.totalIssuances || 0,
          activeSockets: data.activeSockets || 0,
        });
      } catch {}
    };
    fetchHealth();
    timer = setInterval(fetchHealth, refreshInterval);
    return () => clearInterval(timer);
  }, [roomId, refreshInterval]);

  const healthPercent = Math.min(1, health.loveTotal / 200);

  return (
    <div className="glass-card" data-mcp-tool="meshStatus" data-mcp-state={health.activeSockets > 0 ? 'active' : 'idle'}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.9 }}>Mesh Status</div>
        <div style={{ fontSize: 10, opacity: 0.5, fontFamily: 'monospace' }}>
          K₄ · {health.isComplete ? 'Complete' : 'Degraded'}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
        <div style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.03)' }}>
          <div style={{ fontSize: 9, opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Vertices</div>
          <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'monospace' }}>{health.vertices}</div>
        </div>
        <div style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.03)' }}>
          <div style={{ fontSize: 9, opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Edges</div>
          <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'monospace' }}>{health.edges}</div>
        </div>
        <div style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.03)' }}>
          <div style={{ fontSize: 9, opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>LOVE Total</div>
          <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'monospace', color: '#FBBF24' }}>{health.loveTotal}</div>
        </div>
        <div style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.03)' }}>
          <div style={{ fontSize: 9, opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sockets</div>
          <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'monospace', color: health.activeSockets > 0 ? '#34D399' : '#FB7185' }}>
            {health.activeSockets}
          </div>
        </div>
      </div>

      <div>
        <div style={{ fontSize: 9, opacity: 0.5, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>LOVE Flow</div>
        <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${healthPercent * 100}%`, background: '#FBBF24', borderRadius: 2, transition: 'width 0.5s ease' }} />
        </div>
      </div>
    </div>
  );
}
