/**
 * p31-haptics.ts — Haptic feedback for mobile interactions
 *
 * Wraps the Vibration API with graceful fallbacks and user preference checks.
 * Patterns designed for Material Design / iOS-style tactile feedback.
 *
 * Respects prefers-reduced-motion (which typically includes haptics).
 */

export type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection';

// Vibration patterns in milliseconds (on, off, on, off...)
const HAPTIC_PATTERNS: Record<HapticPattern, number[]> = {
  light: [10],           // Subtle tap
  medium: [20],          // Standard button press
  heavy: [40],           // Confirm/important action
  success: [10, 50, 20], // Two pulses: completion
  warning: [30, 30, 30], // Three pulses: attention needed
  error: [50, 30, 50, 30, 50], // Distinctive error pattern
  selection: [5],        // Very light: scroll/select tick
};

class HapticsManager {
  private supported: boolean;
  private enabled: boolean = true;

  constructor() {
    this.supported = 'vibrate' in navigator;

    // Check for reduced motion preference (includes haptics)
    if (typeof window !== 'undefined') {
      const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.enabled = !motionQuery.matches;

      motionQuery.addEventListener('change', (e) => {
        this.enabled = !e.matches;
      });
    }

    // Battery critical also disables haptics
    if (typeof window !== 'undefined') {
      window.addEventListener('p31:power-mode', (e: Event) => {
        const detail = (e as CustomEvent).detail;
        if (detail?.mode === 'critical') {
          this.enabled = false;
        }
      });
    }
  }

  /**
   * Trigger haptic feedback
   * @param pattern Predefined pattern or custom array in ms
   * @param intensityMultiplier Scale the pattern duration (0.5 to 2.0)
   */
  trigger(pattern: HapticPattern | number[], intensityMultiplier: number = 1): void {
    if (!this.supported || !this.enabled) return;

    const basePattern = Array.isArray(pattern) ? pattern : HAPTIC_PATTERNS[pattern];
    const scaledPattern = basePattern.map((ms) => Math.round(ms * intensityMultiplier));

    try {
      navigator.vibrate(scaledPattern);
    } catch (e) {
      // Vibration API may throw if user has disabled it
    }
  }

  /**
   * Light tap feedback - for subtle interactions
   */
  tap(): void {
    this.trigger('light');
  }

  /**
   * Button press feedback - standard interaction
   */
  press(): void {
    this.trigger('medium');
  }

  /**
   * Confirmation feedback - important action completed
   */
  confirm(): void {
    this.trigger('heavy');
  }

  /**
   * Success feedback - operation completed successfully
   */
  success(): void {
    this.trigger('success');
  }

  /**
   * Error feedback - something went wrong
   */
  error(): void {
    this.trigger('error');
  }

  /**
   * Warning feedback - requires attention
   */
  warning(): void {
    this.trigger('warning');
  }

  /**
   * Selection change feedback - scroll tick
   */
  selection(): void {
    this.trigger('selection');
  }

  /**
   * Disable haptics (user preference)
   */
  disable(): void {
    this.enabled = false;
  }

  /**
   * Enable haptics
   */
  enable(): void {
    this.enabled = true;
  }

  /**
   * Check if haptics are supported and enabled
   */
  isAvailable(): boolean {
    return this.supported && this.enabled;
  }
}

// Singleton instance
let hapticsManager: HapticsManager | null = null;

export function initHaptics(): HapticsManager {
  if (!hapticsManager) {
    hapticsManager = new HapticsManager();
  }
  return hapticsManager;
}

export function getHaptics(): HapticsManager | null {
  return hapticsManager;
}

// Auto-init
if (typeof window !== 'undefined') {
  initHaptics();
}

// Export singleton methods for convenience
export const haptics = {
  tap: () => hapticsManager?.tap(),
  press: () => hapticsManager?.press(),
  confirm: () => hapticsManager?.confirm(),
  success: () => hapticsManager?.success(),
  error: () => hapticsManager?.error(),
  warning: () => hapticsManager?.warning(),
  selection: () => hapticsManager?.selection(),
  trigger: (pattern: HapticPattern | number[], intensity?: number) =>
    hapticsManager?.trigger(pattern, intensity),
  isAvailable: () => hapticsManager?.isAvailable() ?? false,
};
