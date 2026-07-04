import { useState, useEffect } from 'react';
import { useSovereignStore } from '../sovereign/useSovereignStore';
import type { SkinTheme } from '../sovereign/types';

const APPS = [
  { icon: '🔬', title: 'BONDING', path: 'bonding.html', status: 'live' },
  { icon: '🌐', title: 'Spaceship Earth', path: 'spaceship-earth.html', status: 'live' },
  { icon: '🌀', title: 'NANO-07 Attractor', path: 'attractor.html', status: 'live' },
  { icon: '🛡️', title: 'Fawn Guard Buffer', path: 'buffer.html', status: 'live' },
  { icon: '⚡', title: 'SIGNAL', path: 'signal.html', status: 'live' },
  { icon: '🔺', title: 'Quantum Family', path: 'quantum-family-about.html', status: 'live' },
  { icon: '🏥', title: 'Phenix OS', path: 'phenix.html', status: 'prototype' },
  { icon: '🌿', title: 'Simple Sovereignty', path: 'sovereignty.html', status: 'prototype' },
  { icon: '🦄', title: 'Mission Control', path: 'wonky.html', status: 'prototype' },
  { icon: '✨', title: 'Quantum Life OS', path: 'quantum-os.html', status: 'prototype' },
  { icon: '🕸️', title: 'Project Kenosis', path: 'kenosis.html', status: 'live' },
  { icon: '🧬', title: 'Posner Lab', path: 'posner.html', status: 'live' },
  { icon: '🔐', title: 'The Vault (OQE)', path: 'vault-room.html', status: 'live' },
] as const;

const SKINS: Array<{ id: SkinTheme; label: string; accent: string }> = [
  { id: 'OPERATOR', label: 'Operator', accent: '#22d3ee' },
  { id: 'KIDS', label: 'Solar', accent: '#E9C46A' },
  { id: 'GRAY_ROCK', label: 'Gray Rock', accent: '#64748B' },
];

const P31_LOGO = (
  <svg width="22" height="22" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <rect width="512" height="512" rx="112" fill="#25897d"/>
    <circle cx="390" cy="120" r="48" fill="#cc6247"/>
    <text x="256" y="340" fontFamily="system-ui" fontWeight="900" fontSize="220" fill="#d8d6d0" textAnchor="middle">P31</text>
    <rect x="156" y="380" width="200" height="16" rx="8" fill="#cda852"/>
  </svg>
);

export function P31Portal() {
  const [open, setOpen] = useState<boolean>(() => {
    try {
      return localStorage.getItem('p31-portal-open') === 'true';
    } catch {
      return false;
    }
  });

  const skinTheme = useSovereignStore(s => s.skinTheme);
  const setSkinTheme = useSovereignStore(s => s.setSkinTheme);

  useEffect(() => {
    try {
      localStorage.setItem('p31-portal-open', String(open));
    } catch {}
  }, [open]);

  const toggleButtonStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: 24,
    right: 24,
    zIndex: 9000,
    width: 52,
    height: 52,
    borderRadius: '50%',
    background: '#161920',
    border: '1.5px solid #25897d',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 16px rgba(0,0,0,0.5)',
    padding: 0,
  };

  const panelStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: 88,
    right: 24,
    width: 320,
    maxHeight: '80vh',
    overflowY: 'auto',
    zIndex: 9001,
    background: '#161920',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 24,
    display: open ? 'block' : 'none',
    boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={toggleButtonStyle}
        aria-label="P31 Portal"
        aria-expanded={open}
      >
        {P31_LOGO}
      </button>

      <div style={panelStyle} role="dialog" aria-label="P31 Portal">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <span style={{ color: '#d8d6d0', fontFamily: 'system-ui', fontWeight: 700, fontSize: 16, letterSpacing: 1 }}>
            P31 Labs
          </span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.45)',
              fontSize: 20,
              cursor: 'pointer',
              padding: '0 4px',
              lineHeight: 1,
            }}
            aria-label="Close portal"
          >
            ×
          </button>
        </div>

        {/* Skin selector */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 9, letterSpacing: 2, color: 'rgba(255,255,255,0.35)', marginBottom: 8, fontFamily: 'system-ui' }}>
            SKIN
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {SKINS.map(skin => {
              const active = skinTheme === skin.id;
              return (
                <button
                  key={skin.id}
                  type="button"
                  onClick={() => setSkinTheme(skin.id)}
                  aria-pressed={active}
                  style={{
                    flex: 1,
                    background: active ? `rgba(255,255,255,0.06)` : 'transparent',
                    border: `1px solid ${active ? skin.accent : 'rgba(255,255,255,0.12)'}`,
                    borderRadius: 6,
                    padding: '6px 4px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: skin.accent }} />
                  <span style={{ color: active ? skin.accent : 'rgba(255,255,255,0.55)', fontSize: 9, fontFamily: 'system-ui', fontWeight: 600 }}>
                    {skin.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* App grid */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 9, letterSpacing: 2, color: 'rgba(255,255,255,0.35)', marginBottom: 8, fontFamily: 'system-ui' }}>
            APPS
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {APPS.map(app => (
              <a
                key={app.path}
                href={`https://p31ca.org/${app.path}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8,
                  padding: '10px 10px 8px',
                  textDecoration: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 16 }}>{app.icon}</span>
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: app.status === 'live' ? '#3ba372' : '#cda852',
                      flexShrink: 0,
                    }}
                    title={app.status}
                  />
                </div>
                <span style={{
                  color: 'rgba(255,255,255,0.75)',
                  fontSize: 10,
                  fontFamily: 'system-ui',
                  fontWeight: 600,
                  lineHeight: 1.3,
                }}>
                  {app.title}
                </span>
              </a>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14, textAlign: 'center' }}>
          <a
            href="https://p31ca.org"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#25897d', fontSize: 11, fontFamily: 'system-ui', fontWeight: 600, textDecoration: 'none', letterSpacing: 0.5 }}
          >
            Open Hub →
          </a>
        </div>
      </div>
    </>
  );
}
