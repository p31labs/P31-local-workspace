/**
 * @p31/canon — theme-css.ts
 *
 * Runtime CSS application over the theme registry.
 * Both functions read THEMES[themeId].tokens — no magic, no separate source.
 */
import { THEMES, type ThemeId } from './theme-store'

/**
 * Write each token of themeId as a --p31-* custom property on root.
 * No root → document.documentElement. Throws if called in a non-DOM
 * environment with no root provided.
 */
export function applyThemeTokens(themeId: ThemeId, root?: HTMLElement): void {
  const target = root ?? (typeof document !== 'undefined' ? document.documentElement : undefined)
  if (!target) {
    throw new Error('applyThemeTokens: no DOM root available — provide a target or run in a browser context')
  }
  const tokens = THEMES[themeId]?.tokens
  if (!tokens) return
  for (const [prop, value] of Object.entries(tokens)) {
    target.style.setProperty(prop, value)
  }
}

/**
 * Return a :root{ --p31-*: value; ... } stylesheet string for themeId.
 * Suitable for SSR, inline <style> injection, or file generation.
 */
export function getThemeTokenCSS(themeId: ThemeId): string {
  const tokens = THEMES[themeId]?.tokens
  if (!tokens) return ''
  const lines = Object.entries(tokens)
    .map(([prop, value]) => `  ${prop}: ${value};`)
    .join('\n')
  return `:root {\n${lines}\n}\n`
}
