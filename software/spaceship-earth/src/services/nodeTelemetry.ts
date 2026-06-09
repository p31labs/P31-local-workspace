/**
 * Node Zero Enhanced Telemetry System
 * 
 * Comprehensive telemetry and monitoring system for Node Zero that provides
 * detailed performance metrics, error tracking, user behavior analytics,
 * and system health monitoring.
 */

import { trackEvent } from './telemetry';

export interface NodeTelemetryMetrics {
  // Performance metrics
  bootTime: number;
  stateUpdateLatency: number[];
  memoryUsage: number[];
  networkLatency: number[];
  
  // Error tracking
  errorCount: number;
  errorTypes: Record<string, number>;
  errorStacks: string[];
  
  // User behavior
  sessionDuration: number;
  activeTime: number;
  interactionCount: number;
  featureUsage: Record<string, number>;
  
  // System health
  subsystemHealth: Record<string, boolean>;
  resourceUsage: {
    cpu: number[];
    memory: number[];
    network: number[];
  };
  
  // Node Zero specific
  coherenceLevels: number[];
  spoonsLevels: number[];
  tierChanges: Array<{ from: string; to: string; timestamp: number }>;
  bondEvents: Array<{ type: string; peerId: string; timestamp: number }>;
}

export interface TelemetryConfig {
  enabled: boolean;
  batchSize: number;
  flushInterval: number;
  maxRetries: number;
  samplingRate: number;
  debugMode: boolean;
}

class NodeTelemetry {
  private metrics: NodeTelemetryMetrics;
  private config: TelemetryConfig;
  private batch: any[] = [];
  private flushTimer?: number;
  private startTime: number;
  private activeTimeStart: number;
  private interactionTimer?: number;
  private isTracking = false;
  
  constructor() {
    this.config = {
      enabled: true,
      batchSize: 50,
      flushInterval: 30000, // 30 seconds
      maxRetries: 3,
      samplingRate: 1.0, // 100% sampling
      debugMode: false,
    };
    
    this.metrics = {
      bootTime: 0,
      stateUpdateLatency: [],
      memoryUsage: [],
      networkLatency: [],
      errorCount: 0,
      errorTypes: {},
      errorStacks: [],
      sessionDuration: 0,
      activeTime: 0,
      interactionCount: 0,
      featureUsage: {},
      subsystemHealth: {},
      resourceUsage: {
        cpu: [],
        memory: [],
        network: [],
      },
      coherenceLevels: [],
      spoonsLevels: [],
      tierChanges: [],
      bondEvents: [],
    };
    
    this.startTime = performance.now();
    this.activeTimeStart = Date.now();
    
    this.setupEventListeners();
    this.startTracking();
  }
  
  /**
   * Configure telemetry settings
   */
  configure(config: Partial<TelemetryConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (this.config.debugMode) {
      console.log('[NodeTelemetry] Configuration updated:', this.config);
    }
  }
  
  /**
   * Start telemetry tracking
   */
  startTracking(): void {
    if (this.isTracking) return;
    
    this.isTracking = true;
    
    // Start periodic flushing
    this.flushTimer = window.setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
    
    // Track resource usage periodically
    setInterval(() => {
      this.trackResourceUsage();
    }, 10000); // Every 10 seconds
    
    // Track session duration
    setInterval(() => {
      this.metrics.sessionDuration = Date.now() - this.startTime;
    }, 1000);
    
    if (this.config.debugMode) {
      console.log('[NodeTelemetry] Tracking started');
    }
  }
  
  /**
   * Stop telemetry tracking
   */
  stopTracking(): void {
    this.isTracking = false;
    
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
    }
    
    this.flush(); // Final flush
    
