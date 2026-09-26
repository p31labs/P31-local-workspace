/**
 * @file P31 Design System — main entry point.
 *
 * Re-exports public API from submodules.
 */

export { loadTokens, resolveToken, cssVarName, loadComponents, parseYamlSimple } from './generator/shared.js';
export { getPrinciples, getReviewRules } from './principles.js';
export { listComponents, getComponentDef, COMPONENT_DEFS } from './componentDefs.js';
export type { StarfieldInstance } from './starfield.js';
export { initStarfield, mountStarfield } from './starfield.js';
export { registerP31CrisisOverlay } from './crisis-overlay.js';
export { DISPATCHER_SRC, DISPATCHER_MIN_SRC } from './mcp/index.js';
