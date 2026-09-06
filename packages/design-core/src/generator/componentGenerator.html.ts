/**
 * @file Static HTML Generator — backward-compatible re-export wrapper.
 * New code should use `@p31/design-core/generator` (unified) or `@p31/design-core/generator/adapters/html`.
 */

export {
  generateHtml as generateStaticHtml,
  writeHtml as writeGeneratedStaticHtml,
  escapeHtml,
  cssVarName,
  componentPreview,
} from './adapters/html';
