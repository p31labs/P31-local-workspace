/**
 * @file StarControls — DevMenu panel: starfield config sliders + burst buttons.
 */

import { useStarfieldStore } from '../state/starfieldStore';

interface StarControlsProps {
  onBurst?: (color: string) => void;
}

export function StarControls({ onBurst }: StarControlsProps) {
  const cfg = useStarfieldStore();

  const slider = (label: string, value: number, min: number, max: number, step: number, setter: (n: number) => void, unit = '') => (
    <div key={label} style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'rgba(240,242,245,0.3)', marginBottom: 2 }}>
        <span>{label}</span>
        <span style={{ fontFamily: 'var(--p31-font-mono, monospace)' }}>{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => setter(Number(e.target.value))} style={{ width: '100%', accentColor: '#00f0ff' }} />
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: 11 }}>
      <div style={{ fontSize: 9, color: 'rgba(240,242,245,0.3)', letterSpacing: '0.08em', marginBottom: 4, textTransform: 'uppercase' }}>Starfield Config</div>

      {slider('Count',        cfg.starCount,  20, 200, 1, cfg.setStarCount)}
      {slider('Speed',        cfg.speed,      0.02, 0.5, 0.01, cfg.setSpeed)}
      {slider('Connect',      cfg.connRadius, 0, 200, 5, cfg.setConnRadius, 'px')}
      {slider('Teal Glow',    cfg.tealGlow,   0, 0.1, 0.005, cfg.setTealGlow)}
      {slider('Coral Glow',   cfg.coralGlow,  0, 0.1, 0.005, cfg.setCoralGlow)}
      {slider('Base Alpha',   cfg.baseAlpha,  0.02, 0.8, 0.01, cfg.setBaseAlpha)}
      {slider('Brightness',   cfg.brightness, 0.1, 2, 0.05, cfg.setBrightness, 'x')}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 9, color: 'rgba(240,242,245,0.3)' }}>Twinkle</span>
        <button
          onClick={() => cfg.setTwinkle(!cfg.twinkle)}
          style={{
            padding: '3px 10px', borderRadius: 4,
            border: `1px solid ${cfg.twinkle ? 'rgba(0,240,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
            background: cfg.twinkle ? 'rgba(0,240,255,0.12)' : 'transparent',
            color: cfg.twinkle ? '#00f0ff' : 'rgba(240,242,245,0.4)',
            fontSize: 9, cursor: 'pointer',
          }}
        >
          {cfg.twinkle ? 'ON' : 'OFF'}
        </button>
      </div>

      <div style={{ fontSize: 9, color: 'rgba(240,242,245,0.3)', letterSpacing: '0.08em', marginBottom: 4, textTransform: 'uppercase' }}>Burst Test</div>
      <div style={{ display: 'flex', gap: 4 }}>
        {['coral', 'gold', 'phosphor', 'cyan'].map(c => (
          <button
            key={c}
            onClick={() => onBurst?.(c)}
            style={{
              flex: 1, padding: '5px 0', borderRadius: 4,
              border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)',
              color: 'rgba(240,242,245,0.5)', fontSize: 9, cursor: 'pointer',
            }}
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}

export default StarControls;
