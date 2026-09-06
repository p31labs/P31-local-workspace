/**
 * @file ControlsPanel — DevMenu panel: spoons slider, scene toggle, skin apply.
 */

import { useState } from 'react';
import { useSpoonStore, type SceneKind } from '../state/spoonStore';
import { applySkin, resetSkin, listSkins } from '@p31/skin-system';

interface ControlsPanelProps {
  scene: SceneKind;
  setScene: (s: SceneKind) => void;
}

export function ControlsPanel({ scene, setScene }: ControlsPanelProps) {
  const spoons = useSpoonStore((s) => s.spoons);
  const setSpoons = useSpoonStore((s) => s.setSpoons);
  const [applied, setApplied] = useState<string | null>(null);

  const skins = listSkins();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 11 }}>
      {/* Spoons */}
      <div>
        <div style={{ fontSize: 9, color: 'rgba(240,242,245,0.3)', letterSpacing: '0.08em', marginBottom: 6, textTransform: 'uppercase' }}>Spoons</div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <input
            type="range"
            min={0}
            max={5}
            value={spoons}
            onChange={(e) => setSpoons(Number(e.target.value) as 0|1|2|3|4|5)}
            data-mcp-tool="setSpoonLevel"
            data-mcp-type="input"
            data-mcp-range="0,5"
            data-mcp-current={String(spoons)}
            style={{ flex: 1, accentColor: spoons <= 1 ? '#fb7185' : '#00f0ff' }}
          />
          <span style={{ fontFamily: 'var(--p31-font-mono, monospace)', fontSize: 13, fontWeight: 700, color: spoons <= 1 ? '#fb7185' : '#00f0ff', minWidth: 16, textAlign: 'center' }}>{spoons}</span>
        </div>
        <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
          {[0,1,2,3,4,5].map(n => (
            <button
              key={n}
              onClick={() => setSpoons(n as 0|1|2|3|4|5)}
              style={{
                flex: 1, padding: '4px 0', borderRadius: 4, border: `1px solid ${spoons === n ? (n <= 1 ? '#fb7185' : '#00f0ff') : 'rgba(255,255,255,0.08)'}`,
                background: spoons === n ? (n <= 1 ? 'rgba(251,113,133,0.15)' : 'rgba(0,240,255,0.1)') : 'transparent',
                color: spoons === n ? (n <= 1 ? '#fb7185' : '#00f0ff') : 'rgba(240,242,245,0.4)',
                fontSize: 10, cursor: 'pointer', fontWeight: spoons === n ? 600 : 400,
              }}
            >
              {n === 0 ? '!' : n}
            </button>
          ))}
        </div>
      </div>

      {/* Scene */}
      <div>
        <div style={{ fontSize: 9, color: 'rgba(240,242,245,0.3)', letterSpacing: '0.08em', marginBottom: 6, textTransform: 'uppercase' }}>Scene</div>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['tetra', 'posner', 'cradle'] as const).map(s => (
            <button
              key={s}
              onClick={() => setScene(s)}
              style={{
                flex: 1, padding: '5px 0', borderRadius: 6, border: `1px solid ${scene === s ? 'rgba(251,191,36,0.3)' : 'rgba(255,255,255,0.08)'}`,
                background: scene === s ? 'rgba(251,191,36,0.1)' : 'transparent',
                color: scene === s ? '#fbbf24' : 'rgba(240,242,245,0.4)',
                fontSize: 10, cursor: 'pointer',
              }}
            >
              {s === 'tetra' ? 'K₄' : s === 'posner' ? 'Posner' : '🌌'}
            </button>
          ))}
        </div>
      </div>

      {/* Skins */}
      <div>
        <div style={{ fontSize: 9, color: 'rgba(240,242,245,0.3)', letterSpacing: '0.08em', marginBottom: 6, textTransform: 'uppercase' }}>Skin Preview</div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {skins.map(s => {
            const active = applied === s.id;
            const accent = s.tokenOverrides?.['--p31-accent'];
            return (
              <button
                key={s.id}
                onClick={() => {
                  if (active) { resetSkin(); setApplied(null); }
                  else { applySkin(s.id); setApplied(s.id); }
                }}
                style={{
                  padding: '4px 10px', borderRadius: 6, border: `1px solid ${active ? accent : 'rgba(255,255,255,0.08)'}`,
                  background: active ? `${accent}18` : 'transparent',
                  color: active ? accent : 'rgba(240,242,245,0.4)',
                  fontSize: 10, cursor: 'pointer', fontWeight: active ? 600 : 400,
                }}
              >
                {s.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ControlsPanel;
