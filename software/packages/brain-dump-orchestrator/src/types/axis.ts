export interface ConvergenceGateCheck {
  id: string;
  description: string;
  type: string;
  config?: Record<string, unknown>;
}

export interface Deliverable {
  id?: string;
  description: string;
  filePath: string;
  acceptanceCriteria: string[];
}

export interface Axis {
  id: string;
  letter: string;
  name: string;
  focusArea: string;
  agentRole: string;
  deliverable: Deliverable[];
  convergenceGate: {
    checks: Array<{
      id: string;
      description: string;
      type: string;
      config?: Record<string, unknown>;
    }>;
    overallCriteria: string;
  };
  complexity: 'low' | 'medium' | 'high';
  dependencies: string[];
  status: string;
}
