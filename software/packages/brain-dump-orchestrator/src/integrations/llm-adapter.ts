import type { AxisAgent, AgentRunResult, AgentPrompt } from '../types/index.js';

export interface LLMConfig {
  provider: 'openai' | 'anthropic' | 'ollama' | 'deepseek' | 'gemini';
  apiKey?: string;
  baseUrl?: string;
  model: string;
}

export class LLMAdapter {
  constructor(private config: LLMConfig) {}

  async dispatch(agent: AxisAgent, prompt: AgentPrompt): Promise<AgentRunResult> {
    const startedAt = new Date().toISOString();
    const messages = [
      { role: 'system', content: prompt.system },
      { role: 'user', content: prompt.user },
    ];

    try {
      const response = await fetch(`${this.config.baseUrl || 'https://api.openai.com/v1'}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey ? { Authorization: `Bearer ${this.config.apiKey}` } : {}),
        },
        body: JSON.stringify({ model: this.config.model, messages, max_tokens: prompt.maxTokens || 8192 }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`LLM API error ${response.status}: ${text}`);
      }

      const data = (await response.json()) as { choices: Array<{ message: { content: string } }> };
      const output = data.choices[0]?.message?.content || '';
      const filesWritten = this.extractFiles(output, prompt.outputFiles);

      return {
        success: filesWritten.length > 0,
        filesWritten,
        statusLine: `Axis ${agent.axisId}: ${filesWritten.length} files extracted from LLM output`,
        startedAt,
        completedAt: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        filesWritten: [],
        statusLine: `Axis ${agent.axisId}: LLM dispatch failed`,
        startedAt,
        completedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'unknown',
      };
    }
  }

  supports(runtime: string): boolean {
    return runtime === 'llm-generic';
  }

  private extractFiles(output: string, expectedFiles: string[]): string[] {
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
}
