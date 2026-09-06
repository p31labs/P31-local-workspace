import type { Axis, AxisAgent, AgentRunResult, AgentPrompt } from '../types/index.js';
import { generateAxisPrompt } from './prompt-factory.js';
import { getRunner } from './runner.js';

export class AxisAgentRuntime {
  private agent: AxisAgent;

  constructor(agent: AxisAgent) {
    this.agent = agent;
  }

  async execute(): Promise<AgentRunResult> {
    this.agent.status = 'running';
    const axis: Axis = {
      id: this.agent.axisId,
      letter: this.agent.axisId.slice(-1).toUpperCase(),
      name: this.agent.axisId,
      focusArea: this.agent.mission,
      agentRole: this.agent.role,
      deliverable: this.agent.deliverables.map((d, i) => ({
        id: `D${i + 1}`,
        description: d,
        filePath: d,
        acceptanceCriteria: [],
      })),
      convergenceGate: {
        checks: this.agent.convergenceGate.map((c, i) => ({ id: `G${i + 1}`, description: c, type: 'custom' as const })),
        overallCriteria: 'All checks pass',
      },
      complexity: 'medium',
      dependencies: [],
      status: 'running',
    };

    const prompt = generateAxisPrompt(axis);
    const runner = getRunner(this.agent.runtime);
    const result = await runner.run(this.agent, prompt);
    this.agent.result = result;
    this.agent.status = result.success ? 'completed' : 'failed';
    return result;
  }

  getAgent(): AxisAgent {
    return this.agent;
  }
}
