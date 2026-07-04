// ═══════════════════════════════════════════════════════════════
// WCD-28.1: Performance Monitor Service
// P31 Labs — Spaceship Earth
//
// Ring buffer for FPS/memory/GPU metrics with auto-scaling.
// ═══════════════════════════════════════════════════════════════

export interface PerformanceMetrics {
  fps: number;
  fpsMin: number;
  fpsMax: number;
  frameTime: number;      // ms
  memory: number | null;   // bytes, Chrome-only, null if unavailable
  gpuTime: number | null;  // ms, EXT_disjoint_timer_query, null if unavailable
  particleCount: number;
  timestamp: number;
}

type PerformanceLevel = 'high' | 'medium' | 'low';

const MAX_SAMPLES = 300; // 5 minutes at 1Hz

export class PerformanceMonitor {
  private buffer: PerformanceMetrics[] = [];
  private frameTimes: number[] = [];
  private lastSampleTime = 0;
  private _lastFrameTime = 0; // Track last frame delta for smoothness calculation (reserved for future use)
  private frameCount = 0;
  private particleCount = 0;
  
  // Track performance level transitions for event dispatching
  private currentLevel: PerformanceLevel = 'high';
  private lowFpsStartTime: number | null = null;

  constructor() {
    // Initialize with default values
    this.lastSampleTime = performance.now();
  }

  recordFrame(delta: number): void {
    const now = performance.now();
    this.frameTimes.push(delta * 1000); // Convert to ms
    this._lastFrameTime = delta;
    this.frameCount++;

    // Keep only last 60 frame times for rolling average
    if (this.frameTimes.length > 60) {
      this.frameTimes.shift();
    }

    // Sample at 1Hz
    if (now - this.lastSampleTime >= 1000) {
      this.sample();
      this.lastSampleTime = now;
    }
  }

  private sample(): void {
    const now = performance.now();
    
    // Calculate FPS from frame times
    const avgFrameTime = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    const fps = 1000 / avgFrameTime;
    const fpsMin = 1000 / Math.max(...this.frameTimes);
    const fpsMax = 1000 / Math.min(...this.frameTimes);

    // Memory (Chrome only, deprecated but still works)
    let memory: number | null = null;
    try {
      const perf = performance as typeof performance & { memory?: { usedJSHeapSize: number } };
      if (perf.memory) {
        memory = perf.memory.usedJSHeapSize;
      }
    } catch {
      // Ignore - memory API not available
    }

    // GPU time - not available on most mobile browsers
    const gpuTime: number | null = null;

    const metrics: PerformanceMetrics = {
      fps: Math.round(fps),
      fpsMin: Math.round(fpsMin),
      fpsMax: Math.round(fpsMax),
      frameTime: Math.round(avgFrameTime * 100) / 100,
      memory,
      gpuTime,
      particleCount: this.particleCount,
      timestamp: now,
    };

    this.buffer.push(metrics);
    if (this.buffer.length > MAX_SAMPLES) {
      this.buffer.shift();
    }

    // Check for performance level transitions
    this.checkPerformanceLevel(fps);
  }

  private checkPerformanceLevel(fps: number): void {
    let newLevel: PerformanceLevel;
    if (fps >= 55) {
      newLevel = 'high';
      this.lowFpsStartTime = null;
    } else if (fps >= 40) {
      newLevel = 'medium';
      this.lowFpsStartTime = null;
    } else {
      newLevel = 'low';
      if (this.lowFpsStartTime === null) {
        this.lowFpsStartTime = performance.now();
      }
    }

    if (newLevel !== this.currentLevel) {
      this.currentLevel = newLevel;
      
      // Dispatch event for quality settings dialog
      if (newLevel === 'low') {
        window.dispatchEvent(new CustomEvent('p31:perf:low'));
        
        // Check for critical (sustained low)
        if (this.lowFpsStartTime && 
            performance.now() - this.lowFpsStartTime >= 10000) {
          window.dispatchEvent(new CustomEvent('p31:perf:critical'));
        }
      }
    }
  }

  setParticleCount(count: number): void {
    this.particleCount = count;
  }

  getMetrics(): PerformanceMetrics | null {
    return this.buffer.length > 0 ? this.buffer[this.buffer.length - 1] : null;
  }

  getHistory(): PerformanceMetrics[] {
    return [...this.buffer];
  }

  getPerformanceLevel(): PerformanceLevel {
    return this.currentLevel;
  }

  getAverageFps(): number {
    if (this.buffer.length === 0) return 60;
    const sum = this.buffer.reduce((acc, m) => acc + m.fps, 0);
    return Math.round(sum / this.buffer.length);
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();
