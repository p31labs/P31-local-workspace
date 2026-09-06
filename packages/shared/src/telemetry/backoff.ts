/**
 * Exponential Backoff Utilities for P31 Labs
 * 
 * Provides exponential backoff strategies for retrying failed operations
 * with jitter to prevent thundering herd problems.
 */

export interface BackoffOptions {
  /** Base delay in milliseconds */
  baseDelay?: number;
  /** Maximum delay in milliseconds */
  maxDelay?: number;
  /** Exponential factor (default 2) */
  factor?: number;
  /** Jitter factor (0 to 1, default 0.1) */
  jitter?: number;
  /** Maximum number of retries */
  maxRetries?: number;
}

export interface BackoffResult {
  /** Delay in milliseconds before next retry */
  delay: number;
  /** Whether to continue retrying */
  shouldRetry: boolean;
  /** Current retry attempt number */
  attempt: number;
}

/**
 * Exponential backoff calculator with jitter
 */
export class ExponentialBackoff {
  private options: Required<BackoffOptions>;
  private currentAttempt: number = 0;

  constructor(options: BackoffOptions = {}) {
    this.options = {
      baseDelay: 1000,
      maxDelay: 60000,
      factor: 2,
      jitter: 0.1,
      maxRetries: 5,
      ...options
    };
  }

  /**
   * Calculate next delay and whether to retry
   */
  next(): BackoffResult {
    if (this.currentAttempt >= this.options.maxRetries) {
      return {
        delay: 0,
        shouldRetry: false,
        attempt: this.currentAttempt
      };
    }

    const exponentialDelay = this.options.baseDelay * Math.pow(this.options.factor, this.currentAttempt);
    const cappedDelay = Math.min(exponentialDelay, this.options.maxDelay);
    
    // Add jitter to prevent thundering herd
    const jitterAmount = cappedDelay * this.options.jitter * (Math.random() - 0.5);
    const finalDelay = Math.max(0, cappedDelay + jitterAmount);

    this.currentAttempt++;

    return {
      delay: Math.floor(finalDelay),
      shouldRetry: true,
      attempt: this.currentAttempt
    };
  }

  /**
   * Reset backoff state
   */
  reset(): void {
    this.currentAttempt = 0;
  }

  /**
   * Get current attempt number
   */
  getAttempt(): number {
    return this.currentAttempt;
  }
}

/**
 * Retry function with exponential backoff
 */
export async function withExponentialBackoff<T>(
  fn: () => Promise<T>,
  options: BackoffOptions = {}
): Promise<T> {
  const backoff = new ExponentialBackoff(options);
  
  while (true) {
    try {
      return await fn();
    } catch (error) {
      const result = backoff.next();
      
      if (!result.shouldRetry) {
        throw error;
      }
      
      await new Promise(resolve => setTimeout(resolve, result.delay));
    }
  }
}

/**
 * Retry function with custom retry condition
 */
export async function withConditionalBackoff<T>(
  fn: () => Promise<T>,
  shouldRetry: (error: any, attempt: number) => boolean,
  options: BackoffOptions = {}
): Promise<T> {
  const backoff = new ExponentialBackoff(options);
  
  while (true) {
    try {
      return await fn();
    } catch (error) {
      const result = backoff.next();
      
      if (!result.shouldRetry || !shouldRetry(error, result.attempt)) {
        throw error;
      }
      
      await new Promise(resolve => setTimeout(resolve, result.delay));
    }
  }
}

/**
 * P31 Labs default backoff configuration
 */
export const P31_BACKOFF_CONFIG = {
  baseDelay: 1000,
  maxDelay: 30000,
  factor: 2,
  jitter: 0.1,
  maxRetries: 3
};

/**
 * Create a retryable function with P31 Labs defaults
 */
export function createP31Retryable<T>(
  fn: () => Promise<T>,
  customOptions: Partial<BackoffOptions> = {}
) {
  const options = { ...P31_BACKOFF_CONFIG, ...customOptions };
  
  return () => withExponentialBackoff(fn, options);
}

/**
 * Decorator for adding exponential backoff to methods
 */
export function exponentialBackoff(options: BackoffOptions = {}) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args: any[]) {
      return withExponentialBackoff(() => originalMethod.apply(this, args), options);
    };
    
    return descriptor;
  };
}

export default ExponentialBackoff;