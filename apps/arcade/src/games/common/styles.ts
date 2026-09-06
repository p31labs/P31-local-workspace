import React from 'react';

export function glassStyle(extra: React.CSSProperties = {}): React.CSSProperties {
  return {
    background: 'rgba(255,255,255,0.04)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    boxShadow: '0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12, padding: '12px 16px', ...extra,
  };
}

export function btnStyle(disabled?: boolean, accent = '#00F0FF'): React.CSSProperties {
  return {
    padding: '8px 16px', borderRadius: 8, border: 'none', cursor: disabled ? 'default' : 'pointer',
    background: disabled ? '#1a1a1a' : accent, color: disabled ? '#555' : '#0A0A0F',
    fontSize: 13, fontWeight: 600, fontFamily: 'monospace', opacity: disabled ? 0.5 : 1,
    boxShadow: disabled ? undefined : `0 2px 12px ${accent}40`,
  };
}

export function btnGhost(disabled?: boolean): React.CSSProperties {
  return {
    padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)',
    cursor: disabled ? 'default' : 'pointer', background: 'transparent',
    color: disabled ? '#444' : 'rgba(255,255,255,0.7)',
    fontSize: 13, fontFamily: 'monospace', opacity: disabled ? 0.5 : 1,
  };
}