    if (this.config.debugMode) {
      console.log('[NodeTelemetry] Tracking stopped');
    }
  }
  
  /**
   * Setup event listeners for user interactions
   */
  private setupEventListeners(): void {
    // Track user interactions
    ['click', 'keydown', 'scroll', 'mousemove'].forEach(eventType => {
      document.addEventListener(eventType, () => {
        this.trackInteraction();
      }, { passive: true });
    });
    
    // Track visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.activeTimeStart = 0;
      } else {
        this.activeTimeStart = Date.now();
      }
    });
    
    // Track errors
    window.addEventListener('error', (event) => {
      this.trackError('unhandled_error', event.message, event.error?.stack);
    });
    
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError('unhandled_promise_rejection', event.reason?.message, event.reason?.stack);
    });
  }
  
  /**
   * Track Node Zero boot metrics
   */
  trackBoot(bootTime: number): void {
    this.metrics.bootTime = bootTime;
    
    this.addToBatch({
      type: 'boot',
      timestamp: Date.now(),
      data: {
        bootTime,
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        connection: this.getConnectionInfo(),
      },
    });
    
    if (this.config.debugMode) {
      console.log(`[NodeTelemetry] Boot tracked: ${bootTime}ms`);
    }
  }
  
  /**
   * Track state update performance
   */
  trackStateUpdate(latency: number): void {
    this.metrics.stateUpdateLatency.push(latency);
    
    // Keep only last 100 measurements
    if (this.metrics.stateUpdateLatency.length > 100) {
      this.metrics.stateUpdateLatency.shift();
    }
    
    this.addToBatch({
      type: 'state_update',
      timestamp: Date.now(),
      data: {
        latency,
        avgLatency: this.getAverageLatency(),
      },
    });
  }
  
  /**
   * Track memory usage
   */
  trackMemoryUsage(): void {
    const memory = this.getMemoryInfo();
    if (memory) {
      this.metrics.memoryUsage.push(memory.usedJSHeapSize);
      this.metrics.resourceUsage.memory.push(memory.usedJSHeapSize);
      
      // Keep only last 100 measurements
      if (this.metrics.memoryUsage.length > 100) {
        this.metrics.memoryUsage.shift();
      }
      if (this.metrics.resourceUsage.memory.length > 100) {
        this.metrics.resourceUsage.memory.shift();
      }
      
      this.addToBatch({
        type: 'memory_usage',
        timestamp: Date.now(),
        data: memory,
      });
    }
  }
  
  /**
   * Track network latency
   */
  trackNetworkLatency(latency: number, url?: string): void {
    this.metrics.networkLatency.push(latency);
    
    // Keep only last 50 measurements
    if (this.metrics.networkLatency.length > 50) {
      this.metrics.networkLatency.shift();
    }
    
    this.addToBatch({
      type: 'network_latency',
      timestamp: Date.now(),
      data: {
        latency,
        url,
        connection: this.getConnectionInfo(),
      },
    });
  }
  
  /**
   * Track errors with context
   */
  trackError(type: string, message: string, stack?: string): void {
    this.metrics.errorCount++;
    this.metrics.errorTypes[type] = (this.metrics.errorTypes[type] || 0) + 1;
    
    if (stack) {
      this.metrics.errorStacks.push(stack);
      // Keep only last 20 stacks
      if (this.metrics.errorStacks.length > 20) {
        this.metrics.errorStacks.shift();
      }
    }
    
    this.addToBatch({
      type: 'error',
      timestamp: Date.now(),
      data: {
        type,
        message,
        stack,
        url: window.location.href,
        userAgent: navigator.userAgent,
      },
    });
    
    if (this.config.debugMode) {
      console.error(`[NodeTelemetry] Error tracked: ${type} - ${message}`);
    }
  }
  
  /**
   * Track feature usage
   */
  trackFeatureUsage(feature: string): void {
    this.metrics.featureUsage[feature] = (this.metrics.featureUsage[feature] || 0) + 1;
    
    this.addToBatch({
      type: 'feature_usage',
      timestamp: Date.now(),
      data: {
        feature,
        count: this.metrics.featureUsage[feature],
      },
    });
    
    if (this.config.debugMode) {
      console.log(`[NodeTelemetry] Feature usage: ${feature}`);
    }
  }
  
  /**
   * Track subsystem health
   */
  trackSubsystemHealth(subsystem: string, healthy: boolean): void {
    this.metrics.subsystemHealth[subsystem] = healthy;
    
    this.addToBatch({
      type: 'subsystem_health',
      timestamp: Date.now(),
      data: {
        subsystem,
        healthy,
      },
    });
  }
  
  /**
   * Track Node Zero specific metrics
   */
  trackCoherenceLevel(level: number): void {
    this.metrics.coherenceLevels.push(level);
    
    // Keep only last 200 measurements
    if (this.metrics.coherenceLevels.length > 200) {
      this.metrics.coherenceLevels.shift();
    }
    
    this.addToBatch({
      type: 'coherence_level',
      timestamp: Date.now(),
      data: {
        level,
        avgLevel: this.getAverageCoherence(),
      },
    });
  }
  
  trackSpoonsLevel(level: number): void {
    this.metrics.spoonsLevels.push(level);
    
    // Keep only last 200 measurements
    if (this.metrics.spoonsLevels.length > 200) {
      this.metrics.spoonsLevels.shift();
    }
    
    this.addToBatch({
      type: 'spoons_level',
      timestamp: Date.now(),
      data: {
        level,
      },
    });
  }
  
  trackTierChange(from: string, to: string): void {
    this.metrics.tierChanges.push({
      from,
      to,
      timestamp: Date.now(),
    });
    
    // Keep only last 50 changes
    if (this.metrics.tierChanges.length > 50) {
      this.metrics.tierChanges.shift();
    }
    
    this.addToBatch({
      type: 'tier_change',
      timestamp: Date.now(),
      data: {
        from,
        to,
      },
    });
  }
  
  trackBondEvent(type: string, peerId: string): void {
    this.metrics.bondEvents.push({
      type,
      peerId,
      timestamp: Date.now(),
    });
    
    // Keep only last 100 events
    if (this.metrics.bondEvents.length > 100) {
      this.metrics.bondEvents.shift();
    }
    
    this.addToBatch({
      type: 'bond_event',
      timestamp: Date.now(),
      data: {
        type,
        peerId,
      },
    });
  }
  
  /**
   * Track user interaction
   */
  private trackInteraction(): void {
    this.metrics.interactionCount++;
    
    // Reset active time tracking
    this.activeTimeStart = Date.now();
    
    // Clear existing timer
    if (this.interactionTimer) {
      clearTimeout(this.interactionTimer);
    }
    
    // Set new timer to track active time
    this.interactionTimer = window.setTimeout(() => {
      this.metrics.activeTime = Date.now() - this.startTime;
    }, 1000);
  }
  
  /**
   * Track resource usage
   */
  private trackResourceUsage(): void {
    // Track memory
    this.trackMemoryUsage();
    
    // Track CPU (approximation)
    const cpuUsage = this.getCpuUsage();
    this.metrics.resourceUsage.cpu.push(cpuUsage);
    
    // Keep only last 100 measurements
    if (this.metrics.resourceUsage.cpu.length > 100) {
      this.metrics.resourceUsage.cpu.shift();
    }
  }
  
  /**
   * Add event to batch
   */
  private addToBatch(event: any): void {
    // Apply sampling
    if (Math.random() > this.config.samplingRate) {
      return;
    }
    
    this.batch.push(event);
    
    if (this.batch.length >= this.config.batchSize) {
      this.flush();
    }
  }
  
  /**
   * Flush batch to telemetry endpoint
   */
  private async flush(): Promise<void> {
    if (this.batch.length === 0 || !this.config.enabled) {
      return;
    }
    
    const events = [...this.batch];
    this.batch = [];
    
    try {
      // Send to telemetry endpoint
      await this.sendToEndpoint(events);
      
      if (this.config.debugMode) {
        console.log(`[NodeTelemetry] Flushed ${events.length} events`);
      }
    } catch (error) {
      console.error('[NodeTelemetry] Failed to flush events:', error);
      
      // Retry logic
      if (this.config.maxRetries > 0) {
        this.config.maxRetries--;
        this.batch.unshift(...events); // Re-add to batch
      }
    }
  }
  
  /**
   * Send events to telemetry endpoint
   */
  private async sendToEndpoint(events: any[]): Promise<void> {
    // This would send to your actual telemetry endpoint
    // For now, we'll use the existing trackEvent function
    events.forEach(event => {
      trackEvent(event.type, event.data);
    });
  }
  
  /**
   * Get memory information
   */
  private getMemoryInfo(): any {
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in window.performance) {
      const mem = (window.performance as any).memory;
      return {
        usedJSHeapSize: mem.usedJSHeapSize,
        totalJSHeapSize: mem.totalJSHeapSize,
        jsHeapSizeLimit: mem.jsHeapSizeLimit,
      };
    }
    return null;
  }
  
  /**
   * Get connection information
   */
  private getConnectionInfo(): any {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      return {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData,
      };
    }
    return null;
  }
  
  /**
   * Get CPU usage approximation
   */
  private getCpuUsage(): number {
    // Simple CPU usage approximation
    const start = performance.now();
    let iterations = 0;
    
    while (performance.now() - start < 10) { // 10ms test
      iterations++;
    }
    
    return iterations;
  }
  
  /**
   * Get average state update latency
   */
  private getAverageLatency(): number {
    if (this.metrics.stateUpdateLatency.length === 0) return 0;
    const sum = this.metrics.stateUpdateLatency.reduce((a, b) => a + b, 0);
    return sum / this.metrics.stateUpdateLatency.length;
  }
  
  /**
   * Get average coherence level
   */
  private getAverageCoherence(): number {
    if (this.metrics.coherenceLevels.length === 0) return 0;
    const sum = this.metrics.coherenceLevels.reduce((a, b) => a + b, 0);
    return sum / this.metrics.coherenceLevels.length;
  }
  
  /**
   * Get current telemetry metrics
   */
  getMetrics(): NodeTelemetryMetrics {
    return { ...this.metrics };
  }
  
  /**
   * Get telemetry summary
   */
  getSummary(): any {
    return {
      sessionDuration: this.metrics.sessionDuration,
      activeTime: this.metrics.activeTime,
      interactionCount: this.metrics.interactionCount,
      errorCount: this.metrics.errorCount,
      bootTime: this.metrics.bootTime,
      avgLatency: this.getAverageLatency(),
      avgCoherence: this.getAverageCoherence(),
      memoryUsage: this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1] || 0,
      featureUsage: { ...this.metrics.featureUsage },
      subsystemHealth: { ...this.metrics.subsystemHealth },
    };
  }
  
  /**
   * Export telemetry data
   */
  exportData(): string {
    return JSON.stringify({
      timestamp: Date.now(),
      config: this.config,
      metrics: this.metrics,
      summary: this.getSummary(),
    }, null, 2);
  }
  
  /**
   * Reset telemetry data
   */
  reset(): void {
    this.metrics = {
      bootTime: 0,
      stateUpdateLatency: [],
      memoryUsage: [],
      networkLatency: [],
      errorCount: 0,
      errorTypes: {},
      errorStacks: [],
      sessionDuration: 0,
      activeTime: 0,
      interactionCount: 0,
      featureUsage: {},
      subsystemHealth: {},
      resourceUsage: {
        cpu: [],
        memory: [],
        network: [],
      },
      coherenceLevels: [],
      spoonsLevels: [],
      tierChanges: [],
      bondEvents: [],
    };
    this.startTime = performance.now();
    this.activeTimeStart = Date.now();
    this.batch = [];
  }
}

// Singleton instance
export const nodeTelemetry = new NodeTelemetry();

export default nodeTelemetry;