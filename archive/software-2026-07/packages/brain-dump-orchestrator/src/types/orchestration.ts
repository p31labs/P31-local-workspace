import type { AgentStatus, AgentRunResult } from './agent.js';
import type { ConvergenceResult, ConvergenceBlocker } from './convergence.js';
import type { BrainDump } from './brain-dump.js';
import type { RecursiveConfig } from './recursive.js';

export interface OrchestrationConfig {
  batchId: string;
  brainDump?: BrainDump;
  axes: AxisConfig[];
  maxConcurrency: number;
  retryPolicy: RetryPolicy;
  statusTracker?: 'in-memory' | 'kv' | 'd1';
  statusPath?: string;
  recursive?: RecursiveConfig;
}

export interface AxisConfig {
  axisId: string;
  adapter: string;
  priority: number;
  timeoutMs: number;
  isolation?: 'shared' | 'isolated' | 'sandboxed';
}

export interface RetryPolicy {
  maxRetries: number;
  backoffMs: number;
  retryableErrors: string[];
}

export interface StatusEntry {
  axisId: string;
  status: AgentStatus;
  updatedAt: string;
  message?: string;
}

export interface OrchestrationResult {
  batchId: string;
  startedAt: string;
  completedAt?: string;
  axes: Record<string, AgentRunResult>;
  overallStatus: 'running' | 'completed' | 'partial_failure' | 'failed';
  convergenceReport?: ConvergenceResult;
  depth?: number;
  lineage?: string[];
  children?: Record<string, OrchestrationResult>;
}
