/**
 * @file Circuit breaker state machine for Worker-to-Worker fetch chains.
 *
 * States:
 *  - CLOSED: normal operation, requests pass through.
 *  - OPEN: upstream failure detected, requests short-circuit immediately.
 *  - HALF_OPEN: after timeout, probe requests are allowed through.
 */

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerOptions {
  name: string;
  failureThreshold: number;
  recoveryTimeoutMs: number;
  probeTimeoutMs: number;
  retryMax?: number;
  retryBaseDelayMs?: number;
  onStateChange?: (name: string, state: CircuitState, previous: CircuitState) => void;
}

export interface BreakerStats {
  name: string;
  state: CircuitState;
  failureCount: number;
  lastFailureTime: number;
}

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failureCount = 0;
  private lastFailureTime = 0;
  private probeInFlight = false;

  constructor(private readonly opts: CircuitBreakerOptions) {}

  get currentState(): CircuitState {
    if (this.state === 'OPEN' && Date.now() - this.lastFailureTime > this.opts.recoveryTimeoutMs) {
      this.transition('HALF_OPEN');
    }
    return this.state;
  }

  get name(): string {
    return this.opts.name;
  }

  get failureCountValue(): number {
    return this.failureCount;
  }

  get lastFailureTimeValue(): number {
    return this.lastFailureTime;
  }

  get stats(): BreakerStats {
    return {
      name: this.opts.name,
      state: this.currentState,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
    };
  }

  async execute<T>(fn: () => Promise<T>, fallback?: () => Promise<T>): Promise<T> {
    const state = this.currentState;

    if (state === 'OPEN') {
      if (fallback) return fallback();
      throw new CircuitOpenError(this.opts.name);
    }

    if (state === 'HALF_OPEN') {
      if (this.probeInFlight) {
        if (fallback) return fallback();
        throw new CircuitOpenError(this.opts.name);
      }
      this.probeInFlight = true;
    }

    const maxRetries = this.opts.retryMax ?? 1;
    const baseDelay = this.opts.retryBaseDelayMs ?? 100;
    let attempt = 0;
    let lastErr: unknown;

    while (attempt <= maxRetries) {
      try {
        const result = await fn();
        this.onSuccess();
        return result;
      } catch (err) {
        lastErr = err;
        this.onFailure();
        if (attempt === maxRetries) break;
        const jitter = Math.random() * baseDelay;
        const delay = baseDelay * Math.pow(2, attempt) + jitter;
        await new Promise(r => setTimeout(r, delay));
      }
      attempt++;
    }

    if (fallback) return fallback();
    throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.probeInFlight = false;
    if (this.state !== 'CLOSED') {
      this.transition('CLOSED');
    }
  }

  private onFailure(): void {
    this.failureCount += 1;
    this.lastFailureTime = Date.now();
    this.probeInFlight = false;

    if (this.state === 'HALF_OPEN' || this.failureCount >= this.opts.failureThreshold) {
      this.transition('OPEN');
    }
  }

  private transition(next: CircuitState): void {
    const prev = this.state;
    this.state = next;
    if (prev !== next) {
      this.opts.onStateChange?.(this.opts.name, next, prev);
    }
  }
}

export class CircuitOpenError extends Error {
  constructor(name: string) {
    super(`Circuit '${name}' is OPEN`);
    this.name = 'CircuitOpenError';
  }
}
