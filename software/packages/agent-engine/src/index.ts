/**
 * P31 Agent Engine - Main Module
 * 
 * Core engine for creating and managing personalized AI agents
 */

export { AgentEngine } from './agent-engine';
export { PersonalityEngine } from './personality';
export { SkillTreeEngine } from './skills';
export { DeploymentManager } from './deployment';
export { P31IntegrationManager } from './integration';

// Re-export types for convenience
export type {
  AgentProfile,
  AgentIdentity,
  VisualTheme,
  PersonalityMatrix,
  SkillTree,
  P31Integration,
  DeploymentConfig,
  TrainingSession,
  UserFeedback,
  AgentInstance,
  AgentState,
  AgentRuntime,
  AgentConnection,
} from './types';

// Re-export validation schemas
export {
  AgentIdentitySchema,
  PersonalityMatrixSchema,
  AgentProfileSchema,
} from './types';