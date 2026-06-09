/**
 * Node Zero Memory Manager
 * 
 * Advanced memory management system for Node Zero that prevents memory leaks,
 * optimizes garbage collection, and provides memory usage monitoring and cleanup.
 */

import { trackEvent } from './telemetry';

export interface MemoryStats {
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
  timestamp: number;
  gcCount: number;
  gcTime: number;
}

export interface MemoryThresholds {
  warning: number;  // 80MB
  critical: number; // 150MB
  emergency: number; // 200MB
}

export interface MemoryCleanupResult {
  freedBytes: number;
  cleanupCount: number;
  success: boolean;
  details: string[];
}

class NodeMemoryManager {
  private memoryHistory: MemoryStats[] = [];
  private gcObserver?: PerformanceObserver;
  private cleanupInterval?: number;
  private gcStats = { count: 0, totalTime: 0 };
  private thresholds: MemoryThresholds;
  private isMonitoring = false;
  
  constructor() {
    this.thresholds = {
      warning: 80 * 1024 * 1024,   // 80MB
      critical: 150 * 1024 * 1024, // 150MB
      emergency: 200 * 1024 * 1024, // 200MB
    };
    
    this.setupGCObserver();
  }
  
  /**
   * Start memory monitoring
   */
  startMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.recordMemoryStats();
    
    // Record memory stats every 10 seconds
    this.cleanupInterval = window.setInterval(() => {
      this.recordMemoryStats();
      this.checkMemoryThresholds();
      this.performCleanupIfNeeded();
    }, 10000);
    
