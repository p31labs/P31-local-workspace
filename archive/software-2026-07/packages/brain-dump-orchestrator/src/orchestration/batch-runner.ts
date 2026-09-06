import type { OrchestrationConfig, OrchestrationResult, StatusEntry, AxisConfig } from '../types/index.js';
import { BrainDumpOrchestrator } from './orchestrator.js';

export class BatchRunner {
  private config: OrchestrationConfig;

  constructor(config: OrchestrationConfig) {
    this.config = config;
  }

  async run(): Promise<OrchestrationResult> {
    const orchestrator = new BrainDumpOrchestrator(this.config);
    return orchestrator.runAll();
  }

  getConfig(): OrchestrationConfig {
    return this.config;
  }
}
