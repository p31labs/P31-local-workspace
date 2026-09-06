/**
 * P31 Skin Engine v2.0 — Sovereign inline theming
 * Aligns with @p31/skin-system registry (willow, phos, tetra, apex, cipher, garden, retro, ocean, sunset, mono, frost, ember)
 * Implements applySkin() for multi-brand CSS variable cascade.
 */

const SKIN_TOKENS = {
  willow: {
    '--p31-bg': '#070d0a',
    '--p31-surface': '#0d1812',
    '--p31-accent': '#34d399',
    '--p31-text-primary': '#f0f2f5',
    '--p31-glass-bg': 'rgba(7,13,10,0.9)',
    '--p31-glass-border': 'rgba(52,211,153,0.12)',
  },
  phos: {
    '--p31-accent': '#a78bfa',
  },
  tetra: {
    '--p31-accent': '#00f0ff',
    '--p31-glass-bg': 'rgba(10,13,20,0.92)',
  },
  apex: {
    '--p31-accent': '#fbbf24',
    '--p31-glass-bg': 'rgba(10,13,20,0.92)',
  },
  cipher: {
    '--p31-bg': '#0a0a0f',
    '--p31-surface': '#12121a',
    '--p31-accent': '#00f0ff',
    '--p31-accent-violet': '#a78bfa',
    '--p31-accent-gold': '#fbbf24',
  },
  garden: {
    '--p31-bg': '#0c140a',
    '--p31-surface': '#122012',
    '--p31-accent': '#22c55e',
    '--p31-accent-violet': '#4ade80',
  },
  retro: {
    '--p31-bg': '#0a0a0a',
    '--p31-accent': '#ffcc00',
    '--p31-accent-violet': '#ff66cc',
  },
  ocean: {
    '--p31-bg': '#0a1a2a',
    '--p31-surface': '#0f2030',
    '--p31-accent': '#00d1ff',
    '--p31-accent-violet': '#60a5fa',
  },
  sunset: {
    '--p31-bg': '#1a120a',
    '--p31-accent': '#ff9f43',
    '--p31-accent-violet': '#ff6b9d',
  },
  mono: {
    '--p31-bg': '#0a0a0a',
    '--p31-surface': '#1a1a1a',
    '--p31-accent': '#aaaaaa',
    '--p31-accent-violet': '#888888',
  },
  frost: {
    '--p31-bg': '#0a1420',
    '--p31-accent': '#5dd8ff',
    '--p31-accent-violet': '#80c0ff',
  },
  ember: {
    '--p31-bg': '#1a0a0a',
    '--p31-accent': '#ff6b35',
    '--p31-accent-violet': '#ff8c69',
  },
};

const APPLIED_PREFIX = 'data-p31-skin-';

export function applySkin(skinId) {
  const tokens = SKIN_TOKENS[skinId];
  if (!tokens) {
    console.warn(`[p31-skin] Unknown skin: "${skinId}". Available: ${Object.keys(SKIN_TOKENS).join(', ')}`);
    return false;
  }

  resetSkin();

  const root = document.documentElement;
  for (const [name, value] of Object.entries(tokens)) {
    root.style.setProperty(name, value);
    root.style.setProperty(APPLIED_PREFIX + name, '1');
  }

  root.setAttribute('data-p31-skin', skinId);
  return true;
}

export function resetSkin() {
  const root = document.documentElement;
  const styled = root.style;
  const toRemove = [];

  for (let i = 0; i < styled.length; i++) {
    const prop = styled[i];
    if (prop && styled.getPropertyValue(APPLIED_PREFIX + prop)) {
      toRemove.push(prop);
      styled.removeProperty(APPLIED_PREFIX + prop);
    }
  }

  for (const prop of toRemove) {
    styled.removeProperty(prop);
  }

  root.removeAttribute('data-p31-skin');
}

export function getCurrentSkin() {
  return document.documentElement.getAttribute('data-p31-skin');
}

export function getSkinList() {
  return Object.entries(SKIN_TOKENS).map(([id, tokens]) => ({
    id,
    accent: tokens['--p31-accent'] || tokens['--p31-accent-violet'],
  }));
}

// Auto-expose for console/debugging
if (typeof window !== 'undefined') {
  window.applySkin = applySkin;
  window.resetSkin = resetSkin;
  window.getCurrentSkin = getCurrentSkin;
  window.getSkinList = getSkinList;
}