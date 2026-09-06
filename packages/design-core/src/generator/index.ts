/**
 * @file Unified Generator Index
 * Re-exports all adapter generators and provides a unified generate() function.
 */

export { generateReact, writeReact } from './adapters/react.js';
export { generateAstro, writeAstro } from './adapters/astro.js';
export { generateHtml, writeHtml, escapeHtml, cssVarName, componentPreview } from './adapters/html.js';
export { generateWebComponents, writeWebComponents, tagName, observedAttrs, componentStyles, slotStyles } from './adapters/webcomponent.js';
export { loadComponents, loadTokens, parseYamlSimple, ensureDir, COMPONENTS_YAML, TOKENS_YAML } from './shared.js';
export type { ComponentsFile, TokensFile, GeneratedFile, GeneratorOptions } from './shared.js';
export { shouldRegenerate, writeCachedHash } from './cache.js';
export { getComponentDef, listComponents, listComponentsByCategory, COMPONENT_DEFS } from '../componentDefs.js';
