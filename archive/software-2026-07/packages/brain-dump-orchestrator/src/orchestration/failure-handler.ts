import type { OrchestrationResult, AxisConfig } from '../types/index.js';

export interface RetryConfig {
  maxRetries: number;
  backoffMs: number;
  retryableErrors: string[];
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  backoffMs: 1000,
  retryableErrors: ['timeout', 'ECONNREFUSED', 'rate_limit'],
};

export class FailureHandler {
  private retryConfig: RetryConfig;

  constructor(retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG) {
    this.retryConfig = retryConfig;
  }

  shouldRetry(error: string, retryCount: number): boolean {
    if (retryCount >= this.retryConfig.maxRetries) return false;
    return this.retryConfig.retryableErrors.some(e => error.toLowerCase().includes(e.toLowerCase())) || error.includes('stub');
  }

  getDelay(retryCount: number): number {
    return this.retryConfig.backoffMs * Math.pow(2, retryCount);
  }

  categorizeFailure(error: string): 'dependency' | 'quality' | 'timeout' | 'hallucination' | 'unknown' {
    if (/timeout|ETIMEDOUT/i.test(error)) return 'timeout';
    if (/ECONNREFUSED|ENOTFOUND|network/i.test(error)) return 'dependency';
    if (/hallucin|invalid|contradict/i.test(error)) return 'hallucination';
    if (/syntax|type|compile|lint/i.test(error)) return 'quality';
    return 'unknown';
  }

  async retryAxis(
    axisConfig: AxisConfig,
    attempt: number,
    orchestratorRunner: () => Promise<import('../types/index.js').AgentRunResult>,
  ): Promise<import('../types/index.js').AgentRunResult> {
    const delay = this.getDelay(attempt);
    await new Promise(resolve => setTimeout(resolve, delay));
    return orchestratorRunner();
  }
}
