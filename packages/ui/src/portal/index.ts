export { mountJitterbugStarfield } from './jitterbug-starfield';
export type { JitterbugStarfieldInstance, VertexData, BrightStarData, EdgeData } from './jitterbug-starfield';
export {
  tetrahedronVertices, tetrahedronEdges, wyeToDelta,
  triangularBipyramidVertices, triangularBipyramidEdges,
  sicPovmProjection, computeCurvature, computeSymmetry, isRigid,
} from './tetrahedron';
export type { TetraState, Vec3, Edge, NodeData } from './tetrahedron';
export {
  remember, recall, listMemories, splitSentences,
  crisisCheck, taskBreakdown, timeEstimate, scheduleChunk,
  simplify, chunkText, grounding54321, meltdownPlan,
  shutdownRoutine, nextAction, memoryRemind, spacedRepetition,
  memoryEncoding, progressTrack, summarize, prioritize,
  decisionTree, motionReduce, contrastScale, deadlineGuard,
  timebox, rhythmDetect, waitEstimate, dependencyMap,
  energyMatch, habitStack, stallDiagnose, fontTune,
  noiseProfile, lightAdvice, densityScale, outline, glossary,
  questionReframe, toneShift, draftReply, meetingNotes,
  assertiveReframe, statusUpdate, supportPing, recallPrompt,
  chunkRecall, retrievalPractice, memoryCue, forgetTrack,
} from './cognitive';
export type { CrisisSignal } from './cognitive';
export { useWorkerHealth } from './hooks/useWorkerHealth';
export type { WorkerHealthStatus, WorkerHealthEntry } from './hooks/useWorkerHealth';
