/**
 * @file Web Component Generator — backward-compatible re-export wrapper.
 * New code should use `@p31/design-core/generator` (unified) or `@p31/design-core/generator/adapters/webcomponent`.
 */

export { generateWebComponents, writeWebComponents as writeGeneratedWebComponents, generateTokensCSS, tagName, observedAttrs, componentStyles, slotStyles } from './adapters/webcomponent';
export { camelToKebab, escapeJs, resolveToken, resolveReferences, resolveRawToken, tokenPathToVar, resolveTokenVar, parseYamlSimple, loadYaml, loadTokens } from './shared';
