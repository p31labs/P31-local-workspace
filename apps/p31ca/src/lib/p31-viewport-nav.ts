/**
 * p31-viewport-nav.ts — Viewport-aware navigation behavior
 *
 * Features:
 * - Hide navigation on scroll down (more content space)
 * - Show navigation on scroll up (easy access)
 * - Smart detection of scroll intent (velocity-based)
 * - Keyboard navigation always works (escape key shows nav)
 * - Mobile bottom sheet alternative for small screens
 *
 * Respects prefers-reduced-motion for transitions.
 */

interface ViewportNavConfig {
  hideThreshold?: number;     // px scrolled before hiding (default: 100)
  showThreshold?: number;     // px scrolled up before showing (default: 50)
  velocityThreshold?: number; // px/ms for fast scroll detection (default: 0.5)
  bottomSheetBreakpoint?: number; // px width for mobile mode (default: 768)
}

class ViewportNavManager {
  private nav: HTMLElement | null = null;
  private lastScrollY = 0;
  private lastScrollTime = performance.now();
  private isHidden = false;
  private scrollDirection: 'up' | 'down' | 'none' = 'none';
  private config: Required<ViewportNavConfig>;
  private rafId: number | null = null;
  private ticking = false;

  constructor(config: ViewportNavConfig = {}) {
    this.config = {
      hideThreshold: config.hideThreshold ?? 100,
      showThreshold: config.showThreshold ?? 50,
      velocityThreshold: config.velocityThreshold ?? 0.5,
      bottomSheetBreakpoint: config.bottomSheetBreakpoint ?? 768,
    };
  }

  init(navElementId: string = 'p31-bottom-ribbon'): void {
    if (typeof window === 'undefined') return;

    this.nav = document.getElementById(navElementId);
    if (!this.nav) return;

    // Check for reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Apply initial styles
    this.nav.style.transition = prefersReducedMotion ? 'none' : 'transform 0.3s ease, opacity 0.3s ease';
    this.nav.style.willChange = 'transform, opacity';

    // Bind scroll handler with RAF throttling
    window.addEventListener('scroll', this.handleScroll, { passive: true });

    // Keyboard shortcut to show nav (Escape key)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isHidden) {
        this.showNav();
      }
    });

    // Handle resize for responsive behavior
    window.addEventListener('resize', () => {
      this.handleResize();
    });

    // Initial check
    this.handleResize();
  }

  private handleScroll = (): void => {
    if (!this.ticking) {
      this.rafId = requestAnimationFrame(() => {
        this.updateNav();
        this.ticking = false;
      });
      this.ticking = true;
    }
  };

  private updateNav(): void {
    const currentScrollY = window.scrollY;
    const currentTime = performance.now();
    const deltaY = currentScrollY - this.lastScrollY;
    const deltaTime = currentTime - this.lastScrollTime;
    const velocity = deltaTime > 0 ? Math.abs(deltaY / deltaTime) : 0;

    // Determine scroll direction
    if (deltaY > 0) {
      this.scrollDirection = 'down';
    } else if (deltaY < 0) {
      this.scrollDirection = 'up';
    }

    // Decision logic
    if (currentScrollY < this.config.hideThreshold) {
      // Always show nav near top
      this.showNav();
    } else if (this.scrollDirection === 'down' && deltaY > 10) {
      // Scrolling down - hide nav
      if (!this.isHidden && currentScrollY > this.lastScrollY + this.config.hideThreshold) {
        this.hideNav();
      }
    } else if (this.scrollDirection === 'up' && deltaY < -10) {
      // Scrolling up - show nav
      if (this.isHidden && (this.lastScrollY - currentScrollY > this.config.showThreshold || velocity > this.config.velocityThreshold)) {
        this.showNav();
      }
    }

    // Fast scroll detection (velocity-based)
    if (velocity > this.config.velocityThreshold * 2) {
      if (this.scrollDirection === 'down') {
        this.hideNav();
      } else if (this.scrollDirection === 'up') {
        this.showNav();
      }
    }

    this.lastScrollY = currentScrollY;
    this.lastScrollTime = currentTime;
  }

  private hideNav(): void {
    if (!this.nav || this.isHidden) return;

    this.isHidden = true;
    this.nav.style.transform = 'translateY(-100%)';
    this.nav.style.opacity = '0';

    // Dispatch event for other components
    window.dispatchEvent(new CustomEvent('p31:nav-hidden'));

    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(5);
    }
  }

  private showNav(): void {
    if (!this.nav || !this.isHidden) return;

    this.isHidden = false;
    this.nav.style.transform = 'translateY(0)';
    this.nav.style.opacity = '1';

    window.dispatchEvent(new CustomEvent('p31:nav-visible'));
  }

  private handleResize(): void {
    if (!this.nav) return;

    const isMobile = window.innerWidth < this.config.bottomSheetBreakpoint;

    if (isMobile) {
      // Mobile: transform from bottom (bottom sheet style)
      this.nav.setAttribute('data-nav-style', 'mobile');
    } else {
      // Desktop: transform from top (traditional nav)
      this.nav.setAttribute('data-nav-style', 'desktop');
    }
  }

  destroy(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
    window.removeEventListener('scroll', this.handleScroll);
  }
}

// Singleton
let viewportNavManager: ViewportNavManager | null = null;

export function initViewportNav(config?: ViewportNavConfig): ViewportNavManager {
  if (!viewportNavManager) {
    viewportNavManager = new ViewportNavManager(config);
    viewportNavManager.init();
  }
  return viewportNavManager;
}

export function getViewportNav(): ViewportNavManager | null {
  return viewportNavManager;
}

// Auto-init on DOM ready (only on mobile/touch devices)
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  if (isTouchDevice) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => initViewportNav());
    } else {
      initViewportNav();
    }
  }
}
