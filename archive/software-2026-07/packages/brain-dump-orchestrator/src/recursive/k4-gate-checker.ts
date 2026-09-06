import type { Axis, AxisConvergenceStatus, ConvergenceResult, ConvergenceBlocker, GateCheckResult, OrchestrationResult } from '../types/index.js';
import { GateChecker } from '../convergence/gate-check.js';
import { K4LLMVerifier, K4HeuristicVerifier } from './k4-verifier.js';
import type { K4ContentProvider, K4Edge, K4EdgeResult, K4Mode, K4GateConfig, K4PersonaResult } from './k4-types.js';

export { K4Mode, K4GateConfig };

const DEFAULT_EDGES: K4Edge[] = ['factuality', 'relevance', 'formatting', 'constraints', 'bias', 'logic'];

const PERSONA_EDGES: Record<string, K4Edge[]> = {
  critic: ['factuality', 'bias'],
  refiner: ['relevance', 'formatting'],
  validator: ['constraints', 'logic'],
};

export class K4GateChecker {
  private config: K4GateConfig;
  private contentProvider?: K4ContentProvider;
  private baseChecker: GateChecker;

  constructor(config: K4GateConfig = { mode: 'fast' }, contentProvider?: K4ContentProvider) {
    this.config = config;
    this.contentProvider = contentProvider;
    this.baseChecker = new GateChecker();
  }

  async checkAll(axes: Axis[], result: OrchestrationResult): Promise<ConvergenceResult> {
    const baseResult = this.baseChecker.checkAll(axes, result);

    if (this.config.mode === 'off') {
      return baseResult;
    }

    if (baseResult.overall === 'FAIL') {
      return baseResult;
    }

    const verifier = this.config.mode === 'full'
      ? new K4LLMVerifier(this.config.llmEnv)
      : new K4HeuristicVerifier();

    const edges = this.config.edges || DEFAULT_EDGES;
    const consensusResults = await Promise.all(
      axes.map((axis) => this.verifyAxis(axis, result, verifier, edges))
    );

    const k4Verified: AxisConvergenceStatus[] = baseResult.axes.map((axisStatus, i) => {
      const consensus = consensusResults[i];
      const k4Checks: GateCheckResult[] = consensus.edges.map((edgeResult) => ({
        checkId: `k4-${edgeResult.edge}`,
        passed: edgeResult.passed,
        evidence: edgeResult.evidence,
        error: edgeResult.error,
      }));

      return {
        ...axisStatus,
        checks: [...axisStatus.checks, ...k4Checks],
      };
    });

    const allPass = k4Verified.every((v) => v.checks.every((c) => c.passed));

    return {
      ...baseResult,
      overall: allPass ? 'PASS' : 'FAIL',
      axes: k4Verified,
      blockers: allPass
        ? baseResult.blockers
        : [
            ...baseResult.blockers,
            {
              axisId: 'global',
              type: 'quality',
              severity: 'high',
              description: `K₄ isostatic gate failed (mode: ${this.config.mode}): one or more K₄ edges failed verification`,
            } as ConvergenceBlocker,
          ],
    };
  }

  private async verifyAxis(
    axis: Axis,
    result: OrchestrationResult,
    verifier: K4LLMVerifier | K4HeuristicVerifier,
    edges: K4Edge[]
  ): Promise<{ axisId: string; edges: K4EdgeResult[]; overall: boolean }> {
    const axisResult = result.axes[axis.id];

    if (!axisResult || !axisResult.success) {
      return {
        axisId: axis.id,
        edges: edges.map((edge) => ({ edge, passed: false, error: 'Axis execution failed' })),
        overall: false,
      };
    }

    const content = await this.getContent(axisResult.filesWritten || [], axis.id);

    const personas = Object.keys(PERSONA_EDGES) as Array<'critic' | 'refiner' | 'validator'>;
    const personaPromises = personas.map((persona) =>
      verifier.verify(persona, content, axis, PERSONA_EDGES[persona])
    );

    const personaResults = await Promise.all(personaPromises);

    const allEdges = personaResults.flatMap((pr) => pr.edges);
    const edgeMap = new Map(allEdges.map((e) => [e.edge, e] as [K4Edge, K4EdgeResult]));

    const consolidated = edges.map((edge) => {
      const found = edgeMap.get(edge);
      return found || { edge, passed: false, error: 'Edge not verified by any persona' };
    });

    return {
      axisId: axis.id,
      edges: consolidated,
      overall: personaResults.every((pr) => pr.overall),
    };
  }

  private async getContent(filePaths: string[], axisId: string): Promise<string> {
    if (!this.contentProvider) {
      return `[No content provider — ${filePaths.length} files for axis ${axisId}]`;
    }

    const parts = await Promise.all(
      filePaths.map(async (path) => {
        const content = await this.contentProvider!.getContent([path], axisId);
        return content || `[empty: ${path}]`;
      })
    );

    return parts.join('\n\n---\n\n');
  }
}
