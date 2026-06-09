/**
 * p31-battery-aware.ts — Battery and thermal state management for P31
 *
 * Features:
 * - Battery API monitoring (level, charging state)
 * - Thermal throttling detection via performance metrics
 * - Adaptive quality based on power state
 * - Respects prefers-reduced-motion
 *
 * Automatically reduces GPU/CPU load when battery is low or thermal throttling detected.
 */

export interface BatteryState {
  level: number;        // 0.0 to 1.0
  charging: boolean;
  chargingTime: number; // seconds, Infinity if not charging
  dischargingTime: number; // seconds, Infinity if charging
  supported: boolean;
}

export type PowerMode = 'high' | 'balanced' | 'low' | 'critical';

interface BatteryListeners {
  onLevelChange?: (level: number) => void;
  onChargingChange?: (charging: boolean) => void;
  onModeChange?: (mode: PowerMode) => void;
}

class BatteryManager {
  private battery: BatteryState | null = null;
  private listeners: BatteryListeners = {};
  private mode: PowerMode = 'balanced';
  private thermalThrottled = false;
  private batteryApi: any = null;

  constructor() {
    this.detectThermalThrottling();
  }

  async init(): Promise<boolean> {
    // Check for Battery API support
    if (!('getBattery' in navigator)) {
      this.battery = { supported: false, level: 1, charging: true, chargingTime: Infinity, dischargingTime: Infinity };
      return false;
    }

    try {
      this.batteryApi = await (navigator as any).getBattery();
      this.updateBatteryState();
      this.attachBatteryListeners();
      this.updatePowerMode();
      return true;
    } catch (err) {
      console.warn('[P31 Battery] API error:', err);
      this.battery = { supported: false, level: 1, charging: true, chargingTime: Infinity, dischargingTime: Infinity };
      return false;
    }
  }

  private updateBatteryState(): void {
    if (!this.batteryApi) return;

    this.battery = {
      supported: true,
      level: this.batteryApi.level,
      charging: this.batteryApi.charging,
      chargingTime: this.batteryApi.chargingTime,
      dischargingTime: this.batteryApi.dischargingTime,
    };
  }

  private attachBatteryListeners(): void {
    if (!this.batteryApi) return;

    this.batteryApi.addEventListener('levelchange', () => {
      const oldLevel = this.battery?.level;
      this.updateBatteryState();
      if (this.listeners.onLevelChange && oldLevel !== this.battery?.level) {
        this.listeners.onLevelChange(this.battery!.level);
      }
      this.updatePowerMode();
    });

    this.batteryApi.addEventListener('chargingchange', () => {
      this.updateBatteryState();
      if (this.listeners.onChargingChange) {
        this.listeners.onChargingChange(this.battery!.charging);
      }
      this.updatePowerMode();
    });
  }

  private updatePowerMode(): void {
    if (!this.battery) return;

    const oldMode = this.mode;

    if (this.battery.charging) {
      this.mode = 'high';
    } else if (this.battery.level <= 0.1 || this.thermalThrottled) {
      this.mode = 'critical';
    } else if (this.battery.level <= 0.2) {
      this.mode = 'low';
    } else {
      this.mode = 'balanced';
    }

    if (oldMode !== this.mode && this.listeners.onModeChange) {
      this.listeners.onModeChange(this.mode);
    }

    // Dispatch global event for other modules
    window.dispatchEvent(new CustomEvent('p31:power-mode', {
      detail: { mode: this.mode, battery: this.battery, thermal: this.thermalThrottled }
    }));
  }

  private detectThermalThrottling(): void {
    // Detect thermal throttling via PerformanceObserver (if available)
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          // Check for long tasks (>50ms) which may indicate throttling
          if (entry.entryType === 'longtask' && (entry as any).duration > 100) {
            this.thermalThrottled = true;
            this.updatePowerMode();

            // Reset after 30 seconds if no more long tasks
            setTimeout(() => {
              this.thermalThrottled = false;
              this.updatePowerMode();
            }, 30000);
          }
        }
      });

      observer.observe({ entryTypes: ['longtask'] } as any);
    } catch (e) {
      // Longtask observer not supported
    }
  }

  // Public API

  getState(): BatteryState | null {
    return this.battery;
  }

  getMode(): PowerMode {
    return this.mode;
  }

  isThermalThrottled(): boolean {
    return this.thermalThrottled;
  }

  setListeners(listeners: BatteryListeners): void {
    this.listeners = listeners;
  }

  // Check if we should reduce motion/quality
  shouldReduceMotion(): boolean {
    // Respect prefers-reduced-motion first
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return true;
    }

    // Reduce motion in critical battery mode
    if (this.mode === 'critical') {
      return true;
    }

    return false;
  }

  // Check if we should reduce GPU quality
  shouldReduceQuality(): boolean {
    return this.mode === 'low' || this.mode === 'critical' || this.thermalThrottled;
  }

  // Get starfield particle count based on power mode
  getStarfieldQuality(): { count: number; speed: number } {
    switch (this.mode) {
      case 'critical':
        return { count: 0, speed: 0 }; // Disable starfield
      case 'low':
        return { count: 200, speed: 0.05 }; // Reduced
      case 'balanced':
        return { count: 600, speed: 0.12 }; // Normal
      case 'high':
        return { count: 800, speed: 0.15 }; // Full
    }
  }
}

// Singleton instance
let batteryManager: BatteryManager | null = null;

export function initBatteryAware(): BatteryManager {
  if (!batteryManager) {
    batteryManager = new BatteryManager();
    batteryManager.init();
  }
  return batteryManager;
}

export function getBatteryManager(): BatteryManager | null {
  return batteryManager;
}

// Auto-init when DOM is ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initBatteryAware());
  } else {
    initBatteryAware();
  }
}

// React to prefers-reduced-motion changes
if (typeof window !== 'undefined') {
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  motionQuery.addEventListener('change', () => {
    window.dispatchEvent(new CustomEvent('p31:motion-preference', {
      detail: { reduced: motionQuery.matches }
    }));
  });
}
