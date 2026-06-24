import type { OrchestrationConfig, OrchestrationResult, StatusEntry, AgentRunResult, AgentStatus, AxisConfig, AxisAgent } from '../types/index.js';
import { AxisAgentRuntime } from '../agents/axis-agent.js';
import { DeliverableTracker, InMemoryDeliverableTracker } from '../agents/deliverable-tracker.js';
import { createStatusTracker, StatusTracker } from './status-tracker.js';

export interface OrchestratorDependencies {
  tracker?: DeliverableTracker;
  statusTracker?: StatusTracker;
}

export class BrainDumpOrchestrator {
  protected config: OrchestrationConfig;
  protected tracker: DeliverableTracker;
  protected statusTracker?: StatusTracker;
  private statuses: Map<string, StatusEntry> = new Map();
  protected brainDump?: OrchestrationConfig['brainDump'];

  constructor(config: OrchestrationConfig, deps: OrchestratorDependencies = {}) {
    this.config = config;
    this.brainDump = config.brainDump;
    this.tracker = deps.tracker ?? new InMemoryDeliverableTracker();
    this.statusTracker = deps.statusTracker ?? (config.statusTracker ? createStatusTracker(config.statusTracker) : undefined);
  }

  async runAll(): Promise<OrchestrationResult> {
    const result: OrchestrationResult = {
      batchId: this.config.batchId,
      startedAt: new Date().toISOString(),
      axes: {},
      overallStatus: 'running',
    };

    const axisConfigs = this.config.axes;
    const maxConcurrency = this.config.maxConcurrency;
    const running: Promise<void>[] = [];
    const queue: AxisConfig[] = [...axisConfigs];

    while (queue.length > 0 || running.length > 0) {
      while (running.length < maxConcurrency && queue.length > 0) {
        const axisConfig = queue.shift()!;
        const promise = this.executeAxisConfig(axisConfig).then(res => {
          result.axes[axisConfig.axisId] = res;
          running.splice(running.indexOf(promise), 1);
        });
        running.push(promise);
      }

      if (running.length > 0) {
        await Promise.race(running);
      }
    }

    await Promise.all(running);

    const failures = Object.values(result.axes).filter(r => !r.success).length;
    result.overallStatus = failures === 0 ? 'completed' : failures === Object.keys(result.axes).length ? 'failed' : 'partial_failure';
    result.completedAt = new Date().toISOString();
    return result;
  }

  protected async executeAxisConfig(axisConfig: AxisConfig): Promise<AgentRunResult> {
    const startStatus: StatusEntry = { axisId: axisConfig.axisId, status: 'running', updatedAt: new Date().toISOString(), message: 'Starting' };
    this.updateStatus(startStatus);
    const agent = new AxisAgentRuntime({
      id: `agent-${axisConfig.axisId}`,
      axisId: axisConfig.axisId,
      role: 'Architect',
      mission: `Execute axis ${axisConfig.axisId}`,
      context: '',
      criticalDesignRules: [],
      constraints: [],
      deliverables: [],
      convergenceGate: [],
      runtime: axisConfig.adapter as AxisAgent['runtime'],
      status: 'queued',
    });

    try {
      const result = await Promise.race([
        agent.execute(),
        new Promise<AgentRunResult>((_, reject) => setTimeout(() => reject(new Error('timeout')), axisConfig.timeoutMs)),
      ]);
      const completedStatus: StatusEntry = {
        axisId: axisConfig.axisId,
        status: result.success ? 'completed' : 'failed',
        updatedAt: new Date().toISOString(),
        message: result.statusLine,
      };
      this.updateStatus(completedStatus);
      for (const file of result.filesWritten) {
        await this.tracker.recordFile(file, axisConfig.axisId, '');
      }
      return result as AgentRunResult;
    } catch (error) {
      const err = error instanceof Error ? error.message : 'unknown';
      const failedStatus: StatusEntry = { axisId: axisConfig.axisId, status: 'failed', updatedAt: new Date().toISOString(), message: err };
      this.updateStatus(failedStatus);
      return {
        success: false,
        filesWritten: [],
        statusLine: `Axis ${axisConfig.axisId}: ${err}`,
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        error: err,
      };
    }
  }

  protected updateStatus(entry: StatusEntry): void {
    this.statuses.set(entry.axisId, entry);
    this.statusTracker?.append(this.config.batchId, entry);
  }

  getStatus(axisId: string): StatusEntry | undefined {
    return this.statuses.get(axisId);
  }

  getAllStatuses(): StatusEntry[] {
    return Array.from(this.statuses.values());
  }

  getTracker(): DeliverableTracker {
    return this.tracker;
  }

  async resumeFailed(): Promise<OrchestrationResult> {
    const failedAxes = this.config.axes.filter((cfg) => {
      const entry = this.statuses.get(cfg.axisId);
      return entry?.status === 'failed';
    });

    if (failedAxes.length === 0) {
      return {
        batchId: this.config.batchId,
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        axes: {},
        overallStatus: 'completed',
      };
    }

    const results: Record<string, AgentRunResult> = {};
    for (const axisConfig of failedAxes) {
      const result = await this.executeAxisConfig(axisConfig);
      results[axisConfig.axisId] = result;
    }

    return {
      batchId: this.config.batchId,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      axes: results,
      overallStatus: Object.values(results).every((r) => r.success) ? 'completed' : 'partial_failure',
    };
  }
}
