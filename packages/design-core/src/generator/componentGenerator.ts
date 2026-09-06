/**
 * @file React/TSX Generator — backward-compatible re-export wrapper.
 * New code should use `@p31/design-core/generator` (unified) or `@p31/design-core/generator/adapters/react`.
 */

export { generateReact as generateComponents, writeReact as writeGeneratedComponents } from './adapters/react';
