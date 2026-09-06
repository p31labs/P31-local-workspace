// Root-level re-export of @p31/interface-generator.
// Canonical implementation: software/packages/interface-generator/src/

export { generateInterface } from './generator';
export { generateInterfaceFromIntent } from './intent-generator';
export { InterfaceRenderer, CrisisOverlay } from './renderer';
export { normalizePassport, defaultPassport } from './adapters/passport';
export { fetchViewData, fetchPassport } from './adapters/data';
export { toA2UI, validateA2UI, WIDGET_TO_A2UI } from './adapters/a2ui';
export { A2UIRenderer } from './adapters/A2UIRenderer';
export { widgetToComponentMap, resolveComponentId } from './adapters/widgetToComponentMap';
export {
  spoonGuide,
  buildWidgets,
} from './rules/spoon-guide';
export {
  createInitialState,
  applyMutation,
  reconstructState,
  undo,
  redo,
  getEventHistory,
  getVersion,
  type MutationEvent,
  type MutationType,
  type AddWidgetPayload,
  type RemoveWidgetPayload,
  type ReorderWidgetPayload,
  type UpdateWidgetPayload,
  type SetIntentPayload,
  type UIState,
} from './plasma';
export type {
  InterfaceDescription,
  Widget,
  WidgetType,
  GeneratorInput,
  GenerationIntent,
  SpoonRules,
} from './types';
export type {
  A2UIMessage,
  A2UIComponent,
  A2UIComponentName,
  A2UIP31Extension,
} from './adapters/a2ui';
