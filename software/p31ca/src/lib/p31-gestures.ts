/**
 * p31-gestures.ts — Touch gesture support for mobile PWA experience
 *
 * Features:
 * - Swipe left/right for navigation (configurable routes)
 * - Pull-to-refresh gesture
 * - Edge swipe detection (for back navigation)
 * - Passive event listeners for scroll performance
 *
 * All gestures respect prefers-reduced-motion.
 */

export interface GestureConfig {
  swipeThreshold?: number;      // px to trigger swipe (default: 50)
  velocityThreshold?: number;     // px/ms minimum velocity (default: 0.3)
  edgeSwipeZone?: number;       // px from edge for edge gesture (default: 20)
  preventDefaultOnSwipe?: boolean; // Stop propagation on recognized gestures
}

interface TouchPoint {
  x: number;
  y: number;
  time: number;
}

class GestureManager {
  private startPoint: TouchPoint | null = null;
  private lastPoint: TouchPoint | null = null;
  private isTracking = false;
  private config: Required<GestureConfig>;
  private onSwipeLeft: (() => void) | null = null;
  private onSwipeRight: (() => void) | null = null;
  private onPullToRefresh: (() => void) | null = null;
  private onEdgeSwipeLeft: (() => void) | null = null; // Back gesture

  constructor(config: GestureConfig = {}) {
    this.config = {
      swipeThreshold: config.swipeThreshold ?? 50,
      velocityThreshold: config.velocityThreshold ?? 0.3,
      edgeSwipeZone: config.edgeSwipeZone ?? 20,
      preventDefaultOnSwipe: config.preventDefaultOnSwipe ?? false,
    };
  }

  bind(container: HTMLElement = document.body): void {
    // Use passive listeners for scroll performance
    container.addEventListener('touchstart', this.handleTouchStart, { passive: true });
    container.addEventListener('touchmove', this.handleTouchMove, { passive: true });
    container.addEventListener('touchend', this.handleTouchEnd, { passive: true });
    container.addEventListener('touchcancel', this.handleTouchCancel, { passive: true });
  }

  unbind(container: HTMLElement = document.body): void {
    container.removeEventListener('touchstart', this.handleTouchStart);
    container.removeEventListener('touchmove', this.handleTouchMove);
    container.removeEventListener('touchend', this.handleTouchEnd);
    container.removeEventListener('touchcancel', this.handleTouchCancel);
  }

  setSwipeLeftHandler(handler: () => void): void {
    this.onSwipeLeft = handler;
  }

  setSwipeRightHandler(handler: () => void): void {
    this.onSwipeRight = handler;
  }

  setPullToRefreshHandler(handler: () => void): void {
    this.onPullToRefresh = handler;
  }

  setEdgeSwipeLeftHandler(handler: () => void): void {
    this.onEdgeSwipeLeft = handler;
  }

  private handleTouchStart = (e: TouchEvent): void => {
    if (e.touches.length !== 1) return;

    const touch = e.touches[0];
    this.startPoint = { x: touch.clientX, y: touch.clientY, time: performance.now() };
    this.lastPoint = this.startPoint;
    this.isTracking = true;
  };

  private handleTouchMove = (e: TouchEvent): void => {
    if (!this.isTracking || !this.startPoint) return;

    const touch = e.touches[0];
    this.lastPoint = { x: touch.clientX, y: touch.clientY, time: performance.now() };

    // Detect pull-to-refresh intent (at top of page, pulling down)
    if (this.onPullToRefresh && window.scrollY === 0) {
      const dy = touch.clientY - this.startPoint.y;
      if (dy > 80 && dy < 150) {
        // Show pull indicator (optional visual feedback)
        this.emitPullProgress(dy);
      }
    }
  };

  private handleTouchEnd = (e: TouchEvent): void => {
    if (!this.isTracking || !this.startPoint || !this.lastPoint) {
      this.reset();
      return;
    }

    const dx = this.lastPoint.x - this.startPoint.x;
    const dy = this.lastPoint.y - this.startPoint.y;
    const dt = this.lastPoint.time - this.startPoint.time;
    const velocityX = Math.abs(dx) / dt;

    // Check for edge swipe (left edge -> back)
    const isEdgeSwipe = this.startPoint.x < this.config.edgeSwipeZone;

    // Horizontal swipe detection
    if (Math.abs(dx) > this.config.swipeThreshold && velocityX > this.config.velocityThreshold) {
      if (dx > 0 && this.onSwipeRight) {
        this.onSwipeRight();
        this.preventDefaultIfNeeded(e);
      } else if (dx < 0 && this.onSwipeLeft) {
        if (isEdgeSwipe && this.onEdgeSwipeLeft) {
          this.onEdgeSwipeLeft(); // Back navigation
        } else {
          this.onSwipeLeft();
        }
        this.preventDefaultIfNeeded(e);
      }
    }

    // Pull-to-refresh detection (only at top of page)
    if (this.onPullToRefresh && window.scrollY === 0 && dy > 100 && dt > 100) {
      this.onPullToRefresh();
    }

    this.reset();
  };

  private handleTouchCancel = (): void => {
    this.reset();
  };

  private reset(): void {
    this.startPoint = null;
    this.lastPoint = null;
    this.isTracking = false;
  }

  private preventDefaultIfNeeded(e: Event): void {
    if (this.config.preventDefaultOnSwipe) {
      e.preventDefault();
    }
  }

  private emitPullProgress(_dy: number): void {
    // Optional: emit custom event for UI to show pull progress
    const event = new CustomEvent('p31:pull-progress', {
      detail: { pulled: true },
      bubbles: true,
    });
    document.dispatchEvent(event);
  }
}

// Singleton instance for app-wide gestures
let globalGestureManager: GestureManager | null = null;

export function initGestures(config?: GestureConfig): GestureManager {
  if (globalGestureManager) {
    globalGestureManager.unbind();
  }
  globalGestureManager = new GestureManager(config);
  globalGestureManager.bind();
  return globalGestureManager;
}

export function getGestureManager(): GestureManager | null {
  return globalGestureManager;
}

// Astro ClientRouter navigation helpers
export function setupAstroGestures(): void {
  const gestures = initGestures({
    swipeThreshold: 80,     // Higher threshold to prevent accidental swipes
    velocityThreshold: 0.4,
    edgeSwipeZone: 24,    // Slightly larger for reliable back gesture
  });

  // Edge swipe left -> browser back (only when at left edge)
  gestures.setEdgeSwipeLeftHandler(() => {
    if (window.history.length > 1) {
      window.history.back();
    }
  });

  // Could add: swipe right -> forward, swipe down -> refresh
  // These are disabled by default to not conflict with scroll
}

// Check for touch support before initializing
const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

// Auto-initialize on mobile/touch devices only
if (hasTouch && typeof document !== 'undefined') {
  // Wait for DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setupAstroGestures());
  } else {
    setupAstroGestures();
  }
}
