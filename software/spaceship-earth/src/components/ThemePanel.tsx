/**
 * @file ThemePanel — Skin switcher + dynamic accent color picker.
 *
 * Mounted inside BridgeOverlay. Shows 4 preset skins as swatches and a
 * native color picker for real-time accent overrides. All changes persist
 * to localStorage via useSovereignStore.setAccentColor / setSkinTheme.
 *
 * Three.js sync: accentColor in the store is read by ImmersiveCockpit's
 * RAF loop each frame and applied to Jitterbug node/edge colors.
 */

import { useShallow } from 'zustand/shallow';
import { useSovereignStore } from '../sovereign/useSovereignStore';
import type { SkinTheme } from '../sovereign/types';

interface SkinDef {
  id: SkinTheme;
  label: string;
  accent: string;
  desc: string;
}

const SKINS: SkinDef[] = [
  { id: 'OPERATOR', label: 'Operator',  accent: '#22d3ee', desc: 'Neon cyan — default' },
  { id: 'KIDS',     label: 'Solar',     accent: '#E9C46A', desc: 'Warm amber tones' },
  { id: 'GRAY_ROCK', label: 'Gray Rock', accent: '#64748B', desc: 'Low-stimulation mono' },
];

export function ThemePanel() {
  const { skinTheme, setSkinTheme, accentColor, setAccentColor } = useSovereignStore(
    useShallow(s => ({
      skinTheme:       s.skinTheme,
      setSkinTheme:    s.setSkinTheme,
      accentColor:     s.accentColor,
      setAccentColor:  s.setAccentColor,
    })),
  );

  const defaultAccent = SKINS.find(s => s.id === skinTheme)?.accent ?? '#00FFFF';

  return (
    <div style={{ padding: '20px 24px', fontFamily: 'var(--font-data)', color: 'var(--text)' }}>
      {/* ── Skin presets ── */}
      <div style={{ fontSize: 10, opacity: 0.45, letterSpacing: 2, marginBottom: 12 }}>
        SKIN PROFILE
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 24 }}>
        {SKINS.map(skin => {
          const active = skinTheme === skin.id;
          return (
            <button
              key={skin.id}
              type="button"
              onClick={() => setSkinTheme(skin.id)}
              aria-pressed={active}
              style={{
                background: active ? `color-mix(in srgb, ${skin.accent} 10%, transparent)` : 'var(--s2)',
                border: `1px solid ${active ? skin.accent : 'var(--dim2)'}`,
                borderRadius: 8,
                padding: '10px 12px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'border-color var(--trans-base), background var(--trans-base)',
              }}
            >
              <div style={{
                width: 12, height: 12, borderRadius: '50%',
                background: skin.accent,
                boxShadow: `0 0 6px ${skin.accent}`,
                marginBottom: 6,
              }} />
              <div style={{ color: active ? skin.accent : 'var(--text)', fontSize: 11, fontWeight: 600, marginBottom: 2 }}>
                {skin.label}
              </div>
              <div style={{ color: 'var(--dim)', fontSize: 9 }}>{skin.desc}</div>
            </button>
          );
        })}
      </div>

      {/* ── Dynamic accent ── */}
      <div style={{ fontSize: 10, opacity: 0.45, letterSpacing: 2, marginBottom: 12 }}>
        ACCENT COLOR
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <input
          type="color"
          value={accentColor}
          onChange={e => setAccentColor(e.target.value)}
          aria-label="Primary accent color"
          style={{
            width: 44, height: 44, border: '1px solid var(--dim2)',
            borderRadius: 8, cursor: 'pointer', background: 'none', padding: 2,
          }}
        />
        <div>
          <div style={{ color: 'var(--neon)', fontSize: 13, letterSpacing: 1 }}>
            {accentColor.toUpperCase()}
          </div>
          <div style={{ color: 'var(--dim)', fontSize: 9, marginTop: 2 }}>
            Updates live · applied to UI + 3D materials
          </div>
        </div>
        <button
          type="button"
          onClick={() => setAccentColor(defaultAccent)}
          aria-label="Reset accent to skin default"
          style={{
            marginLeft: 'auto', background: 'none',
            border: '1px solid var(--dim2)', borderRadius: 4,
            color: 'var(--dim)', fontSize: 10, padding: '5px 10px', cursor: 'pointer',
          }}
        >
          reset
        </button>
      </div>

      {/* ── Import/Export ── */}
      <div style={{ fontSize: 10, opacity: 0.45, letterSpacing: 2, marginTop: 24, marginBottom: 12 }}>
        THEME DATA
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(JSON.stringify({ skin: skinTheme, accent: accentColor }));
              alert('Theme copied to clipboard');
            } catch {
              alert('Failed to copy');
            }
          }}
          style={{
            background: 'var(--s2)', border: '1px solid var(--dim2)',
            borderRadius: 4, color: 'var(--text)', fontSize: 10,
            padding: '6px 12px', cursor: 'pointer',
          }}
        >
          Copy Theme
        </button>
        <button
          type="button"
          onClick={async () => {
            try {
              const text = await navigator.clipboard.readText();
              const parsed = JSON.parse(text);
              if (parsed.skin && parsed.accent) {
                if (parsed.accent.match(/^#[0-9A-Fa-f]{6}$/)) {
                  setAccentColor(parsed.accent);
                  const validSkins = SKINS.map(s => s.id);
                  if (validSkins.includes(parsed.skin)) {
                    setSkinTheme(parsed.skin);
                    alert('Theme applied');
                  } else {
                    setSkinTheme('OPERATOR');
                    alert('Theme applied (skin was invalid, reset to default)');
                  }
                } else {
                  alert('Invalid accent color format');
                }
              } else {
                alert('Invalid theme format');
              }
            } catch {
              alert('Failed to read clipboard');
            }
          }}
          style={{
            background: 'var(--s2)', border: '1px solid var(--dim2)',
            borderRadius: 4, color: 'var(--text)', fontSize: 10,
            padding: '6px 12px', cursor: 'pointer',
          }}
        >
          Paste Theme
        </button>
      </div>
    </div>
  );
}
