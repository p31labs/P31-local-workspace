import type { AxisAgent, AgentRunResult, AgentPrompt } from '../types/index.js';

export interface DurableObjectNamespaceLike {
  idFromName(name: string): { toString: () => string };
  get(id: { toString: () => string }): { fetch: (request: Request) => Promise<Response> };
}

export interface AgentRunner {
  run(agent: AxisAgent, prompt: AgentPrompt): Promise<AgentRunResult>;
  supports(runtime: string): boolean;
}

export class ClaudeCodeRunner implements AgentRunner {
  supports(runtime: string): boolean {
    return runtime === 'claude-code';
  }

  async run(agent: AxisAgent, prompt: AgentPrompt): Promise<AgentRunResult> {
    const startedAt = new Date().toISOString();
    return {
      success: false,
      filesWritten: [],
      statusLine: `ClaudeCodeRunner is a Node.js-only adapter and cannot run in Cloudflare Workers. Use 'cortex-bridge' or 'llm-generic' instead.`,
      startedAt,
      completedAt: new Date().toISOString(),
      error: 'ClaudeCodeRunner unavailable in Worker runtime',
    };
  }
}

export class GenericLLMRunner implements AgentRunner {
  constructor(private env?: { apiKey?: string; baseUrl?: string; model?: string }) {}

  supports(runtime: string): boolean {
    return runtime === 'llm-generic';
  }

  async run(agent: AxisAgent, prompt: AgentPrompt): Promise<AgentRunResult> {
    const startedAt = new Date().toISOString();
    const baseUrl = this.env?.baseUrl || 'https://api.anthropic.com';
    const apiKey = this.env?.apiKey;
    const model = this.env?.model || 'claude-3-5-haiku-20241022';

    if (!apiKey) {
      return {
        success: false,
        filesWritten: [],
        statusLine: `LLM adapter not configured for ${agent.axisId}`,
        startedAt,
        completedAt: new Date().toISOString(),
        error: 'Missing API key for llm-generic runner',
      };
    }

    try {
      const response = await fetch(`${baseUrl}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          max_tokens: 4096,
          system: prompt.system,
          messages: [{ role: 'user', content: prompt.user }],
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        return {
          success: false,
          filesWritten: [],
          statusLine: `LLM API error for ${agent.axisId}`,
          startedAt,
          completedAt: new Date().toISOString(),
          error: `HTTP ${response.status}: ${errText}`,
        };
      }

      const data = await response.json();
      const content = data.content?.[0]?.text || '';
      const filesWritten = extractFilePaths(content, prompt.outputFiles);

      return {
        success: true,
        filesWritten,
        statusLine: `Axis ${agent.axisId}: LLM completed, ${filesWritten.length} files extracted`,
        startedAt,
        completedAt: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        filesWritten: [],
        statusLine: `Axis ${agent.axisId}: LLM failed — ${error instanceof Error ? error.message : 'unknown'}`,
        startedAt,
        completedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'unknown',
      };
    }
  }
}

export class CortexBridgeAdapter implements AgentRunner {
  constructor(private env?: { CORTEX_DO?: DurableObjectNamespaceLike }) {}

  supports(runtime: string): boolean {
    return runtime === 'cortex-bridge';
  }

  async run(agent: AxisAgent, prompt: AgentPrompt): Promise<AgentRunResult> {
    const startedAt = new Date().toISOString();

    if (!this.env?.CORTEX_DO) {
      return {
        success: false,
        filesWritten: [],
        statusLine: `Cortex bridge not bound for ${agent.axisId}`,
        startedAt,
        completedAt: new Date().toISOString(),
        error: 'CORTEX_DO binding missing',
      };
    }

    try {
      const doName = this.mapRoleToDO(agent.role);
      const id = this.env.CORTEX_DO.idFromName(doName);
      const stub = this.env.CORTEX_DO.get(id);

      const resp = await stub.fetch(new Request('http://internal/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.user,
          system: prompt.system,
          axisId: agent.axisId,
          deliverables: prompt.outputFiles,
        }),
      }));

      const data = await resp.json() as { ok: boolean; files?: Record<string, string>; error?: string };

      if (!resp.ok || !data.ok) {
        return {
          success: false,
          filesWritten: [],
          statusLine: `Cortex bridge failed: ${data.error || 'unknown'}`,
          startedAt,
          completedAt: new Date().toISOString(),
          error: data.error || 'Cortex DO dispatch failed',
        };
      }

      const filesWritten = Object.keys(data.files || {});
      return {
        success: true,
        filesWritten,
        statusLine: `Axis ${agent.axisId}: cortex bridge executed, ${filesWritten.length} files returned`,
        startedAt,
        completedAt: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        filesWritten: [],
        statusLine: `Axis ${agent.axisId}: cortex bridge error — ${error instanceof Error ? error.message : 'unknown'}`,
        startedAt,
        completedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'unknown',
      };
    }
  }

  private mapRoleToDO(role: string): string {
    const map: Record<string, string> = {
      'Legal Architect': 'LegalAgentDO',
      'Security Architect': 'SecurityAgentDO',
      'Grant Architect': 'GrantAgentDO',
      'Content Architect': 'ContentAgentDO',
      'Financial Architect': 'FinanceAgentDO',
    };
    const lower = role.toLowerCase();
    for (const [key, value] of Object.entries(map)) {
      if (lower.includes(key.toLowerCase().replace(' architect', ''))) {
        return value;
      }
    }
    return 'GenericAgentDO';
  }
}

export class NoOpRunner implements AgentRunner {
  supports(runtime: string): boolean {
    return runtime === 'noop';
  }

  async run(agent: AxisAgent, prompt: AgentPrompt): Promise<AgentRunResult> {
    const startedAt = new Date().toISOString();
    return {
      success: true,
      filesWritten: [],
      statusLine: `NoOp: ${agent.axisId} skipped`,
      startedAt,
      completedAt: new Date().toISOString(),
    };
  }
}

const runners: AgentRunner[] = [new ClaudeCodeRunner(), new GenericLLMRunner(), new CortexBridgeAdapter(), new NoOpRunner()];

export function getRunner(runtime: string): AgentRunner {
  const runner = runners.find(r => r.supports(runtime));
  if (!runner) throw new Error(`No runner available for runtime: ${runtime}`);
  return runner;
}

export function extractFilePaths(output: string, expectedFiles: string[]): string[] {
  const files: string[] = [];
  const regex = /### FILE:\s*(.+)/g;
  let match;
  while ((match = regex.exec(output)) !== null) {
    const filePath = match[1].trim();
    if (expectedFiles.some(f => filePath.endsWith(f) || filePath === f)) {
      files.push(filePath);
    }
  }
  return files.length > 0 ? files : expectedFiles;
}
