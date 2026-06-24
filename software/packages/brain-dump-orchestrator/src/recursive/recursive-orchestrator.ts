import type {
  Axis,
  AxisConfig,
  OrchestrationConfig,
  OrchestrationResult,
  AgentRunResult,
  RecursiveConfig,
} from '../types/index.js';
import { decomposeBrainDump } from '../decomposition/axis-decomposer.js';
import { classifyAxis } from './classify.js';
import { axisToBrainDump } from './axis-to-brain-dump.js';
import { K4GateChecker, type K4GateConfig } from './k4-gate-checker.js';
import { R2ContentProvider } from './r2-content-provider.js';
import { BrainDumpOrchestrator, OrchestratorDependencies } from '../orchestration/orchestrator.js';

export interface RecursiveOrchestratorConfig extends OrchestrationConfig {
  recursive: RecursiveConfig;
}

export interface RecursiveOrchestratorDependencies extends OrchestratorDependencies {
  decompose?: (bd: OrchestrationConfig['brainDump']) => Axis[];
}

export class RecursiveBrainDumpOrchestrator extends BrainDumpOrchestrator {
  private recursiveConfig: RecursiveConfig;
  private depth: number;
  private lineage: string[];
  private gateChecker: K4GateChecker;
  private decomposeFn: (bd: OrchestrationConfig['brainDump']) => Axis[];

  constructor(
    config: RecursiveOrchestratorConfig,
    deps: RecursiveOrchestratorDependencies = {},
    depth = 0,
    lineage: string[] = []
  ) {
    super(config, deps);
    this.recursiveConfig = config.recursive;
    this.depth = depth;
    this.lineage = lineage;
    const contentProvider = deps.tracker ? new R2ContentProvider(deps.tracker) : undefined;
    this.gateChecker = new K4GateChecker({ mode: 'fast' }, contentProvider);
    this.decomposeFn = deps.decompose ?? ((bd) => (bd ? decomposeBrainDump(bd) : []));
  }

  private async writeBubble(axisId: string, result: AgentRunResult): Promise<void> {
    const bubble = {
      axisId,
      status: result.success ? 'completed' : 'failed',
      filesWritten: result.filesWritten,
      statusLine: result.statusLine,
      depth: this.depth,
      lineage: [...this.lineage],
      timestamp: new Date().toISOString(),
    };

    try {
      const tracker = this.tracker;
      const bubbleKey = `bubbles/${this.config.batchId}/${axisId}.json`;
      await tracker.recordFile(bubbleKey, axisId, JSON.stringify(bubble));
    } catch (err) {
      console.warn(`[recursive-orchestrator] Bubble write failed for ${axisId}:`, err);
    }
  }

  async runAll(): Promise<OrchestrationResult> {
    const brainDump = this.brainDump;

    if (!brainDump) {
      return super.runAll();
    }

    const axes = this.decomposeFn(brainDump);
    const results: Record<string, AgentRunResult> = {};
    const childResults: Record<string, OrchestrationResult> = {};
    const maxConcurrency = this.config.maxConcurrency;
    const defaultAdapter = this.config.axes[0]?.adapter ?? 'noop';
    const defaultTimeout = this.config.axes[0]?.timeoutMs ?? 300000;

    const queue: Array<{ axis: Axis; classification: 'atomic' | 'composite' }> = [];
    for (const axis of axes) {
      queue.push({
        axis,
        classification: classifyAxis(axis, this.recursiveConfig, this.depth),
      });
    }

    const running: Promise<void>[] = [];

    while (queue.length > 0 || running.length > 0) {
      while (running.length < maxConcurrency && queue.length > 0) {
        const item = queue.shift()!;
        const axis = item.axis;

        const promise = (async () => {
          let result: AgentRunResult;

          if (item.classification === 'atomic' || this.depth >= this.recursiveConfig.maxDepth) {
            const axisConfig: AxisConfig = {
              axisId: axis.id,
              adapter: defaultAdapter,
              priority: 0,
              timeoutMs: defaultTimeout,
            };
            result = await this.executeAxisConfig(axisConfig);
          } else {
            const subDump = axisToBrainDump(
              axis,
              brainDump.constraints,
              brainDump.knownAssets,
              brainDump.openQuestions
            );
            const subConfig: RecursiveOrchestratorConfig = {
              ...this.config,
              batchId: `${this.config.batchId}-${axis.id}`,
              brainDump: subDump,
              recursive: this.recursiveConfig,
            };
            const subOrchestrator = new RecursiveBrainDumpOrchestrator(
              subConfig,
              {
                 tracker: this.tracker,
                statusTracker: this.statusTracker,
                decompose: this.decomposeFn,
              },
              this.depth + 1,
              [...this.lineage, axis.id]
            );
            const subResult = await subOrchestrator.runAll();
            childResults[axis.id] = subResult;
            result = {
              success: subResult.overallStatus === 'completed' || subResult.overallStatus === 'partial_failure',
              filesWritten: [],
              statusLine: `Recursive ${axis.id}: ${subResult.overallStatus}`,
              startedAt: subResult.startedAt,
              completedAt: subResult.completedAt,
            };
          }

          await this.writeBubble(axis.id, result);
          results[axis.id] = result;
        })();

        running.push(promise.then(() => {
          const idx = running.indexOf(promise);
          if (idx >= 0) running.splice(idx, 1);
        }));
      }

      if (running.length > 0) {
        await Promise.race(running);
      }
    }

    await Promise.all(running);

    const convergence = await this.gateChecker.checkAll(
      axes,
      {
        batchId: this.config.batchId,
        startedAt: new Date().toISOString(),
        axes: results,
        overallStatus: 'running',
      }
    );

    const failures = Object.values(results).filter((r) => !r.success).length;
    const overallStatus =
      failures === 0 ? 'completed' : failures === Object.keys(results).length ? 'failed' : 'partial_failure';

    return {
      batchId: this.config.batchId,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      axes: results,
      overallStatus: convergence.overall === 'PASS' ? overallStatus : 'failed',
      convergenceReport: convergence,
      depth: this.depth,
      lineage: this.lineage,
      children: childResults,
    };
  }
}
