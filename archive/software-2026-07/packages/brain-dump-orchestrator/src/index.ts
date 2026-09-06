export * from './types/index.js';
export * from './brain-dump/index.js';
export * from './decomposition/index.js';
export * from './agents/index.js';
export * from './orchestration/index.js';
export * from './convergence/index.js';
export * from './jitterbug/index.js';
export * from './recursive/index.js';

export { BrainDumpOrchestrator, BatchRunner } from './orchestration/index.js';
export { GateChecker, ConvergenceReporter } from './convergence/index.js';
export { MaturityScorer, SignalEmitter, StageTransitionTracker } from './jitterbug/index.js';
export { RecursiveBrainDumpOrchestrator, K4GateChecker, classifyAxis, axisToBrainDump } from './recursive/index.js';
