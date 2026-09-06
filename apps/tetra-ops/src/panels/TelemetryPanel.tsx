import type { DashboardData, Vertex } from '../lib/mapTopology';

const ACCENT_VAR: Record<Vertex['accent'], string> = {
  gold: 'var(--p31-accent-gold)',
  cyan: 'var(--p31-accent)',
  violet: 'var(--p31-accent-violet)',
  green: 'var(--p31-accent-green)',
};

function metricColor(value: number, good: number, warn: number): string {
  return value <= good ? 'var(--p31-accent-green)' : value <= warn ? 'var(--p31-accent-gold)' : 'var(--p31-accent-red)';
}

export function TelemetryPanel({ data, status }: { data: DashboardData | null; status: string }) {
  const stats = data?.stats;
  const degraded = status === 'degraded';

  const tiles: { label: string; value: string; color?: string }[] = [
    { label: 'Vertices', value: String(stats?.vertices ?? 4), color: 'var(--p31-text-primary)' },
    { label: 'Edges', value: String(stats?.edges ?? 6), color: 'var(--p31-text-primary)' },
    { label: 'Rigidity', value: stats?.rigid ? 'Rigid ✓' : '—', color: 'var(--p31-accent-green)' },
    { label: 'Status', value: degraded ? 'DEGRADED' : 'LIVE', color: degraded ? 'var(--p31-accent-gold)' : 'var(--p31-accent-green)' },
  ];

  return (
    <div data-mcp-tool="telemetryPanel" data-mcp-state="idle">
      <div className="tetra-label">Live Telemetry</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
        {tiles.map((t) => (
          <div key={t.label} className="tmetric">
            <span className="label">{t.label}</span>
            <span className="value" style={{ color: t.color }}>{t.value}</span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {data?.vertices.map((v) => {
          const m = v.metrics;
          return (
            <div key={v.id} className="trow" style={{ background: 'rgba(255,255,255,.02)', borderColor: 'var(--p31-glass-border)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="dot" style={{ background: ACCENT_VAR[v.accent], boxShadow: `0 0 7px ${ACCENT_VAR[v.accent]}` }} />
                <span className="font-mono" style={{ fontSize: 9, color: ACCENT_VAR[v.accent] }}>V{v.id}</span>
              </span>
              <span style={{ display: 'flex', gap: 9, fontFamily: 'var(--p31-font-mono)', fontSize: 9 }}>
                <span style={{ color: v.alive ? 'var(--p31-accent-green)' : 'var(--p31-accent-red)' }}>{v.alive ? 'live' : 'down'}</span>
                {m ? (
                  <>
                    <span style={{ color: metricColor(m.latency, 80, 200) }}>{m.latency}ms</span>
                    <span style={{ color: metricColor(100 - m.cache, 1, 5) }}>{m.cache}%</span>
                    <span style={{ color: 'var(--p31-text-tertiary)' }}>{m.cpu}ms</span>
                  </>
                ) : (
                  <span style={{ color: 'var(--p31-text-tertiary)' }}>—</span>
                )}
              </span>
            </div>
          );
        })}
      </div>

      {stats?.gatheredAt && (
        <div className="font-mono text-dim" style={{ fontSize: 8, marginTop: 4 }}>
          gathered {new Date(stats.gatheredAt).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}
