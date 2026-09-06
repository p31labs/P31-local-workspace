import { DurableObject } from 'cloudflare:workers';
import { decomposeBrainDump, BrainDumpOrchestrator, GateChecker, OrchestratorDependencies, type RecursiveConfig, type BrainDump, R2DeliverableTracker, InMemoryDeliverableTracker, type DeliverableTracker, KVStatusTracker, D1StatusTracker, type StatusTracker } from '@p31/brain-dump-orchestrator';
import { DBClient } from './db';

export interface Env {
  DB: D1Database;
  R2_BUCKET: R2Bucket;
  KV: KVNamespace;
  ORCHESTRATOR_DO: DurableObjectNamespace<OrchestratorDO>;
  PSK: string;
}

export class OrchestratorDO extends DurableObject {
  private db: DBClient;
  private brainDumpId: string | null = null;
  private deps: OrchestratorDependencies = {};

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.db = new DBClient(env.DB);
  }

  async startOrchestration(brainDumpId: string): Promise<void> {
    this.brainDumpId = brainDumpId;
    const env = this.env as Env;
    const batchId = `do-${brainDumpId}`;

    const tracker: DeliverableTracker = env.R2_BUCKET
      ? new R2DeliverableTracker(env.R2_BUCKET as any, batchId)
      : new InMemoryDeliverableTracker();

    let statusTracker: StatusTracker | undefined;
    if (env.KV) {
      statusTracker = new KVStatusTracker(env.KV as any);
    } else if (env.DB) {
      statusTracker = new D1StatusTracker({ prepare: (sql: string) => env.DB.prepare(sql) });
    }

    this.deps = { tracker, statusTracker };
    this.ctx.storage.setAlarm(Date.now() + 1000);
  }

  async alarm(): Promise<void> {
    if (!this.brainDumpId) return;

    try {
      const record = await this.db.getBrainDump(this.brainDumpId);
      if (!record) throw new Error('Brain dump not found');

      const constraints = JSON.parse(record.constraints_json);
      const assets = JSON.parse(record.assets_json);
      const questions = JSON.parse(record.questions_json);
      const desiredEndState = JSON.parse(record.desired_end_state_json);

      const bd: BrainDump = {
        projectName: record.project_name,
        coreProblem: record.core_problem,
        currentState: { artifacts: [], gaps: [], blockers: [] },
        constraints,
        desiredEndState,
        knownAssets: assets,
        openQuestions: questions,
        metadata: {
          capturedAt: record.created_at,
          operator: 'api',
          source: 'api',
          tags: [],
        },
      };

      const axes = decomposeBrainDump(bd);
      await this.db.updateAxes(this.brainDumpId, JSON.stringify(axes));

      const useRecursive = (record as any).max_depth > 0;
      const recursiveConfig: RecursiveConfig = {
        maxDepth: (record as any).max_depth || 3,
        branchingFactor: 3,
        batchStrategy: (record as any).batch_strategy || 'depth-first',
        atomicThreshold: 1,
      };

      let orchestrator;
      if (useRecursive) {
        try {
          const { RecursiveBrainDumpOrchestrator } = await import('@p31/brain-dump-orchestrator');
          orchestrator = new RecursiveBrainDumpOrchestrator({
            batchId: `do-${this.brainDumpId}`,
            brainDump: bd,
            axes: axes.map((a) => ({
              axisId: a.id,
              adapter: 'cortex-bridge',
              priority: 0,
              timeoutMs: 300000,
            })),
            maxConcurrency: Math.min(axes.length, 4),
            retryPolicy: { maxRetries: 2, backoffMs: 1000, retryableErrors: ['timeout', 'network'] },
            recursive: recursiveConfig,
          }, this.deps);
        } catch (err) {
          console.error('[OrchestratorDO] Failed to load recursive orchestrator, falling back to non-recursive:', err);
          orchestrator = new BrainDumpOrchestrator({
            batchId: `do-${this.brainDumpId}`,
            axes: axes.map((a) => ({
              axisId: a.id,
              adapter: 'cortex-bridge',
              priority: 0,
              timeoutMs: 300000,
            })),
            maxConcurrency: Math.min(axes.length, 4),
            retryPolicy: { maxRetries: 2, backoffMs: 1000, retryableErrors: ['timeout', 'network'] },
          }, this.deps);
        }
      } else {
        orchestrator = new BrainDumpOrchestrator({
          batchId: `do-${this.brainDumpId}`,
          axes: axes.map((a) => ({
            axisId: a.id,
            adapter: 'cortex-bridge',
            priority: 0,
            timeoutMs: 300000,
          })),
          maxConcurrency: Math.min(axes.length, 4),
          retryPolicy: { maxRetries: 2, backoffMs: 1000, retryableErrors: ['timeout', 'network'] },
        }, this.deps);
      }

      const result = await orchestrator.runAll();

      const convergence = result.convergenceReport || (() => {
        const checker = new GateChecker();
        return checker.checkAll(axes, result);
      })();
      await this.db.updateConvergence(this.brainDumpId, JSON.stringify(convergence));

      await this.db.updateStatus(
        this.brainDumpId,
        convergence.overall === 'PASS' ? 'completed' : 'failed'
      );
    } catch (error) {
      await this.db.updateStatus(
        this.brainDumpId!,
        'failed',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }
}
