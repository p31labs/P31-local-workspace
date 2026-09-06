/**
 * @file SkinCatalog — Grid of installable skins with live preview (via @p31/skin-system).
 */

import { useState, useEffect } from 'react';
import { listSkins, applySkin, resetSkin, type SkinDefinition } from '@p31/skin-system';

export function SkinCatalog() {
  const [skins] = useState<SkinDefinition[]>(() => listSkins());
  const [applied, setApplied] = useState<string | null>(null);

  useEffect(() => {
    return () => { resetSkin(); };
  }, []);

  return (
    <div style={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: '#f0f2f5', margin: 0, flexShrink: 0 }}>Skins</h2>
      <div style={{ flex: 1, overflow: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10, alignContent: 'start' }}>
        {skins.map(skin => {
          const active = applied === skin.id;
          const accent = skin.tokenOverrides?.['--p31-accent'];
          return (
            <div key={skin.id} style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '14px', borderRadius: 12, border: `1px solid ${active ? 'rgba(0,240,255,0.3)' : 'rgba(255,255,255,0.06)'}`, background: active ? 'rgba(0,240,255,0.05)' : 'rgba(255,255,255,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: accent || '#00f0ff', boxShadow: `0 0 12px ${accent}40` }} />
                <span style={{ fontWeight: 600, fontSize: 13, color: '#f0f2f5' }}>{skin.name}</span>
              </div>
              <div style={{ fontSize: 11, color: 'rgba(240,242,245,0.4)', lineHeight: 1.5 }}>{skin.description}</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                <button onClick={() => { applySkin(skin.id); setApplied(skin.id); }} style={{ padding: '6px 14px', borderRadius: 8, border: `1px solid ${active ? 'rgba(0,240,255,0.4)' : 'rgba(255,255,255,0.12)'}`, background: active ? 'rgba(0,240,255,0.15)' : 'rgba(255,255,255,0.05)', color: active ? '#00f0ff' : 'rgba(240,242,245,0.6)', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>
                  {active ? 'Applied ✓' : 'Apply'}
                </button>
                {active && (
                  <button onClick={() => { resetSkin(); setApplied(null); }} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(251,113,133,0.2)', background: 'transparent', color: '#fb7185', fontSize: 11, cursor: 'pointer' }}>
                    Reset
                  </button>
                )}
              </div>
              <code style={{ fontSize: 10, color: 'rgba(52,211,153,0.5)', fontFamily: 'var(--p31-font-mono, monospace)' }}>pnpm add @p31/skin-{skin.id}</code>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default SkinCatalog;
