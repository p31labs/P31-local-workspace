import type { Axis, BrainDump, Constraint, KnownAsset, OpenQuestion } from '../types/index.js';

export function axisToBrainDump(
  axis: Axis,
  parentConstraints: Constraint[],
  parentAssets: KnownAsset[],
  parentQuestions: OpenQuestion[]
): BrainDump {
  return {
    projectName: axis.name,
    coreProblem: axis.focusArea,
    currentState: {
      artifacts: axis.deliverable.map((d) => ({
        path: d.filePath,
        description: d.description,
        status: 'seed' as const,
      })),
      gaps: [],
      blockers: [],
    },
    constraints: parentConstraints,
    desiredEndState: {
      description: `Complete ${axis.deliverable.length} deliverables for ${axis.name}`,
      targetStage: 'fruit',
      measurableCriteria: axis.deliverable.flatMap((d) => d.acceptanceCriteria),
      convergenceTarget: axis.convergenceGate.overallCriteria,
    },
    knownAssets: parentAssets,
    openQuestions: parentQuestions,
    metadata: {
      capturedAt: new Date().toISOString(),
      operator: 'recursive-orchestrator',
      source: 'api',
      tags: [`axis:${axis.id}`],
    },
  };
}
