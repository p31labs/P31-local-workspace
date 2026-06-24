export interface BrainDump {
  projectName: string;
  coreProblem: string;
  currentState: CurrentState;
  constraints: Constraint[];
  desiredEndState: DesiredEndState;
  knownAssets: KnownAsset[];
  openQuestions: OpenQuestion[];
  metadata: BrainDumpMetadata;
}

export interface CurrentState {
  artifacts: Artifact[];
  gaps: Gap[];
  blockers: BrainDumpBlocker[];
}

export interface Artifact {
  path: string;
  description: string;
  status: ArtifactStatus;
  testCount?: { pass: number; suites: number };
  lastModified?: string;
}

export type ArtifactStatus = 'healthy' | 'degraded' | 'seed' | 'sprout' | 'sapling' | 'bloom' | 'fruit';

export interface Gap {
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  relatedArtifacts?: string[];
}

export interface BrainDumpBlocker {
  description: string;
  type: 'dependency' | 'funding' | 'legal' | 'technical' | 'human';
  resolution?: string;
}

export interface Constraint {
  id: string;
  rule: string;
  severity: 'non-negotiable' | 'strong' | 'preferred';
  rationale?: string;
}

export interface DesiredEndState {
  description: string;
  targetStage: ArtifactStatus;
  measurableCriteria: string[];
  convergenceTarget: string;
}

export interface KnownAsset {
  name: string;
  description: string;
  location?: string;
  canonicalValues?: Record<string, string>;
}

export interface OpenQuestion {
  id: string;
  question: string;
  context?: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  resolution?: string;
}

export interface BrainDumpMetadata {
  capturedAt: string;
  operator: string;
  source: 'cli' | 'file' | 'api';
  tags: string[];
  relatedCwps?: string[];
}
