/**
 * @p31/canon — theming/index.ts
 * The theming surface: registry + resolver + runtime token application.
 * This is the directory that had NOTHING in @p31/ui (the ghost). In
 * canon it is the machine-readable theme contract surface.
 */
export {
  THEMES,
  THEME_LIST,
  THEME_IDS,
  DEFAULT_THEME,
  THEME_ALIASES,
  resolveThemeId,
} from './theme-store';
export type { P31Theme, ThemeId } from './theme-store';

import { applyThemeTokens, getThemeTokenCSS } from './theme-css';
export { applyThemeTokens, getThemeTokenCSS };
