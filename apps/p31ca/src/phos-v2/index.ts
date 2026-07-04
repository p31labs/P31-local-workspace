/**
 * PHOS v2.0 — Parallel Converging Implementation
 * All 8 phases, all paths lead to the glow
 */

// Master runtime
export * from './master';

// Phase 1: Voice
export { VoicePhase } from './phase1-voice/VoicePhase';

// Phase 2: Bros  
export { BrosPhase, type BrosPersona } from './phase2-bros/BrosPhase';

// Phase 3: Router
export { RouterPhase } from './phase3-router/RouterPhase';

// Phase 4: Visual
export { VisualPhase } from './phase4-visual/VisualPhase';

// Phase 5: Predictive
export { PredictivePhase } from './phase5-predictive/PredictivePhase';

// Phase 6: Guardian
export { GuardianPhase } from './phase6-guardian/GuardianPhase';

// Phase 7: Bridge
export { BridgePhase } from './phase7-bridge/BridgePhase';

// Phase 8: Memory
export { MemoryPhase } from './phase8-memory/MemoryPhase';

// Phase 2.5: DADS (Dispatch & Delegation Surface)
export { DadsPhase, TaskDispatcher } from './phase2.5-dads';
export type { Task, TaskType, TaskPriority, TaskStatus, IntentType, Actor, TaskDispatch, EngagementLogEntry } from './phase2.5-dads';
export type { CogPassActorProfile, DispatchOptions } from './phase2.5-dads';

// PHOS consumer adapters
export { createCogPassAdapter, listenForCogPassChanges } from './consumers/cogpass-adapter';
export type { CogPassPHOSAdapter, PHOSPersonaConfig } from './consumers/cogpass-adapter';

// Convergence checkpoints
export * from './convergence';
