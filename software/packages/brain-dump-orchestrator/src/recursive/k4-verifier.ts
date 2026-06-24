import type { Axis, AgentPrompt, AxisAgent } from '../types/index.js';
import { GenericLLMRunner } from '../agents/runner.js';
import type { K4Edge, K4EdgeResult, K4PersonaResult, K4Verifier } from './k4-types.js';

export class K4LLMVerifier {
  constructor(private env?: { apiKey?: string; baseUrl?: string; model?: string }) {}

  async verify(persona: string, content: string, axis: Axis, edges: K4Edge[]): Promise<K4PersonaResult> {
    const runner = new GenericLLMRunner(this.env);
    const syntheticAgent: AxisAgent = {
      id: `k4-${persona}-${axis.id}`,
      axisId: axis.id,
      role: `${persona.charAt(0).toUpperCase() + persona.slice(1)} Agent`,
      mission: `K4 verification: ${axis.focusArea}`,
      context: '',
      criticalDesignRules: [],
      constraints: [],
      deliverables: [],
      convergenceGate: [],
      runtime: 'llm-generic',
      status: 'queued',
    };

    const prompt = this.buildPrompt(persona, content, axis, edges);
    const start = Date.now();
    const K4_TIMEOUT_MS = 30000;

    try {
      const result = await Promise.race([
        runner.run(syntheticAgent, prompt),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('K4 LLM timeout')), K4_TIMEOUT_MS)),
      ]);
      const latencyMs = Date.now() - start;
      const parsed = this.parseResult(result, edges);
      return { persona: persona as K4PersonaResult['persona'], edges: parsed.edges, overall: parsed.overall, latencyMs };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'unknown';
      return {
        persona: persona as K4PersonaResult['persona'],
        edges: edges.map(edge => ({ edge, passed: false, error: message })),
        overall: false,
        latencyMs: Date.now() - start,
      };
    }
  }

  private buildPrompt(persona: string, content: string, axis: Axis, edges: K4Edge[]): AgentPrompt {
    const edgeDescriptions: Record<K4Edge, string> = {
      factuality: 'No hallucinations, fabricated APIs, or invented library names',
      relevance: 'Directly addresses the axis mission and deliverables',
      formatting: 'Complete files with proper syntax, no truncation',
      constraints: 'Respects project constraints and non-negotiables',
      bias: 'No harmful stereotypes, balanced perspective, safe output',
      logic: 'Sound logic, no contradictions, follows from inputs',
    };

    const edgeChecks = edges.map(e => `- ${e}: ${edgeDescriptions[e]}`).join('\n');

    const personaInstructions: Record<string, string> = {
      critic: `You are a rigorous technical CRITIC. Your job is to find flaws, errors, hallucinations, and gaps in the following output. Be harsh but fair. Identify specific issues with file paths and line numbers where possible.`,
      refiner: `You are a pragmatic REFINER. Your job is to identify concrete improvements needed to meet the acceptance criteria. List specific actionable changes.`,
      validator: `You are a final VALIDATOR. Your job is to perform the final K₄ gate check. You must verify ALL of the following edges and pass ONLY if every single edge passes:\n${edgeChecks}`,
    };

    const system = `${personaInstructions[persona]}\n\nOutput JSON only: { "edges": [{ "edge": string, "passed": boolean, "evidence"?: string, "error"?: string }], "overall": boolean }`;

    const user = `
## Axis: ${axis.name} (${axis.id})
**Mission:** ${axis.focusArea}
**Deliverables:** ${axis.deliverable.map(d => d.filePath).join(', ')}

## Output Content to Verify:
${content}

## Verification Task:
Check the ${edges.length} assigned edges. Return JSON only.`;

    return { system, user, outputFiles: [] };
  }

  private parseResult(result: { success: boolean; statusLine: string }, edges: K4Edge[]): { edges: K4EdgeResult[]; overall: boolean } {
    if (!result.success) {
      return {
        edges: edges.map(edge => ({ edge, passed: false, error: result.statusLine })),
        overall: false,
      };
    }

    try {
      const jsonMatch = result.statusLine.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return {
          edges: edges.map(edge => ({ edge, passed: false, error: 'Could not parse JSON from LLM response' })),
          overall: false,
        };
      }
      const parsed = JSON.parse(jsonMatch[0]) as { edges?: Array<{ edge: string; passed: boolean; evidence?: string; error?: string }>; overall?: boolean };
      const edgeMap = new Map<K4Edge, { passed: boolean; evidence?: string; error?: string }>();
      for (const e of parsed.edges || []) {
        edgeMap.set(e.edge as K4Edge, { passed: e.passed, evidence: e.evidence, error: e.error });
      }
      const results = edges.map((edge) => {
        const found = edgeMap.get(edge);
        return {
          edge,
          passed: found?.passed ?? false,
          evidence: found?.evidence,
          error: found?.error,
        };
      });
      return { edges: results, overall: parsed.overall ?? results.every(e => e.passed) };
    } catch {
      return {
        edges: edges.map(edge => ({ edge, passed: false, error: 'JSON parse error' })),
        overall: false,
      };
    }
  }
}

export class K4HeuristicVerifier implements K4Verifier {
  async verify(_persona: string, content: string, _axis: Axis, edges: K4Edge[]): Promise<K4PersonaResult> {
    const length = content.length;
    const hasCode = /```|### FILE:|function |class |import |export /.test(content);
    const hasErrors = /(error|Error|TODO|FIXME|console\.log)/.test(content);
    const hasMarkdown = content.includes('#') || content.includes('##');
    const isStub = /stub|placeholder|not implemented|TODO/.test(content);

    const edgeResults: K4EdgeResult[] = edges.map(edge => {
      switch (edge) {
        case 'factuality':
          return { edge, passed: !isStub, evidence: isStub ? 'Output contains stub placeholders' : 'No obvious hallucination markers' };
        case 'relevance':
          return { edge, passed: length > 200, evidence: length > 200 ? `Output length: ${length} chars` : 'Output too short' };
        case 'formatting':
          return { edge, passed: hasCode || hasMarkdown, evidence: hasCode ? 'Contains code blocks' : 'Contains markdown structure' };
        case 'constraints':
          return { edge, passed: !hasErrors, evidence: hasErrors ? 'Contains error markers or TODOs' : 'Clean output' };
        case 'bias':
          return { edge, passed: true, evidence: 'Heuristic: no bias check in fast mode' };
        case 'logic':
          return { edge, passed: length > 100, evidence: length > 100 ? `Sufficient length for ${length} chars` : 'May be too brief for logical depth' };
        default:
          return { edge, passed: true };
      }
    });

    return {
      persona: _persona as K4PersonaResult['persona'],
      edges: edgeResults,
      overall: edgeResults.every(e => e.passed),
      latencyMs: 0,
    };
  }
}
