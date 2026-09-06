import type { AxisAgent, AgentRunResult, AgentPrompt } from '../types/index.js';

export class AgentEngineAdapter {
  async dispatch(agent: AxisAgent, _prompt: AgentPrompt): Promise<AgentRunResult> {
    const startedAt = new Date().toISOString();
    return {
      success: false,
      filesWritten: [],
      statusLine: `AgentEngine integration stub for ${agent.axisId}`,
      startedAt,
      completedAt: new Date().toISOString(),
      error: 'AgentEngineAdapter is a stub — implement by importing AgentEngine from @p31/agent-engine',
    };
  }

  supports(runtime: string): boolean {
    return runtime === 'agent-engine';
  }
}
