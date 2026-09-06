export interface ConvergenceResult {
  overall: 'PASS' | 'FAIL';
  checkedAt: string;
  axes: AxisConvergenceStatus[];
  blockers: ConvergenceBlocker[];
  nextSteps: string[];
}

export interface AxisConvergenceStatus {
  axisId: string;
  status: 'PASS' | 'FAIL';
  checks: GateCheckResult[];
  notes?: string;
}

export interface GateCheckResult {
  checkId: string;
  passed: boolean;
  evidence?: string;
  error?: string;
}

export interface RollbackAction {
  axisId: string;
  action: 'retry' | 're decompose' | 'escalate';
  feedback: string;
  retryCount: number;
}

export interface ConvergenceBlocker {
  axisId?: string;
  type: 'dependency' | 'quality' | 'timeout' | 'hallucination' | 'unknown';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  resolution?: string;
}
