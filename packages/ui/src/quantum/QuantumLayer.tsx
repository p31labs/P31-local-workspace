import { SICMeasurement } from './SICMeasurement';
import { K4Mesh } from './K4Mesh';
import { TetrahedronGrid } from './TetrahedronGrid';

export interface QuantumLayerProps {
  simplified?: boolean;
  linkBase?: string;
  children?: React.ReactNode;
}

const CARDS = [
  {
    id: 'quantum', label: 'V\u2081 \u00b7 |\u03c8\u2081\u27e9', title: 'Quantum Core',
    desc: 'SIC-POVM \u00b7 K\u2084 \u00b7 Posner', color: 'var(--p31-quantum-cyan)',
    href: '/quantum/'
  },
  {
    id: 'care', label: 'V\u2082 \u00b7 |\u03c8\u2082\u27e9', title: 'Care Economy',
    desc: 'LOVE \u00b7 Mesh \u00b7 DP', color: 'var(--p31-quantum-violet)',
    href: '/care/'
  },
  {
    id: 'passport', label: 'V\u2083 \u00b7 |\u03c8\u2083\u27e9', title: 'Passport',
    desc: 'DID \u00b7 EUDI \u00b7 SD-JWT', color: 'var(--p31-quantum-gold)',
    href: '/passport/'
  },
  {
    id: 'mesh', label: 'V\u2084 \u00b7 |\u03c8\u2084\u27e9', title: 'Sovereign Mesh',
    desc: 'K\u2084 \u00b7 P2P \u00b7 Federation', color: 'var(--p31-quantum-green)',
    href: '/mesh/'
  },
];

export function QuantumLayer({ simplified = false, linkBase, children }: QuantumLayerProps) {
  return (
    <div
      style={{
        padding: '2rem 1.5rem 1.5rem',
        maxWidth: '80rem',
        margin: '0 auto',
        width: '100%',
      }}
    >
      <TetrahedronGrid cols={4} gap="0.333rem">
        {CARDS.map((card) => {
          const href = linkBase ? `${linkBase}${card.href}` : card.href;
          return (
            <a
              key={card.id}
              href={href}
              target={linkBase ? '_blank' : undefined}
              rel={linkBase ? 'noopener noreferrer' : undefined}
              className="glass-card p-4 rounded-xl no-underline link-glow hover:border-white/15 transition-all block"
              style={{ borderTop: `2px solid ${card.color}` }}
            >
              <div style={{ fontSize: 10, fontFamily: 'monospace', color: card.color, letterSpacing: '0.1em' }}>
                {card.label}
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'white', marginTop: 4 }}>
                {card.title}
              </h3>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                {card.desc}
              </p>
            </a>
          );
        })}
      </TetrahedronGrid>

      {children}

      {!simplified && (
        <div className="glass-panel p-4 rounded-2xl" style={{ marginTop: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 10, fontFamily: 'monospace', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>
              SIC-POVM MEASUREMENT \u00b7 d=2 \u00b7 4 STATES
            </span>
            <span style={{ fontSize: 9, fontFamily: 'monospace', color: 'rgba(255,255,255,0.15)' }}>
              overlap = 1/3 \u00b7 Tr(\u03c1\u03a0\u1d62)
            </span>
          </div>
          <SICMeasurement />
        </div>
      )}

      <div className="glass-panel p-4 rounded-2xl" style={{ marginTop: '1rem' }}>
        <K4Mesh spoons={5} />
      </div>

      <div className="glass-panel p-4 rounded-2xl text-center" style={{ marginTop: '1rem' }}>
        <div
          className="resonance-pulse"
          style={{ display: 'inline-block', padding: '4px 16px', borderRadius: 20, border: '1px solid rgba(0,240,255,0.15)' }}
        >
          <span style={{ fontSize: 24, fontWeight: 800, background: 'linear-gradient(135deg, #00F0FF, #A78BFA, #34D399)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
            863 Hz
          </span>
          <span style={{ fontSize: 12, fontFamily: 'monospace', color: 'rgba(255,255,255,0.3)', marginLeft: 8 }}>
            Larmor Somatic Regulation
          </span>
        </div>
        <div style={{ fontSize: 10, fontFamily: 'monospace', color: 'rgba(255,255,255,0.15)', marginTop: 4 }}>
          K\u2084 is planar \u00b7 \u03b2\u2082 = 1 \u00b7 The cage holds
        </div>
      </div>

      <div
        className="honest-label"
        style={{
          marginTop: 16, fontSize: 9, fontFamily: 'monospace', color: 'rgba(255,255,255,0.15)',
          textAlign: 'center', padding: '8px 0', borderTop: '1px solid rgba(255,255,255,0.04)'
        }}
      >
        \u26a0\ufe0f HONEST LABEL: SIC-POVM quantum layer is a computational model \u2014 not established physics.
        This code is an architectural metaphor made literal for sovereign care measurement.
      </div>
    </div>
  );
}
