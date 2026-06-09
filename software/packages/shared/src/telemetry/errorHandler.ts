/**
 * Comprehensive Error Handling System for P31 Labs
 * 
 * Provides centralized error handling, categorization, and recovery strategies
 * for the entire P31 Labs ecosystem.
 */

import React from 'react';

export interface ErrorContext {
  /** Component or module where error occurred */
  component?: string;
  /** User action that triggered the error */
  action?: string;
  /** Additional context data */
  context?: Record<string, any>;
  /** Error severity level */
  severity?: 'low' | 'medium' | 'high' | 'critical';
  /** Whether error should be reported to telemetry */
  reportable?: boolean;
}

export interface ErrorRecoveryStrategy {
  /** Strategy name */
  name: string;
  /** Function to attempt recovery */
  attempt: (error: Error, context: ErrorContext) => Promise<boolean>;
  /** Maximum number of recovery attempts */
  maxAttempts?: number;
  /** Delay between attempts (ms) */
  retryDelay?: number;
}

export interface ErrorHandlerOptions {
  /** Enable error recovery */
  enableRecovery?: boolean;
  /** Maximum number of recovery attempts per error */
  maxRecoveryAttempts?: number;
  /** Enable error reporting to telemetry */
  enableReporting?: boolean;
  /** Custom error recovery strategies */
  recoveryStrategies?: ErrorRecoveryStrategy[];
}

/**
 * Centralized error handler with recovery strategies
 */
export class ErrorHandler {
  private options: Required<ErrorHandlerOptions>;
  private recoveryAttempts: Map<string, number> = new Map();
  private errorCallbacks: Array<(error: Error, context: ErrorContext) => void> = [];

  constructor(options: ErrorHandlerOptions = {}) {
    this.options = {
      enableRecovery: true,
      maxRecoveryAttempts: 3,
      enableReporting: true,
      recoveryStrategies: [],
      ...options
    };
  }

  /**
   * Handle an error with optional recovery
   */
  async handle(error: Error, context: ErrorContext = {}): Promise<void> {
    const errorId = this.generateErrorId(error, context);
    
    // Log error details
    this.logError(error, context);
    
    // Report error if enabled
    if (this.options.enableReporting && context.reportable !== false) {
      this.reportError(error, context);
    }

    // Attempt recovery if enabled
    if (this.options.enableRecovery) {
      await this.attemptRecovery(error, context, errorId);
    }

    // Notify error callbacks
    this.errorCallbacks.forEach(callback => callback(error, context));
  }

  /**
   * Add error recovery strategy
   */
  addRecoveryStrategy(strategy: ErrorRecoveryStrategy): void {
    this.options.recoveryStrategies.push(strategy);
  }

  /**
   * Add error callback for notifications
   */
  addErrorCallback(callback: (error: Error, context: ErrorContext) => void): void {
    this.errorCallbacks.push(callback);
  }

  /**
   * Remove error callback
   */
  removeErrorCallback(callback: (error: Error, context: ErrorContext) => void): void {
    const index = this.errorCallbacks.indexOf(callback);
    if (index > -1) {
      this.errorCallbacks.splice(index, 1);
    }
  }

  /**
   * Log error details
   */
  private logError(error: Error, context: ErrorContext): void {
    const logLevel = this.getLogLevel(context.severity);
    const timestamp = new Date().toISOString();
    
    const logData = {
      timestamp,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        cause: (error as any).cause
      },
      context,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown'
    };

