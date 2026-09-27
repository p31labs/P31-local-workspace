/**
 * @p31ca/canon — src/index.ts
 * ==================================================================
 * The FACE of the canon.
 *
 * GUARANTEES (structural, not stylistic):
 *   1. This file MUST exist. The exports generator hard-fails the
 *      build if it doesn't — the canon has no face, killed at gate.
 *   2. This file is the ONLY face. Consumers import { THEMES, … }
 *      from "@p31ca/canon", never from a ghost subpath.
 *   3. The canon is tokens + contracts + CSS. Framework components
 *      live in @p31/canon-react / @p31/canon-astro — NOT here.
 *
 * The theming payload is the real, verified, on-disk theme registry
 * (9 themes, OKLCH tokens, alias resolution) — ported decisions from
 * the @p31ca/ui ghost-theater era, now structural truth.
 */

export {
  THEMES,
  THEME_LIST,
  THEME_IDS,
  DEFAULT_THEME,
  THEME_ALIASES,
  resolveThemeId,
} from './theming/theme-store.js';
export type { P31Theme, ThemeId } from './theming/theme-store.js';

export { ComponentContractSchema } from './contracts/schema.js';
export type { ComponentContract, Prop, SemanticPart } from './contracts/schema.js';

export { buttonContract } from './contracts/button.contract.js';
