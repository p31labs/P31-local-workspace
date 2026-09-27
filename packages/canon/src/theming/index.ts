/**
 * @p31ca/canon — theming/index.ts
 * The theming surface: registry + resolver + runtime token application.
 * This is the directory that had NOTHING in @p31ca/ui (the ghost). In
 * canon it is the machine-readable theme contract surface.
 */
export {
  THEMES,
  THEME_LIST,
  THEME_IDS,
  DEFAULT_THEME,
  THEME_ALIASES,
  resolveThemeId,
} from './theme-store.js';
export type { P31Theme, ThemeId } from './theme-store.js';

import { applyThemeTokens, getThemeTokenCSS } from './theme-css.js';
export { applyThemeTokens, getThemeTokenCSS };

export { PAGE_THEMES, pageTheme } from './page-themes.js';
export type { PageThemeConfig, AmbientBackground, DisplayType, MotionLevel } from './page-themes.js';
