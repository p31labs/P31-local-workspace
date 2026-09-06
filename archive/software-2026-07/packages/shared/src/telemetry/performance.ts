/**
 * Performance Monitoring Utilities for P31 Labs
 * 
 * Provides comprehensive performance monitoring, metrics collection,
 * and communication bottleneck detection for the P31 Labs ecosystem.
 */

export interface PerformanceMetrics {
  /** Timestamp when metrics were collected */
  timestamp: number;
  /** Component or module name */
  component: string;
  /** Operation name */
  operation: string;
  /** Duration in milliseconds */
  duration: number;
  /** Memory usage in bytes */
  memoryUsage?: number;
  /** Network latency in milliseconds */
  networkLatency?: number;
  /** Error count */
  errorCount?: number;
  /** Success rate percentage */
  successRate?: number;
}

export interface CommunicationMetrics extends PerformanceMetrics {
  /** Type of communication (HTTP, WebSocket, etc.) */
  communicationType: 'HTTP' | 'WebSocket' | 'IndexedDB' | 'LocalStorage' | 'BroadcastChannel';
  /** Request/response size in bytes */
  dataSize?: number;
  /** Retry count */
  retryCount?: number;
  /** Connection status */
  connectionStatus?: 'connected' | 'disconnected' | 'reconnecting';
}

export interface PerformanceThresholds {
  /** Maximum acceptable duration in milliseconds */
  maxDuration?: number;
  /** Maximum acceptable memory usage in bytes */
  maxMemoryUsage?: number;
  /** Minimum acceptable success rate percentage */
  minSuccessRate?: number;
  /** Maximum acceptable network latency in milliseconds */
  maxNetworkLatency?: number;
}

export interface PerformanceAlert {
  /** Alert type */
  type: 'performance' | 'communication' | 'resource' | 'error';
  /** Alert severity */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** Alert message */
  message: string;
  /** Component affected */
  component: string;
  /** Timestamp */
  timestamp: number;
  /** Metrics that triggered the alert */
  metrics: PerformanceMetrics;
}

/**
 * Performance monitoring system for P31 Labs
 */
