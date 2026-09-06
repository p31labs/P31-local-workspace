/**
 * @file P31 Design System — main entry point.
 *
 * Re-exports public API from submodules.
 */

export { loadTokens, resolveToken, cssVarName } from './tokens/index.js';
export { loadComponents, parseYamlSimple } from './generator/shared.js';
export { getPrinciples, getReviewRules } from './principles.js';
export { listComponents, getComponentDef, COMPONENT_DEFS } from './componentDefs.js';
export { StarfieldInstance, initStarfield, mountStarfield } from './starfield.js';
export { CrisisOverlay } from './crisis-overlay.js';
export { DISPATCHER_SRC, DISPATCHER_MIN_SRC } from './mcp/index.js';
