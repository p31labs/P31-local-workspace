/**
 * @file skin-system — Runtime skin engine for the P31 design ecosystem.
 *
 * applySkin(skinId) injects CSS variable overrides on <html>.
 * resetSkin() removes all injected overrides, restoring the default skin.
 *
 * Usage:
 *   import { applySkin, resetSkin, listSkins } from '@p31/skin-system';
 *   applySkin('willow');  // turns the page green
 *   resetSkin();          // restores defaults
 */

import { getSkin, listSkins } from './registry';

const APPLIED_PREFIX = 'data-p31-skin-override-';
let currentSkinId: string | null = null;

export function applySkin(skinId: string): boolean {
  const skin = getSkin(skinId);
  if (!skin) {
    console.warn(`@p31/skin-system: unknown skin "${skinId}". Available: ${listSkins().map(s => s.id).join(', ')}`);
    return false;
  }

  // Reset any previously applied skin
  resetSkin();

  // Apply new overrides
  const root = document.documentElement;
  for (const [name, value] of Object.entries(skin.tokenOverrides)) {
    root.style.setProperty(name, value);
    root.style.setProperty(APPLIED_PREFIX + name, '1');
  }

  root.setAttribute('data-p31-skin', skinId);
  currentSkinId = skinId;
  return true;
}

export function resetSkin(): void {
  if (!currentSkinId) return;

  const root = document.documentElement;
  // Only remove the overrides we set (not base tokens)
  const allStyled = root.style as CSSStyleDeclaration & { length: number; [index: number]: string };
  const toRemove: string[] = [];
  for (let i = 0; i < allStyled.length; i++) {
    const prop = allStyled[i];
    if (root.style.getPropertyValue(APPLIED_PREFIX + prop)) {
      toRemove.push(prop);
      root.style.removeProperty(APPLIED_PREFIX + prop);
    }
  }
  for (const prop of toRemove) {
    root.style.removeProperty(prop);
  }

  root.removeAttribute('data-p31-skin');
  currentSkinId = null;
}

export function getCurrentSkin(): string | null {
  return currentSkinId;
}

export { listSkins, getSkin };
export type { SkinDefinition } from './registry';
