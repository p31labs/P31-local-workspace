export interface AxisAgent {
  id: string;
  axisId: string;
  role: string;
  mission: string;
  context: string;
  criticalDesignRules: string[];
  constraints: string[];
  deliverables: string[];
  convergenceGate: string[];
  runtime: 'claude-code' | 'cortex-do' | 'agent-engine' | 'llm-generic' | 'noop';
  status: AgentStatus;
  result?: AgentRunResult;
}

export interface AgentRunResult {
  success: boolean;
  filesWritten: string[];
  statusLine: string;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  error?: string;
}

export type AgentStatus = 'idle' | 'queued' | 'running' | 'completed' | 'failed' | 'retrying';

export interface AgentPrompt {
  system: string;
  user: string;
  outputFiles: string[];
  maxTokens?: number;
}
