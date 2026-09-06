import { useSpoonStore } from '../state/spoonStore';
import { useTelemetryStore } from '../state/telemetryStore';

export function Header() {
  const spoons = useSpoonStore((s) => s.spoons);
  const cycleSpoons = useSpoonStore((s) => s.cycleSpoons);
  const vertices = useTelemetryStore((s) => s.data?.vertices ?? []);
  const online = vertices.filter((v) => v.alive).length;
  const total = vertices.length || 4;
  const meshColor = online === total ? 'var(--p31-accent-green)' : online > 0 ? 'var(--p31-accent-gold)' : 'var(--p31-accent-red)';

  return (
    <header className="tetra-hdr glass-strong ui-chrome" style={{ borderRadius: 0, borderBottom: '1px solid var(--p31-glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 var(--p31-spacing-lg)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: 'var(--p31-radius-md)', background: 'linear-gradient(135deg, var(--p31-accent-gold), var(--p31-accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: '#000', boxShadow: 'var(--p31-glow-cyan)' }}>⬦</div>
        <span style={{ fontWeight: 800, fontSize: 14, letterSpacing: '0.08em' }}>
          P31&nbsp;<span style={{ color: 'var(--p31-accent)' }}>TETRA</span>
        </span>
        <span className="font-mono" style={{ fontSize: 9, letterSpacing: '0.14em', color: 'var(--p31-text-tertiary)' }}>// GOD‑VIEW</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontFamily: 'var(--p31-font-mono)', fontSize: 10 }}>
        <span style={{ color: 'var(--p31-text-tertiary)' }}>β₂ = 1</span>
        <span style={{ color: 'var(--p31-accent)' }}>863 Hz</span>
        <span style={{ color: 'var(--p31-accent-green)' }}>K₄ planar</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: meshColor }}>
          <span className="dot" style={{ background: meshColor, boxShadow: `0 0 7px ${meshColor}` }} />
          {online}/{total} online
        </span>
        <button
          onClick={cycleSpoons}
          aria-label={`Spoon level ${spoons} of 5, activate to change`}
          className="abtn"
          style={{ minHeight: 36, padding: '0 10px', gap: 5 }}
        >
          <i className={`fa-solid ${spoons === 0 ? 'fa-triangle-exclamation' : 'fa-bolt'}`} style={{ fontSize: 9, color: spoons === 0 ? 'var(--p31-accent-red)' : 'var(--p31-accent)' }} />
          <span style={{ color: 'var(--p31-text-primary)' }}>{spoons}</span>
          <span style={{ color: 'var(--p31-text-tertiary)' }}>/5</span>
        </button>
        <button
          onClick={() => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen())}
          aria-label="Toggle fullscreen"
          className="abtn"
          style={{ minHeight: 36, padding: '0 10px' }}
        >
          ⛶
        </button>
      </div>
    </header>
  );
}
