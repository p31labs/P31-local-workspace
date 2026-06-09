export interface RetryOptions {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

export interface CircuitBreakerOptions {
  failureThreshold: number;
  recoveryTimeoutMs: number;
}

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failures = 0;
  private lastFailureTime = 0;

  constructor(
    private options: CircuitBreakerOptions
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.options.recoveryTimeoutMs) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    if (this.failures >= this.options.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  getState(): CircuitState {
    return this.state;
  }
}

export class RetryableFetch {
  private circuitBreakers = new Map<string, CircuitBreaker>();

  constructor(
    private retryOptions: RetryOptions = { maxRetries: 3, baseDelayMs: 500, maxDelayMs: 10000 },
    private circuitOptions: CircuitBreakerOptions = { failureThreshold: 5, recoveryTimeoutMs: 30000 }
  ) {}

  private getCircuitBreaker(name: string): CircuitBreaker {
    if (!this.circuitBreakers.has(name)) {
      this.circuitBreakers.set(name, new CircuitBreaker(this.circuitOptions));
    }
    return this.circuitBreakers.get(name)!;
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private calculateBackoff(attempt: number): number {
    const delay = this.retryOptions.baseDelayMs * Math.pow(2, attempt);
    const jitter = Math.random() * 0.3 * delay;
    return Math.min(delay + jitter, this.retryOptions.maxDelayMs);
  }

  async fetchWithRetry(
    url: string,
    options: RequestInit = {},
    circuitName?: string
  ): Promise<Response> {
    const circuit = circuitName ? this.getCircuitBreaker(circuitName) : null;
    let lastError = new Error('Max retries exceeded');

    for (let attempt = 0; attempt <= this.retryOptions.maxRetries; attempt++) {
      try {
        const fetchFn = async () => {
          const response = await fetch(url, {
            ...options,
            signal: options.signal || (typeof AbortSignal !== 'undefined' ? undefined : undefined)
          });
          if (!response.ok && response.status >= 500) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          return response;
        };

        if (circuit) {
          return await circuit.execute(fetchFn);
        } else {
          return await fetchFn();
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < this.retryOptions.maxRetries) {
          const delay = this.calculateBackoff(attempt);
          await this.sleep(delay);
        }
      }
    }

    throw lastError;
  }

  getCircuitState(name: string): CircuitState | undefined {
    return this.circuitBreakers.get(name)?.getState();
  }
}

export const defaultRetryableFetch = new RetryableFetch();
