import { z } from 'zod';
import type { BrainDump, Constraint, KnownAsset, OpenQuestion, Artifact, Gap, BrainDumpBlocker, DesiredEndState, BrainDumpMetadata } from '../types/brain-dump.js';

export const ArtifactSchema = z.object({
  path: z.string().min(1),
  description: z.string().min(1),
  status: z.enum(['healthy', 'degraded', 'seed', 'sprout', 'sapling', 'bloom', 'fruit']),
  testCount: z.object({ pass: z.number(), suites: z.number() }).optional(),
  lastModified: z.string().optional(),
});

export const GapSchema = z.object({
  description: z.string().min(1),
  severity: z.enum(['critical', 'high', 'medium', 'low']),
  relatedArtifacts: z.array(z.string()).optional(),
});

export const BlockerSchema = z.object({
  description: z.string().min(1),
  type: z.enum(['dependency', 'funding', 'legal', 'technical', 'human']),
  resolution: z.string().optional(),
  severity: z.enum(['critical', 'high', 'medium', 'low']).optional(),
});

export const CurrentStateSchema = z.object({
  artifacts: z.array(ArtifactSchema),
  gaps: z.array(GapSchema),
  blockers: z.array(BlockerSchema),
});

export const ConstraintSchema = z.object({
  id: z.string().min(1),
  rule: z.string().min(1),
  severity: z.enum(['non-negotiable', 'strong', 'preferred']),
  rationale: z.string().optional(),
});

export const DesiredEndStateSchema = z.object({
  description: z.string().min(1),
  targetStage: z.enum(['healthy', 'degraded', 'seed', 'sprout', 'sapling', 'bloom', 'fruit']),
  measurableCriteria: z.array(z.string()),
  convergenceTarget: z.string().min(1),
});

export const KnownAssetSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  location: z.string().optional(),
  canonicalValues: z.record(z.string()).optional(),
});

export const OpenQuestionSchema = z.object({
  id: z.string().min(1),
  question: z.string().min(1),
  context: z.string().optional(),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
  resolution: z.string().optional(),
});

export const BrainDumpMetadataSchema = z.object({
  capturedAt: z.string().datetime(),
  operator: z.string().min(1),
  source: z.enum(['cli', 'file', 'api']),
  tags: z.array(z.string()),
  relatedCwps: z.array(z.string()).optional(),
});

export const BrainDumpSchema = z.object({
  projectName: z.string().min(1),
  coreProblem: z.string().min(1),
  currentState: CurrentStateSchema,
  constraints: z.array(ConstraintSchema),
  desiredEndState: DesiredEndStateSchema,
  knownAssets: z.array(KnownAssetSchema),
  openQuestions: z.array(OpenQuestionSchema),
  metadata: BrainDumpMetadataSchema,
});

export function validateBrainDump(data: unknown): BrainDump {
  return BrainDumpSchema.parse(data);
}

export function createDefaultBrainDump(operatorName: string): BrainDump {
  const now = new Date().toISOString();
  return {
    projectName: '',
    coreProblem: '',
    currentState: { artifacts: [], gaps: [], blockers: [] },
    constraints: [],
    desiredEndState: {
      description: '',
      targetStage: 'fruit',
      measurableCriteria: [],
      convergenceTarget: '',
    },
    knownAssets: [],
    openQuestions: [],
    metadata: {
      capturedAt: now,
      operator: operatorName,
      source: 'cli',
      tags: [],
    },
  };
}
