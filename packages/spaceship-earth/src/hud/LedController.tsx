import { useEffect } from 'react';
import { useShipStore } from '../store/shipStore';
import type { LedMode } from '../store/shipStore';
import { getNeoPixelBridge } from '../services/neoPixelBridge';

const MODES: LedMode[] = ['rainbow', 'chase', 'solid', 'breath', 'gradient', 'dual-chase', 'off'];

const MODE_USES_PALETTE: Record<LedMode, number> = {
  rainbow: 0,
  chase: 0,
  solid: 0,
  breath: 0,
  gradient: 2,
  'dual-chase': 2,
  off: 0,
};

const MODE_INFO: Record<LedMode, string> = {
  rainbow: 'Full-spectrum wave',
  chase: 'Uses primary color (trail)',
  solid: 'Uses primary color',
  breath: 'Uses primary color',
  gradient: `Uses Color 1 → Color 2`,
  'dual-chase': `Uses Color 1 + Color 2`,
  off: 'Frame off',
};

export default function LedController() {
  const ledMode = useShipStore((s) => s.ledMode);
  const ledSpeed = useShipStore((s) => s.ledSpeed);
  const ledColor = useShipStore((s) => s.ledColor);
  const ledBrightness = useShipStore((s) => s.ledBrightness);
  const ledColors = useShipStore((s) => s.ledColors);
  const ledCollapsed = useShipStore((s) => s.ledCollapsed);
  const setLedMode = useShipStore((s) => s.setLedMode);
  const setLedSpeed = useShipStore((s) => s.setLedSpeed);
  const setLedColor = useShipStore((s) => s.setLedColor);
  const setLedBrightness = useShipStore((s) => s.setLedBrightness);
  const setLedColors = useShipStore((s) => s.setLedColors);
  const setLedCollapsed = useShipStore((s) => s.setLedCollapsed);

  useEffect(() => {
    const bridge = getNeoPixelBridge();
    bridge.setHardwareMode(import.meta.env.VITE_HARDWARE_LED === 'true');
  }, []);

  const handleSetMode = (mode: LedMode) => {
    setLedMode(mode);
    getNeoPixelBridge().setMode(mode);
  };

  const handleSetSpeed = (speed: number) => {
    setLedSpeed(speed);
    getNeoPixelBridge().setSpeed(speed);
  };

  const handleSetColor = (color: string) => {
    setLedColor(color);
    getNeoPixelBridge().setColor(color);
  };

  const handleSetBrightness = (brightness: number) => {
    setLedBrightness(brightness);
    getNeoPixelBridge().setBrightness(brightness);
  };

  const paletteSlots = MODE_USES_PALETTE[ledMode];
  const toggleCollapse = () => setLedCollapsed(!ledCollapsed);

  if (ledCollapsed) {
    return (
      <div
        onClick={toggleCollapse}
        data-testid="led-controller"
        data-collapsed="true"
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          padding: '8px 14px',
          borderRadius: 30,
          border: '1px solid rgba(255,255,255,0.08)',
          color: '#d8d6d0',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
          zIndex: 100,
          pointerEvents: 'auto',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <span style={{ color: '#22d3ee' }}>NeoPixel</span>
        <span style={{ color: '#667788' }}>·</span>
        <span>{ledMode}</span>
        <span style={{ color: '#667788' }}>·</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: ledColor }} />
          <span style={{ fontSize: 10, color: '#8899aa' }}>{ledBrightness}%</span>
        </span>
        <span style={{ fontSize: 14, opacity: 0.4, marginLeft: 2 }}>◂</span>
      </div>
    );
  }

  return (
    <div
      data-testid="led-controller"
      data-collapsed="false"
      style={{
      position: 'fixed',
      bottom: 20,
      right: 20,
      background: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      padding: '14px 16px',
      borderRadius: '12px',
      border: '1px solid rgba(255,255,255,0.08)',
      color: '#d8d6d0',
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 11,
      zIndex: 100,
      pointerEvents: 'auto',
      minWidth: 260,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <strong style={{ fontSize: 12 }}>NeoPixel Controller</strong>
        <button
          onClick={toggleCollapse}
          aria-label="Collapse NeoPixel controller"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#8899aa',
            borderRadius: 5,
            padding: '2px 8px',
            cursor: 'pointer',
            fontSize: 12,
          }}
        >▾</button>
      </div>

      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
        {MODES.map((mode) => (
          <button
            key={mode}
            onClick={() => handleSetMode(mode)}
            style={{
              background: ledMode === mode ? '#22d3ee' : 'rgba(255,255,255,0.05)',
              color: ledMode === mode ? '#05070a' : '#8899aa',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 5,
              padding: '3px 8px',
              cursor: 'pointer',
              textTransform: 'uppercase',
              fontSize: 9,
              fontWeight: ledMode === mode ? 700 : 400,
              letterSpacing: '0.5px',
            }}
          >
            {mode}
          </button>
        ))}
      </div>

      <div style={{ marginBottom: 10 }}>
        <label style={{ display: 'block', fontSize: 9, textTransform: 'uppercase', color: '#8899aa', marginBottom: 3 }}>
          Primary Color
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input
            type="color"
            value={ledColor}
            onChange={(e) => handleSetColor(e.target.value)}
            style={{
              width: 28,
              height: 28,
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 5,
              cursor: 'pointer',
              background: 'transparent',
              padding: 0,
            }}
          />
          <span style={{ fontSize: 9, color: '#8899aa' }}>{ledColor}</span>
        </div>
      </div>

      {paletteSlots > 0 && (
        <div style={{ marginBottom: 10 }}>
          <label style={{ display: 'block', fontSize: 9, textTransform: 'uppercase', color: '#8899aa', marginBottom: 3 }}>
            Palette Colors
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            {Array.from({ length: paletteSlots }).map((_, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <input
                  type="color"
                  value={ledColors[idx] ?? '#000000'}
                  onChange={(e) => {
                    const next = [...ledColors];
                    next[idx] = e.target.value;
                    setLedColors(next);
                  }}
                  style={{
                    width: 24,
                    height: 24,
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 5,
                    cursor: 'pointer',
                    background: 'transparent',
                    padding: 0,
                  }}
                />
                <span style={{ fontSize: 8, color: '#667788' }}>C{idx + 1}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 9, textTransform: 'uppercase', color: '#8899aa', minWidth: 42 }}>Speed</label>
          <input
            type="range"
            min="0"
            max="10"
            value={ledSpeed}
            onChange={(e) => handleSetSpeed(Number(e.target.value))}
            style={{ flex: 1, accentColor: '#22d3ee', height: 4 }}
          />
          <span style={{ fontSize: 9, color: '#8899aa', minWidth: 16, textAlign: 'right' }}>{ledSpeed}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 9, textTransform: 'uppercase', color: '#8899aa', minWidth: 42 }}>Bright</label>
          <input
            type="range"
            min="0"
            max="100"
            value={ledBrightness}
            onChange={(e) => handleSetBrightness(Number(e.target.value))}
            style={{ flex: 1, accentColor: '#f59e0b', height: 4 }}
          />
          <span style={{ fontSize: 9, color: '#8899aa', minWidth: 16, textAlign: 'right' }}>{ledBrightness}%</span>
        </div>
      </div>

      <div style={{ fontSize: 9, color: '#556677', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 6 }}>
        {MODE_INFO[ledMode]}
      </div>
    </div>
  );
}