export class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private thresholds: PerformanceThresholds = {};
  private alertCallbacks: Array<(alert: PerformanceAlert) => void> = [];
  private monitoringEnabled: boolean = true;

  /**
   * Set performance thresholds
   */
  setThresholds(thresholds: PerformanceThresholds): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }

  /**
   * Record performance metrics
   */
  recordMetrics(metrics: PerformanceMetrics): void {
    if (!this.monitoringEnabled) return;

    this.metrics.push({
      ...metrics,
      timestamp: Date.now()
    });

    // Check thresholds and trigger alerts
    this.checkThresholds(metrics);
  }

  /**
   * Measure execution time of a function
   */
  async measure<T>(
    component: string,
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();
    let memoryBefore: number | undefined;

    // Get memory usage if available
    if ((performance as any).memory) {
      memoryBefore = (performance as any).memory.usedJSHeapSize;
    }

    try {
      const result = await fn();
      const duration = performance.now() - startTime;
      
      // Get memory usage after
      let memoryAfter: number | undefined;
      if ((performance as any).memory) {
        memoryAfter = (performance as any).memory.usedJSHeapSize;
      }

      this.recordMetrics({
        component,
        operation,
        duration,
        memoryUsage: memoryAfter,
        timestamp: Date.now()
      });

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.recordMetrics({
        component,
        operation,
        duration,
        errorCount: 1,
        timestamp: Date.now()
      });

      throw error;
    }
  }

  /**
   * Measure communication performance
   */
  async measureCommunication<T>(
    component: string,
    operation: string,
    communicationType: CommunicationMetrics['communicationType'],
    fn: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();
    const startTimestamp = Date.now();

    try {
      const result = await fn();
      const duration = performance.now() - startTime;
      const networkLatency = Date.now() - startTimestamp;

      this.recordMetrics({
        component,
        operation,
        duration,
        networkLatency,
        successRate: 100,
        timestamp: Date.now()
      });

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      const networkLatency = Date.now() - startTimestamp;

      this.recordMetrics({
        component,
        operation,
        duration,
        networkLatency,
        errorCount: 1,
        successRate: 0,
        timestamp: Date.now()
      });

      throw error;
    }
  }

  /**
   * Get performance summary
   */
  getSummary(component?: string): {
    totalOperations: number;
    averageDuration: number;
    maxDuration: number;
    minDuration: number;
    totalErrors: number;
    successRate: number;
    memoryUsage: number;
  } {
    const filteredMetrics = component 
      ? this.metrics.filter(m => m.component === component)
      : this.metrics;

    if (filteredMetrics.length === 0) {
      return {
        totalOperations: 0,
        averageDuration: 0,
        maxDuration: 0,
        minDuration: 0,
        totalErrors: 0,
        successRate: 0,
        memoryUsage: 0
      };
    }

    const totalDuration = filteredMetrics.reduce((sum, m) => sum + m.duration, 0);
    const totalErrors = filteredMetrics.reduce((sum, m) => sum + (m.errorCount || 0), 0);
    const totalSuccess = filteredMetrics.length - totalErrors;
    const memoryUsage = filteredMetrics.reduce((sum, m) => sum + (m.memoryUsage || 0), 0) / filteredMetrics.length;

    return {
      totalOperations: filteredMetrics.length,
      averageDuration: totalDuration / filteredMetrics.length,
      maxDuration: Math.max(...filteredMetrics.map(m => m.duration)),
      minDuration: Math.min(...filteredMetrics.map(m => m.duration)),
      totalErrors,
      successRate: (totalSuccess / filteredMetrics.length) * 100,
      memoryUsage
    };
  }

  /**
   * Get communication performance summary
   */
  getCommunicationSummary(): {
    http: { averageLatency: number; totalRequests: number; successRate: number };
    webSocket: { averageLatency: number; totalConnections: number; successRate: number };
    storage: { averageLatency: number; totalOperations: number; successRate: number };
  } {
    // Filter metrics that have communicationType (CommunicationMetrics)
    const httpMetrics = this.metrics.filter((m): m is CommunicationMetrics => 
      'communicationType' in m && (m as CommunicationMetrics).communicationType === 'HTTP'
    );
    const webSocketMetrics = this.metrics.filter((m): m is CommunicationMetrics => 
      'communicationType' in m && (m as CommunicationMetrics).communicationType === 'WebSocket'
    );
    const storageMetrics = this.metrics.filter((m): m is CommunicationMetrics => 
      'communicationType' in m && (
        (m as CommunicationMetrics).communicationType === 'IndexedDB' ||
        (m as CommunicationMetrics).communicationType === 'LocalStorage' ||
        (m as CommunicationMetrics).communicationType === 'BroadcastChannel'
      )
    );

    return {
      http: this.getHttpSummary(httpMetrics),
      webSocket: this.getWebSocketSummary(webSocketMetrics),
      storage: this.getStorageSummary(storageMetrics)
    };
  }

  /**
   * Get HTTP summary
   */
  private getHttpSummary(metrics: CommunicationMetrics[]): { averageLatency: number; totalRequests: number; successRate: number } {
    if (metrics.length === 0) {
      return { averageLatency: 0, totalRequests: 0, successRate: 0 };
    }

    const totalLatency = metrics.reduce((sum, m) => sum + (m.networkLatency || 0), 0);
    const totalErrors = metrics.reduce((sum, m) => sum + (m.errorCount || 0), 0);
    const totalSuccess = metrics.length - totalErrors;

    return {
      averageLatency: totalLatency / metrics.length,
      totalRequests: metrics.length,
      successRate: (totalSuccess / metrics.length) * 100
    };
  }

  /**
   * Get WebSocket summary
   */
  private getWebSocketSummary(metrics: CommunicationMetrics[]): { averageLatency: number; totalConnections: number; successRate: number } {
    if (metrics.length === 0) {
      return { averageLatency: 0, totalConnections: 0, successRate: 0 };
    }

    const totalLatency = metrics.reduce((sum, m) => sum + (m.networkLatency || 0), 0);
    const totalErrors = metrics.reduce((sum, m) => sum + (m.errorCount || 0), 0);
    const totalSuccess = metrics.length - totalErrors;

    return {
      averageLatency: totalLatency / metrics.length,
      totalConnections: metrics.length,
      successRate: (totalSuccess / metrics.length) * 100
    };
  }

  /**
   * Get storage summary
   */
  private getStorageSummary(metrics: CommunicationMetrics[]): { averageLatency: number; totalOperations: number; successRate: number } {
    if (metrics.length === 0) {
      return { averageLatency: 0, totalOperations: 0, successRate: 0 };
    }

    const totalLatency = metrics.reduce((sum, m) => sum + (m.networkLatency || 0), 0);
    const totalErrors = metrics.reduce((sum, m) => sum + (m.errorCount || 0), 0);
    const totalSuccess = metrics.length - totalErrors;

    return {
      averageLatency: totalLatency / metrics.length,
      totalOperations: metrics.length,
      successRate: (totalSuccess / metrics.length) * 100
    };
  }

  /**
   * Check thresholds and trigger alerts
   */
  private checkThresholds(metrics: PerformanceMetrics): void {
    const alerts: PerformanceAlert[] = [];

    // Check duration threshold
    if (this.thresholds.maxDuration && metrics.duration > this.thresholds.maxDuration) {
      alerts.push({
        type: 'performance',
        severity: metrics.duration > this.thresholds.maxDuration * 2 ? 'critical' : 'high',
        message: `Operation ${metrics.operation} in ${metrics.component} took ${metrics.duration}ms (threshold: ${this.thresholds.maxDuration}ms)`,
        component: metrics.component,
        timestamp: Date.now(),
        metrics
      });
    }

    // Check memory usage threshold
    if (this.thresholds.maxMemoryUsage && metrics.memoryUsage && metrics.memoryUsage > this.thresholds.maxMemoryUsage) {
      alerts.push({
        type: 'resource',
        severity: 'medium',
        message: `Memory usage in ${metrics.component} is ${metrics.memoryUsage} bytes (threshold: ${this.thresholds.maxMemoryUsage} bytes)`,
        component: metrics.component,
        timestamp: Date.now(),
        metrics
      });
    }

    // Check success rate threshold
    if (this.thresholds.minSuccessRate && metrics.successRate && metrics.successRate < this.thresholds.minSuccessRate) {
      alerts.push({
        type: 'performance',
        severity: 'high',
        message: `Success rate in ${metrics.component} is ${metrics.successRate}% (threshold: ${this.thresholds.minSuccessRate}%)`,
        component: metrics.component,
        timestamp: Date.now(),
        metrics
      });
    }

    // Check network latency threshold
    if (this.thresholds.maxNetworkLatency && metrics.networkLatency && metrics.networkLatency > this.thresholds.maxNetworkLatency) {
      alerts.push({
        type: 'communication',
        severity: 'medium',
        message: `Network latency in ${metrics.component} is ${metrics.networkLatency}ms (threshold: ${this.thresholds.maxNetworkLatency}ms)`,
        component: metrics.component,
        timestamp: Date.now(),
        metrics
      });
    }

    // Trigger alert callbacks
    alerts.forEach(alert => {
      this.alertCallbacks.forEach(callback => callback(alert));
    });
  }

  /**
   * Add alert callback
   */
  addAlertCallback(callback: (alert: PerformanceAlert) => void): void {
    this.alertCallbacks.push(callback);
  }

  /**
   * Remove alert callback
   */
  removeAlertCallback(callback: (alert: PerformanceAlert) => void): void {
    const index = this.alertCallbacks.indexOf(callback);
    if (index > -1) {
      this.alertCallbacks.splice(index, 1);
    }
  }

  /**
   * Enable/disable monitoring
   */
  setMonitoringEnabled(enabled: boolean): void {
    this.monitoringEnabled = enabled;
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Get raw metrics data
   */
  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }
}

/**
 * P31 Labs default performance monitor
 */
export const p31PerformanceMonitor = new PerformanceMonitor();

/**
 * Performance monitoring decorator
 */
export function monitorPerformance(component: string, operation?: string) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const operationName = operation || propertyKey;

    descriptor.value = async function(...args: any[]) {
      return p31PerformanceMonitor.measure(component, operationName, () => 
        originalMethod.apply(this, args)
      );
    };

    return descriptor;
  };
}

/**
 * Communication performance monitoring decorator
 */
export function monitorCommunication(
  component: string, 
  communicationType: CommunicationMetrics['communicationType'],
  operation?: string
) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const operationName = operation || propertyKey;

    descriptor.value = async function(...args: any[]) {
      return p31PerformanceMonitor.measureCommunication(component, operationName, communicationType, () => 
        originalMethod.apply(this, args)
      );
    };

    return descriptor;
  };
}

export default PerformanceMonitor;