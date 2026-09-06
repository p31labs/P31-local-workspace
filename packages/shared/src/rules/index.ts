// ═══════════════════════════════════════════════════════
// @p31/shared — Rules Engine Export
//
// Export all Constitution engine functionality for use in
// Spaceship Earth and other P31 applications.
// ═══════════════════════════════════════════════════════

// Types
export * from './types';

// Core engine
export { evaluateRules, createDefaultConstitution } from './engine';
export { addCreatorRule, removeCreatorRule, updateCreatorRule } from './engine';

// Cognitive Shield
export { CognitiveShield, analyzeMessage, rewriteMessage, defaultShieldConfig } from './cognitiveShield';