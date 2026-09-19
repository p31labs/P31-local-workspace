/**
 * @p31/canon — contracts/index.ts
 *
 * The contract surface. Consumers (including the MCP server) import
 * contracts from here, not from individual files.
 */
export { ComponentContractSchema } from './schema';
export type {
  ComponentContract,
  Prop,
  AriaRequirement,
  SemanticPart,
  InteractionState,
  SourcePointer,
} from './schema';

export { buttonContract } from './button.contract';