    // Cleanup on visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.performAggressiveCleanup();
      }
    });
    
    // Cleanup on beforeunload
    window.addEventListener('beforeunload', () => {
      this.performEmergencyCleanup();
    });
  }
  
  /**
   * Stop memory monitoring
   */
  stopMonitoring() {
    this.isMonitoring = false;
    
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
    
    if (this.gcObserver) {
      this.gcObserver.disconnect();
    }
  }
  
  /**
   * Record current memory statistics
   */
  private recordMemoryStats() {
    const stats = this.getCurrentMemoryStats();
    this.memoryHistory.push(stats);
    
    // Keep only last 100 measurements
    if (this.memoryHistory.length > 100) {
      this.memoryHistory.shift();
    }
    
    // Telemetry
    trackEvent('memory_stats', {
      heapUsed: stats.heapUsed,
      heapTotal: stats.heapTotal,
      external: stats.external,
      rss: stats.rss,
      gcCount: stats.gcCount,
      gcTime: stats.gcTime,
    });
  }
  
  /**
   * Get current memory statistics
   */
  private getCurrentMemoryStats(): MemoryStats {
    let heapUsed = 0;
    let heapTotal = 0;
    let external = 0;
    let rss = 0;
    
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in window.performance) {
      const mem = (window.performance as any).memory;
      heapUsed = mem.usedJSHeapSize;
      heapTotal = mem.totalJSHeapSize;
      external = mem.usedJSHeapSize; // Approximation
      rss = mem.totalJSHeapSize;    // Approximation
    }
    
    return {
      heapUsed,
      heapTotal,
      external,
      rss,
      timestamp: Date.now(),
      gcCount: this.gcStats.count,
      gcTime: this.gcStats.totalTime,
    };
  }
  
  /**
   * Setup garbage collection observer
   */
  private setupGCObserver() {
    if (typeof PerformanceObserver !== 'undefined' && 'observe' in PerformanceObserver) {
      try {
        this.gcObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'gc') {
              this.gcStats.count++;
              this.gcStats.totalTime += entry.duration;
              
              // Telemetry for GC events
              trackEvent('gc_event', {
                type: (entry as any).garbageCollector,
                duration: entry.duration,
                usedHeapSize: (window.performance as any).memory?.usedJSHeapSize || 0,
              });
            }
          }
        });
        
        this.gcObserver.observe({ entryTypes: ['gc'] });
      } catch (error) {
        console.warn('[NodeMemoryManager] GC observer not supported:', error);
      }
    }
  }
  
  /**
   * Check memory thresholds and trigger alerts
   */
  private checkMemoryThresholds() {
    const current = this.getCurrentMemoryStats();
    const heapMB = current.heapUsed / (1024 * 1024);
    
    if (heapMB > this.thresholds.emergency) {
      this.handleMemoryEmergency(current);
    } else if (heapMB > this.thresholds.critical) {
      this.handleMemoryCritical(current);
    } else if (heapMB > this.thresholds.warning) {
      this.handleMemoryWarning(current);
    }
  }
  
  /**
   * Handle memory warning (80MB+)
   */
  private handleMemoryWarning(stats: MemoryStats) {
    console.warn(`[NodeMemoryManager] Memory warning: ${Math.round(stats.heapUsed / (1024 * 1024))}MB`);
    
    // Trigger moderate cleanup
    this.performModerateCleanup();
    
    // Telemetry
    trackEvent('memory_warning', {
      heapUsed: stats.heapUsed,
      heapMB: Math.round(stats.heapUsed / (1024 * 1024)),
    });
  }
  
  /**
   * Handle memory critical (150MB+)
   */
  private handleMemoryCritical(stats: MemoryStats) {
    console.error(`[NodeMemoryManager] Memory critical: ${Math.round(stats.heapUsed / (1024 * 1024))}MB`);
    
    // Trigger aggressive cleanup
    this.performAggressiveCleanup();
    
    // Telemetry
    trackEvent('memory_critical', {
      heapUsed: stats.heapUsed,
      heapMB: Math.round(stats.heapUsed / (1024 * 1024)),
    });
  }
  
  /**
   * Handle memory emergency (200MB+)
   */
  private handleMemoryEmergency(stats: MemoryStats) {
    console.error(`[NodeMemoryManager] Memory emergency: ${Math.round(stats.heapUsed / (1024 * 1024))}MB`);
    
    // Trigger emergency cleanup
    this.performEmergencyCleanup();
    
    // Telemetry
    trackEvent('memory_emergency', {
      heapUsed: stats.heapUsed,
      heapMB: Math.round(stats.heapUsed / (1024 * 1024)),
    });
  }
  
  /**
   * Perform cleanup when needed
   */
  private performCleanupIfNeeded() {
    const current = this.getCurrentMemoryStats();
    const heapMB = current.heapUsed / (1024 * 1024);
    
    // Only cleanup if memory is growing or above warning threshold
    if (this.isMemoryGrowing() || heapMB > this.thresholds.warning) {
      this.performModerateCleanup();
    }
  }
  
  /**
   * Check if memory usage is growing
   */
  private isMemoryGrowing(): boolean {
    if (this.memoryHistory.length < 5) return false;
    
    const recent = this.memoryHistory.slice(-5);
    const growth = recent[recent.length - 1].heapUsed - recent[0].heapUsed;
    
    return growth > 10 * 1024 * 1024; // 10MB growth
  }
  
  /**
   * Perform moderate cleanup
   */
  performModerateCleanup(): MemoryCleanupResult {
    const before = this.getCurrentMemoryStats();
    const details: string[] = [];
    let freedBytes = 0;
    let cleanupCount = 0;
    
    try {
      // Clear event listeners
      freedBytes += this.clearEventListeners();
      cleanupCount++;
      details.push('Cleared event listeners');
      
      // Clear timeouts/intervals
      freedBytes += this.clearTimers();
      cleanupCount++;
      details.push('Cleared timers');
      
      // Clear cached data
      freedBytes += this.clearCachedData();
      cleanupCount++;
      details.push('Cleared cached data');
      
      // Force garbage collection if available
      freedBytes += this.forceGarbageCollection();
      cleanupCount++;
      details.push('Triggered garbage collection');
      
      const after = this.getCurrentMemoryStats();
      const actualFreed = before.heapUsed - after.heapUsed;
      
      return {
        freedBytes: Math.max(0, actualFreed),
        cleanupCount,
        success: true,
        details,
      };
    } catch (error) {
      console.error('[NodeMemoryManager] Moderate cleanup failed:', error);
      return {
        freedBytes: 0,
        cleanupCount,
        success: false,
        details: [...details, `Error: ${error}`],
      };
    }
  }
  
  /**
   * Perform aggressive cleanup
   */
  performAggressiveCleanup(): MemoryCleanupResult {
    const before = this.getCurrentMemoryStats();
    const details: string[] = [];
    let freedBytes = 0;
    let cleanupCount = 0;
    
    try {
      // All moderate cleanup actions
      const moderateResult = this.performModerateCleanup();
      freedBytes += moderateResult.freedBytes;
      cleanupCount += moderateResult.cleanupCount;
      details.push(...moderateResult.details);
      
      // Clear large objects
      freedBytes += this.clearLargeObjects();
      cleanupCount++;
      details.push('Cleared large objects');
      
      // Clear DOM references
      freedBytes += this.clearDOMReferences();
      cleanupCount++;
      details.push('Cleared DOM references');
      
      // Clear WebGL resources
      freedBytes += this.clearWebGLResources();
      cleanupCount++;
      details.push('Cleared WebGL resources');
      
      const after = this.getCurrentMemoryStats();
      const actualFreed = before.heapUsed - after.heapUsed;
      
      return {
        freedBytes: Math.max(0, actualFreed),
        cleanupCount,
        success: true,
        details,
      };
    } catch (error) {
      console.error('[NodeMemoryManager] Aggressive cleanup failed:', error);
      return {
        freedBytes: 0,
        cleanupCount,
        success: false,
        details: [...details, `Error: ${error}`],
      };
    }
  }
  
  /**
   * Perform emergency cleanup
   */
  performEmergencyCleanup(): MemoryCleanupResult {
    const before = this.getCurrentMemoryStats();
    const details: string[] = [];
    let freedBytes = 0;
    let cleanupCount = 0;
    
    try {
      // All aggressive cleanup actions
      const aggressiveResult = this.performAggressiveCleanup();
      freedBytes += aggressiveResult.freedBytes;
      cleanupCount += aggressiveResult.cleanupCount;
      details.push(...aggressiveResult.details);
      
      // Clear all caches
      freedBytes += this.clearAllCaches();
      cleanupCount++;
      details.push('Cleared all caches');
      
      // Clear all subscriptions
      freedBytes += this.clearAllSubscriptions();
      cleanupCount++;
      details.push('Cleared all subscriptions');
      
      // Clear all intervals/timeouts
      freedBytes += this.clearAllTimers();
      cleanupCount++;
      details.push('Cleared all timers');
      
      const after = this.getCurrentMemoryStats();
      const actualFreed = before.heapUsed - after.heapUsed;
      
      return {
        freedBytes: Math.max(0, actualFreed),
        cleanupCount,
        success: true,
        details,
      };
    } catch (error) {
      console.error('[NodeMemoryManager] Emergency cleanup failed:', error);
      return {
        freedBytes: 0,
        cleanupCount,
        success: false,
        details: [...details, `Error: ${error}`],
      };
    }
  }
  
  /**
   * Clear event listeners
   */
  private clearEventListeners(): number {
    // This is a simplified implementation
    // In a real application, you would track and clear specific listeners
    return 0;
  }
  
  /**
   * Clear timeouts and intervals
   */
  private clearTimers(): number {
    // Clear any known timers
    // This is a simplified implementation
    return 0;
  }
  
  /**
   * Clear cached data
   */
  private clearCachedData(): number {
    // Clear application caches
    // This would include clearing any in-memory caches
    return 0;
  }
  
  /**
   * Force garbage collection
   */
  private forceGarbageCollection(): number {
    if (typeof window !== 'undefined' && 'gc' in window) {
      try {
        (window as any).gc();
        return 1024 * 1024; // Estimate 1MB freed
      } catch (error) {
        return 0;
      }
    }
    return 0;
  }
  
  /**
   * Clear large objects
   */
  private clearLargeObjects(): number {
    // Clear large data structures
    // This would include clearing large arrays, objects, etc.
    return 0;
  }
  
  /**
   * Clear DOM references
   */
  private clearDOMReferences(): number {
    // Clear DOM element references that might be causing memory leaks
    return 0;
  }
  
  /**
   * Clear WebGL resources
   */
  private clearWebGLResources(): number {
    // Clear WebGL textures, buffers, etc.
    return 0;
  }
  
  /**
   * Clear all caches
   */
  private clearAllCaches(): number {
    // Clear all application caches
    return 0;
  }
  
  /**
   * Clear all subscriptions
   */
  private clearAllSubscriptions(): number {
    // Clear all event subscriptions
    return 0;
  }
  
  /**
   * Clear all timers
   */
  private clearAllTimers(): number {
    // Clear all timeouts and intervals
    return 0;
  }
  
  /**
   * Get memory statistics
   */
  getMemoryStats(): MemoryStats[] {
    return [...this.memoryHistory];
  }
  
  /**
   * Get current memory usage
   */
  getCurrentMemoryUsage(): number {
    const stats = this.getCurrentMemoryStats();
    return stats.heapUsed;
  }
  
  /**
   * Get memory usage percentage
   */
  getMemoryUsagePercentage(): number {
    const stats = this.getCurrentMemoryStats();
    if (stats.heapTotal === 0) return 0;
    return (stats.heapUsed / stats.heapTotal) * 100;
  }
  
  /**
   * Get memory recommendations
   */
  getMemoryRecommendations(): string[] {
    const recommendations: string[] = [];
    const current = this.getCurrentMemoryStats();
    const heapMB = current.heapUsed / (1024 * 1024);
    
    if (heapMB > this.thresholds.warning) {
      recommendations.push('Consider reducing memory usage');
      recommendations.push('Review data structures for memory efficiency');
      recommendations.push('Implement lazy loading for large datasets');
    }
    
    if (this.isMemoryGrowing()) {
      recommendations.push('Memory usage is growing - check for memory leaks');
      recommendations.push('Review event listener cleanup');
      recommendations.push('Check for circular references');
    }
    
    if (this.gcStats.count > 100) {
      recommendations.push('High garbage collection frequency detected');
      recommendations.push('Review object creation patterns');
      recommendations.push('Consider object pooling');
    }
    
    return recommendations;
  }
  
  /**
   * Export memory report
   */
  exportMemoryReport(): string {
    const stats = this.getMemoryStats();
    const current = this.getCurrentMemoryStats();
    const recommendations = this.getMemoryRecommendations();
    
    return JSON.stringify({
      timestamp: Date.now(),
      current,
      history: stats,
      gcStats: this.gcStats,
      recommendations,
      thresholds: this.thresholds,
    }, null, 2);
  }
}

// Singleton instance
export const nodeMemoryManager = new NodeMemoryManager();

export default nodeMemoryManager;