/**
 * Circuit Breaker Pattern for P31 Labs Communication Resilience
 * 
 * Provides circuit breaker functionality to prevent cascading failures
 * in communication systems and external API calls.
 */

export interface CircuitBreakerOptions {
  /** Failure threshold before opening circuit */
  failureThreshold?: number;
  /** Success threshold before closing circuit */
  recoveryThreshold?: number;
  /** Timeout in ms before considering request failed */
  timeout?: number;
  /** Time in ms to wait before attempting recovery */
  resetTimeout?: number;
  /** Name for logging and monitoring */
  name?: string;
}

export interface CircuitBreakerState {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failures: number;
  successes: number;
  lastFailureTime: number;
  lastSuccessTime: number;
}

/**
 * Circuit Breaker implementation for communication resilience
 */
export class CircuitBreaker {
  private options: Required<CircuitBreakerOptions>;
  private state: CircuitBreakerState;
  private pendingRequests: number = 0;

  constructor(options: CircuitBreakerOptions = {}) {
    this.options = {
      failureThreshold: 5,
      recoveryThreshold: 3,
      timeout: 30000, // 30 seconds
      resetTimeout: 60000, // 1 minute
      name: 'CircuitBreaker',
      ...options
    };

    this.state = {
      state: 'CLOSED',
      failures: 0,
      successes: 0,
      lastFailureTime: 0,
      lastSuccessTime: 0
    };
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.checkState();

    if (this.state.state === 'OPEN') {
      throw new CircuitOpenError(`${this.options.name} circuit is OPEN`);
    }

    this.pendingRequests++;
    
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new TimeoutError(`${this.options.name} request timed out`)), this.options.timeout);
      });

      const result = await Promise.race([fn(), timeoutPromise]);
      
      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    } finally {
      this.pendingRequests--;
    }
  }

  /**
   * Check and update circuit state
   */
  private checkState(): void {
    const now = Date.now();

    switch (this.state.state) {
      case 'OPEN':
        if (now - this.state.lastFailureTime >= this.options.resetTimeout) {
          this.state.state = 'HALF_OPEN';
          this.state.successes = 0;
        }
        break;

      case 'HALF_OPEN':
        if (this.state.successes >= this.options.recoveryThreshold) {
          this.state.state = 'CLOSED';
          this.state.failures = 0;
          this.state.successes = 0;
        } else if (this.state.failures > 0) {
          this.state.state = 'OPEN';
          this.state.lastFailureTime = now;
        }
        break;

      case 'CLOSED':
        if (this.state.failures >= this.options.failureThreshold) {
          this.state.state = 'OPEN';
          this.state.lastFailureTime = now;
        }
        break;
    }
  }

  /**
   * Record a successful request
   */
  private recordSuccess(): void {
    this.state.successes++;
    this.state.lastSuccessTime = Date.now();
    
    if (this.state.state === 'HALF_OPEN') {
      this.checkState();
    }
  }

  /**
   * Record a failed request
   */
  private recordFailure(): void {
    this.state.failures++;
    this.state.lastFailureTime = Date.now();
    this.checkState();
  }

  /**
   * Get current circuit state
   */
  getState(): CircuitBreakerState {
    return { ...this.state };
  }

  /**
   * Force circuit to open (for testing or emergency scenarios)
   */
  open(): void {
    this.state.state = 'OPEN';
    this.state.lastFailureTime = Date.now();
  }

  /**
   * Force circuit to close (for testing or recovery)
   */
  close(): void {
    this.state.state = 'CLOSED';
    this.state.failures = 0;
    this.state.successes = 0;
  }

  /**
   * Reset circuit breaker state
   */
  reset(): void {
    this.state = {
      state: 'CLOSED',
      failures: 0,
      successes: 0,
      lastFailureTime: 0,
      lastSuccessTime: 0
    };
    this.pendingRequests = 0;
  }
}

/**
 * Circuit breaker error for when circuit is open
 */
export class CircuitOpenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CircuitOpenError';
  }
}

/**
 * Timeout error for when requests exceed timeout
 */
export class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TimeoutError';
  }
}

/**
 * Create a circuit breaker with default P31 Labs configuration
 */
export function createP31CircuitBreaker(name: string, options: Partial<CircuitBreakerOptions> = {}): CircuitBreaker {
  return new CircuitBreaker({
    name,
    failureThreshold: 3,
    recoveryThreshold: 2,
    timeout: 15000, // 15 seconds for P31 Labs
    resetTimeout: 30000, // 30 seconds for P31 Labs
    ...options
  });
}

/**
 * Decorator for adding circuit breaker protection to methods
 */
export function circuitBreaker(options: CircuitBreakerOptions = {}) {
  const breaker = new CircuitBreaker(options);
  
  return function(_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args: any[]) {
      return breaker.execute(() => originalMethod.apply(this, args));
    };
    
    return descriptor;
  };
}

export default CircuitBreaker;