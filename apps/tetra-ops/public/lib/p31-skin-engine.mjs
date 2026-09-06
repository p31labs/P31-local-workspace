/**
 * p31-skin-engine.mjs
 *
 * Unified skin bridge for the P31 design system.
 * Uses the canonical @p31/skin-system registry where available,
 * and falls back to inline tokens when running in sovereign/no-build mode.
 */

import { applySkin as registryApplySkin, listSkins as registryListSkins } from '@p31/skin-system';

const BRIDGE_PREFIX = 'data-p31-skin-override-';
let currentSkinId = null;
let fallbackReady = false;
let fallbackSkins = null;

export function resolveSkinId(themeId) {
  if (!themeId) return 'cipher';
  const known = registryListSkins().map(s => s.id);
  if (known.includes(themeId)) return themeId;
  const map = {
    hub: 'cipher',
    org: 'willow',
    midnight: 'cipher',
    genesis: 'ocean',
    paper: 'mono',
    matrix: 'retro',
    dark: 'cipher',
    light: 'mono',
  };
  return map[themeId] || 'cipher';
}

function ensureFallbackSkins() {
  if (fallbackReady) return fallbackSkins;
  fallbackSkins = {
    willow: { '--p31-bg': '#070d0a', '--p31-surface': '#0d1812', '--p31-accent': '#34d399', '--p31-text-primary': '#f0f2f5', '--p31-glass-bg': 'rgba(7,13,10,0.9)', '--p31-glass-border': 'rgba(52,211,153,0.12)' },
    phos: { '--p31-accent': '#a78bfa', '--p31-glass-bg': 'rgba(10,13,20,0.92)' },
    tetra: { '--p31-accent': '#00f0ff', '--p31-glass-bg': 'rgba(10,13,20,0.92)' },
    apex: { '--p31-accent': '#fbbf24', '--p31-glass-bg': 'rgba(10,13,20,0.92)' },
    cipher: { '--p31-bg': '#0a0a0f', '--p31-surface': '#12121a', '--p31-accent': '#00f0ff', '--p31-accent-violet': '#a78bfa', '--p31-accent-gold': '#fbbf24', '--p31-text-primary': '#f5f5f7' },
    garden: { '--p31-bg': '#0c140a', '--p31-surface': '#122012', '--p31-accent': '#22c55e', '--p31-accent-violet': '#4ade80' },
    retro: { '--p31-bg': '#0a0a0a', '--p31-accent': '#ffcc00', '--p31-accent-violet': '#ff66cc' },
    ocean: { '--p31-bg': '#0a1a2a', '--p31-surface': '#0f2030', '--p31-accent': '#00d1ff', '--p31-accent-violet': '#60a5fa' },
    sunset: { '--p31-bg': '#1a120a', '--p31-accent': '#ff9f43', '--p31-accent-violet': '#ff6b9d' },
    mono: { '--p31-bg': '#0a0a0a', '--p31-surface': '#1a1a1a', '--p31-accent': '#aaaaaa', '--p31-accent-violet': '#888888' },
    frost: { '--p31-bg': '#0a1420', '--p31-accent': '#5dd8ff', '--p31-accent-violet': '#80c0ff' },
    ember: { '--p31-bg': '#1a0a0a', '--p31-accent': '#ff6b35', '--p31-accent-violet': '#ff8c69' },
  };
  fallbackReady = true;
  return fallbackSkins;
}

export function applySkin(skinId) {
  const resolved = resolveSkinId(skinId);
  const tokens = (typeof registryApplySkin === 'function' ? registryApplySkin(resolved) : null)
    ? null
    : ensureFallbackSkins()[resolved];

  if (!tokens) {
    const ok = registryApplySkin(resolved);
    if (ok) {
      currentSkinId = resolved;
      return true;
    }
  }

  if (!tokens) {
    console.warn('[p31-skin] Unknown skin: "' + resolved + '". Available: ' + Object.keys(ensureFallbackSkins()).join(', '));
    return false;
  }

  resetSkin();

  const root = document.documentElement;
  for (const [name, value] of Object.entries(tokens)) {
    root.style.setProperty(name, value);
    root.style.setProperty(BRIDGE_PREFIX + name, '1');
  }

  root.setAttribute('data-p31-skin', resolved);
  currentSkinId = resolved;
  return true;
}

export function resetSkin() {
  const root = document.documentElement;
  const styled = root.style;
  const toRemove = [];

  for (let i = 0; i < styled.length; i++) {
    const prop = styled[i];
    if (prop && styled.getPropertyValue(BRIDGE_PREFIX + prop)) {
      toRemove.push(prop);
      styled.removeProperty(BRIDGE_PREFIX + prop);
    }
  }

  for (const prop of toRemove) {
    styled.removeProperty(prop);
  }

  root.removeAttribute('data-p31-skin');
  currentSkinId = null;
}

export function getCurrentSkin() {
  return currentSkinId || document.documentElement.getAttribute('data-p31-skin');
}

export function getSkinList() {
  const skins = registryListSkins();
  if (skins && skins.length) return skins;
  return Object.keys(ensureFallbackSkins()).map(id => ({ id }));
}

// Auto-expose for console/debugging
if (typeof window !== 'undefined') {
  window.applySkin = applySkin;
  window.resetSkin = resetSkin;
  window.getCurrentSkin = getCurrentSkin;
  window.getSkinList = getSkinList;
}

export default { applySkin, resetSkin, getCurrentSkin, getSkinList };