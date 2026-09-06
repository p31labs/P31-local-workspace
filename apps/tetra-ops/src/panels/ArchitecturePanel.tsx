import { useTelemetryStore } from '../state/telemetryStore';

const ITEMS: { label: string; value: string; color: string }[] = [
  { label: 'Cloudflare Cache', value: 'Zero-CPU ✓', color: 'var(--p31-accent-green)' },
  { label: 'React Compiler', value: "'all' mode ✓", color: 'var(--p31-accent)' },
  { label: 'Vite 8 + Rolldown', value: '8× faster ✓', color: 'var(--p31-accent-violet)' },
  { label: 'ML-DSA-65 (PQC)', value: 'Active ✓', color: 'var(--p31-accent-gold)' },
  { label: 'InstancedMesh', value: '2 draw calls ✓', color: 'var(--p31-accent-green)' },
  { label: 'SIMD128 (WASM)', value: 'Enabled ✓', color: 'var(--p31-accent)' },
];

export function ArchitecturePanel() {
  const source = useTelemetryStore((s) => s.source);
  const setSource = useTelemetryStore((s) => s.setSource);

  return (
    <div data-mcp-tool="architecturePanel" data-mcp-state={source}>
      <div className="tetra-label">Architecture Telemetry</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {ITEMS.map((item) => (
          <div key={item.label} className="trow" style={{ background: 'rgba(255,255,255,.02)', borderColor: 'var(--p31-glass-border)' }}>
            <span className="text-muted">{item.label}</span>
            <span className="font-mono" style={{ fontSize: 10, color: item.color }}>{item.value}</span>
          </div>
        ))}
      </div>

      <div className="tetra-label" style={{ paddingTop: 9 }}>Telemetry Source</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
        <button
          onClick={() => setSource('mock')}
          aria-pressed={source === 'mock'}
          data-mcp-tool="setArchSource"
          data-mcp-target="arch-source-mock"
          data-mcp-state={source === 'mock' ? 'active' : 'inactive'}
          className="abtn"
          style={{ minHeight: 40, borderColor: source === 'mock' ? 'rgba(0,240,255,.28)' : 'var(--p31-glass-border)', background: source === 'mock' ? 'rgba(0,240,255,.08)' : 'transparent', color: source === 'mock' ? 'var(--p31-accent)' : 'var(--p31-text-secondary)' }}
        >
          Mock
        </button>
        <button
          onClick={() => setSource('real')}
          aria-pressed={source === 'real'}
          data-mcp-tool="setArchSource"
          data-mcp-target="arch-source-real"
          data-mcp-state={source === 'real' ? 'active' : 'inactive'}
          className="abtn"
          style={{ minHeight: 40, borderColor: source === 'real' ? 'rgba(167,139,250,.28)' : 'var(--p31-glass-border)', background: source === 'real' ? 'rgba(167,139,250,.08)' : 'transparent', color: source === 'real' ? 'var(--p31-accent-violet)' : 'var(--p31-text-secondary)' }}
        >
          Real
        </button>
      </div>
    </div>
  );
}
