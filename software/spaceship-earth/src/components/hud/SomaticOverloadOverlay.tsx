// src/components/hud/SomaticOverloadOverlay.tsx
import { useSovereignStore } from '../../sovereign/useSovereignStore';

export function SomaticOverloadOverlay() {
  const fawnGuardActive = useSovereignStore((s) => s.fawnGuardActive);

  if (!fawnGuardActive) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.88)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: "var(--font-data)", textAlign: 'center', padding: 24,
      pointerEvents: 'auto',
    }}>
      <div style={{
        color: 'var(--amber)', fontSize: 16, fontWeight: 700,
        letterSpacing: '0.1em', lineHeight: 1.6,
        textShadow: '0 0 20px var(--neon-dim)',
      }}>
        SOMATIC OVERLOAD DETECTED
      </div>
      <div style={{
        color: 'var(--amber)', fontSize: 12, marginTop: 12, opacity: 0.7,
        letterSpacing: '0.05em',
      }}>
        COMMUNICATION PROTOCOLS LOCKED FOR 180s
      </div>
      <div style={{
        marginTop: 24, width: 60, height: 60, borderRadius: '50%',
        border: '3px solid var(--amber)',
        boxShadow: '0 0 30px var(--neon-dim), inset 0 0 20px var(--neon-ghost)',
        animation: 'thermalPulse 1.5s ease-in-out infinite',
      }} />
    </div>
  );
}