    switch (logLevel) {
      case 'error':
        console.error('[P31 Error]', logData);
        break;
      case 'warn':
        console.warn('[P31 Warning]', logData);
        break;
      case 'info':
        console.info('[P31 Info]', logData);
        break;
      default:
        console.log('[P31 Debug]', logData);
    }
  }

  /**
   * Report error to telemetry system
   */
  private reportError(error: Error, context: ErrorContext): void {
    // This would integrate with the telemetry system
    // For now, we'll use console.error as a placeholder
    console.error('[P31 Telemetry]', {
      error: {
        name: error.name,
        message: error.message,
        component: context.component,
        action: context.action,
        severity: context.severity
      },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Attempt error recovery
   */
  private async attemptRecovery(error: Error, context: ErrorContext, errorId: string): Promise<void> {
    const currentAttempts = this.recoveryAttempts.get(errorId) || 0;
    
    if (currentAttempts >= this.options.maxRecoveryAttempts) {
      console.warn(`[P31 Recovery] Max recovery attempts reached for error: ${error.message}`);
      return;
    }

    this.recoveryAttempts.set(errorId, currentAttempts + 1);

    // Try each recovery strategy
    for (const strategy of this.options.recoveryStrategies) {
      try {
        const recovered = await strategy.attempt(error, context);
        if (recovered) {
          console.info(`[P31 Recovery] Successfully recovered using strategy: ${strategy.name}`);
          this.recoveryAttempts.delete(errorId);
          return;
        }
      } catch (recoveryError) {
        console.warn(`[P31 Recovery] Strategy ${strategy.name} failed:`, recoveryError);
      }
    }

    // If no strategies worked, try default recovery
    await this.attemptDefaultRecovery(error, context);
  }

  /**
   * Attempt default recovery strategies
   */
  private async attemptDefaultRecovery(error: Error, context: ErrorContext): Promise<void> {
    // Network error recovery
    if (this.isNetworkError(error)) {
      await this.handleNetworkError(error, context);
      return;
    }

    // Storage error recovery
    if (this.isStorageError(error)) {
      await this.handleStorageError(error, context);
      return;
    }

    // Component error recovery
    if (this.isComponentError(error)) {
      await this.handleComponentError(error, context);
      return;
    }

    console.warn('[P31 Recovery] No suitable recovery strategy found');
  }

  /**
   * Handle network errors
   */
  private async handleNetworkError(error: Error, context: ErrorContext): Promise<void> {
    console.info('[P31 Recovery] Attempting network error recovery...');
    
    // Clear any cached data that might be causing issues
    if (typeof window !== 'undefined' && 'caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      } catch (cacheError) {
        console.warn('Failed to clear cache during network error recovery:', cacheError);
      }
    }

    // Retry after delay
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  /**
   * Handle storage errors
   */
  private async handleStorageError(error: Error, context: ErrorContext): Promise<void> {
    console.info('[P31 Recovery] Attempting storage error recovery...');
    
    // Clear problematic storage
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.clear();
      } catch (storageError) {
        console.warn('Failed to clear localStorage during recovery:', storageError);
      }
    }

    if (typeof indexedDB !== 'undefined') {
      try {
        const databases = await this.getIndexedDBDatabases();
        for (const dbName of databases) {
          await new Promise((resolve, reject) => {
            const request = indexedDB.deleteDatabase(dbName);
            request.onsuccess = () => resolve(undefined);
            request.onerror = () => reject(request.error);
          });
        }
      } catch (dbError) {
        console.warn('Failed to clear IndexedDB during recovery:', dbError);
      }
    }
  }

  /**
   * Handle component errors
   */
  private async handleComponentError(error: Error, context: ErrorContext): Promise<void> {
    console.info('[P31 Recovery] Attempting component error recovery...');
    
    // Reload the application if it's a critical component error
    if (context.severity === 'critical' && typeof window !== 'undefined') {
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  }

  /**
   * Get log level based on severity
   */
  private getLogLevel(severity?: string): 'error' | 'warn' | 'info' | 'debug' {
    switch (severity) {
      case 'critical':
      case 'high':
        return 'error';
      case 'medium':
        return 'warn';
      case 'low':
        return 'info';
      default:
        return 'debug';
    }
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(error: Error, context: ErrorContext): string {
    return `${error.name}-${error.message}-${context.component || 'unknown'}-${Date.now()}`;
  }

  /**
   * Check if error is a network error
   */
  private isNetworkError(error: Error): boolean {
    return error.name === 'NetworkError' || 
           error.message.includes('fetch') ||
           error.message.includes('network') ||
           error.message.includes('timeout');
  }

  /**
   * Check if error is a storage error
   */
  private isStorageError(error: Error): boolean {
    return error.name === 'QuotaExceededError' ||
           error.name === 'SecurityError' ||
           error.message.includes('storage') ||
           error.message.includes('indexedDB') ||
           error.message.includes('localStorage');
  }

  /**
   * Check if error is a component error
   */
  private isComponentError(error: Error): boolean {
    return error.message.includes('component') ||
           error.message.includes('render') ||
           error.message.includes('React');
  }

  /**
   * Get list of IndexedDB databases
   */
  private async getIndexedDBDatabases(): Promise<string[]> {
    if (typeof window === 'undefined') return [];
    
    try {
      // indexedDB.databases() returns a Promise<IDBDatabaseInfo[]> in modern browsers
      const databases = await indexedDB.databases();
      return databases.map(db => db.name).filter((name): name is string => name !== undefined);
    } catch (error) {
      return [];
    }
  }

  /**
   * Create error boundary for React components
   */
  createErrorBoundary() {
    return class P31ErrorBoundary extends React.Component<
      { children: React.ReactNode; fallback?: React.ComponentType<any> },
      { hasError: boolean; error?: Error }
    > {
      constructor(props: any) {
        super(props);
        this.state = { hasError: false };
      }

      static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
      }

      componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        const errorHandler = new ErrorHandler();
        errorHandler.handle(error, {
          component: 'React Error Boundary',
          action: 'render',
          context: errorInfo,
          severity: 'high',
          reportable: true
        });
      }

      render() {
        if (this.state.hasError) {
          const FallbackComponent = this.props.fallback;
          if (FallbackComponent) {
            return React.createElement(FallbackComponent, { error: this.state.error });
          }
          
          return React.createElement('div', { 
            style: { 
              padding: '20px', 
              textAlign: 'center',
              color: '#666'
            } 
          }, [
            React.createElement('h2', { key: 'title' }, 'Something went wrong'),
            React.createElement('p', { key: 'message' }, 'The application encountered an error. Please try refreshing the page.'),
            React.createElement('button', {
              key: 'refresh',
              onClick: () => window.location.reload(),
              style: {
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }
            }, 'Refresh Page')
          ]);
        }

        return this.props.children;
      }
    };
  }
}

/**
 * P31 Labs default error handler
 */
export const p31ErrorHandler = new ErrorHandler({
  enableRecovery: true,
  maxRecoveryAttempts: 3,
  enableReporting: true
});

/**
 * Create a retryable function with error handling
 */
export function withErrorHandler<T>(
  fn: () => Promise<T>,
  context: ErrorContext = {},
  errorHandler: ErrorHandler = p31ErrorHandler
): Promise<T> {
  return fn().catch(async (error) => {
    await errorHandler.handle(error, context);
    throw error;
  });
}

/**
 * Decorator for adding error handling to methods
 */
export function errorHandled(context: ErrorContext = {}) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args: any[]) {
      try {
        return await originalMethod.apply(this, args);
      } catch (error) {
        // Convert unknown error to Error type
        const errorToHandle = error instanceof Error 
          ? error 
          : new Error(String(error));
        await p31ErrorHandler.handle(errorToHandle, {
          ...context,
          component: target.constructor.name,
          action: propertyKey
        });
        throw error;
      }
    };
    
    return descriptor;
  };
}

export default ErrorHandler;