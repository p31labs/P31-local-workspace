/**
 * p31-virtual-keyboard.ts — Virtual Keyboard (VK) handling for mobile
 *
 * Addresses the mobile browser keyboard problem:
 * - Keyboard opens -> viewport resizes -> layout shifts
 * - Fixed elements get pushed up or obscured
 * - Scroll position lost
 *
 * Solutions:
 * - Visual Viewport API for accurate size
 * - Position fixed elements above keyboard
 * - Preserve scroll position across keyboard events
 */

interface VKState {
  visible: boolean;
  height: number;
  originalScrollY: number;
}

class VirtualKeyboardManager {
  private visualViewport: VisualViewport | null = null;
  private state: VKState = { visible: false, height: 0, originalScrollY: 0 };
  private fixedElements: HTMLElement[] = [];
  private listeners: Set<(state: VKState) => void> = new Set();

  constructor() {
    if (typeof window === 'undefined') return;

    // Use Visual Viewport API when available (modern browsers)
    if ('visualViewport' in window) {
      this.visualViewport = window.visualViewport;
      this.visualViewport?.addEventListener('resize', this.handleVisualViewportChange);
      this.visualViewport?.addEventListener('scroll', this.handleVisualViewportChange);
    } else {
      // Fallback: window resize detection (less accurate)
      window.addEventListener('resize', this.handleWindowResize);
    }

    // Track focus/blur on inputs
    document.addEventListener('focusin', this.handleFocusIn);
    document.addEventListener('focusout', this.handleFocusOut);
  }

  private handleVisualViewportChange = (): void => {
    if (!this.visualViewport) return;

    const windowHeight = window.innerHeight;
    const viewportHeight = this.visualViewport.height;
    const keyboardHeight = windowHeight - viewportHeight;

    const wasVisible = this.state.visible;
    this.state.visible = keyboardHeight > 150; // Threshold for VK
    this.state.height = Math.max(0, keyboardHeight);

    if (this.state.visible && !wasVisible) {
      // Keyboard opened
      this.state.originalScrollY = window.scrollY;
      this.notifyListeners();
      this.adjustFixedElements();
    } else if (!this.state.visible && wasVisible) {
      // Keyboard closed
      this.notifyListeners();
      this.restoreFixedElements();
      // Restore scroll position with delay (browser may have scrolled)
      setTimeout(() => {
        window.scrollTo(0, this.state.originalScrollY);
      }, 100);
    }
  };

  private handleWindowResize = (): void => {
    // Less accurate fallback
    const windowHeight = window.innerHeight;
    const screenHeight = window.screen.height;

    // Heuristic: if window is significantly smaller than screen, VK is likely open
    const keyboardLikelyOpen = windowHeight < screenHeight * 0.75;

    if (keyboardLikelyOpen !== this.state.visible) {
      this.state.visible = keyboardLikelyOpen;
      this.notifyListeners();
    }
  };

  private handleFocusIn = (e: FocusEvent): void => {
    const target = e.target as HTMLElement;
    if (this.isInputElement(target)) {
      // Scroll element into view after keyboard opens
      setTimeout(() => {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  };

  private handleFocusOut = (): void => {
    // Keyboard will close, handled by viewport events
  };

  private isInputElement(el: HTMLElement): boolean {
    const tag = el.tagName.toLowerCase();
    const isInput = tag === 'input' || tag === 'textarea' || tag === 'select';
    const isContentEditable = el.isContentEditable;
    return isInput || isContentEditable;
  }

  private adjustFixedElements(): void {
    // Find fixed elements that might be obscured by keyboard
    const allFixed = document.querySelectorAll<HTMLElement>('.p31-fixed-adjust, [data-vk-adjust]');

    allFixed.forEach((el) => {
      // Store original position
      if (!el.dataset.vkOriginalBottom) {
        const computed = getComputedStyle(el);
        el.dataset.vkOriginalBottom = computed.bottom;
      }

      // Move above keyboard
      el.style.bottom = `${this.state.height + 10}px`;
      el.style.transition = 'bottom 0.2s ease';
    });
  }

  private restoreFixedElements(): void {
    const allFixed = document.querySelectorAll<HTMLElement>('[data-vk-original-bottom]');

    allFixed.forEach((el) => {
      el.style.bottom = el.dataset.vkOriginalBottom || '';
      delete el.dataset.vkOriginalBottom;
    });
  }

  // Public API

  isKeyboardVisible(): boolean {
    return this.state.visible;
  }

  getKeyboardHeight(): number {
    return this.state.height;
  }

  onChange(callback: (state: VKState) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    this.listeners.forEach((cb) => cb(this.state));
  }

  /**
   * Scroll an element into view above the keyboard
   */
  scrollIntoView(element: HTMLElement): void {
    if (!this.state.visible) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Calculate position to ensure element is above keyboard
    const rect = element.getBoundingClientRect();
    const viewportHeight = this.visualViewport?.height || window.innerHeight;
    const spaceAboveKeyboard = viewportHeight - this.state.height;

    if (rect.bottom > spaceAboveKeyboard - 20) {
      const scrollNeeded = rect.bottom - spaceAboveKeyboard + 50;
      window.scrollBy({ top: scrollNeeded, behavior: 'smooth' });
    }
  }

  destroy(): void {
    if (this.visualViewport) {
      this.visualViewport.removeEventListener('resize', this.handleVisualViewportChange);
      this.visualViewport.removeEventListener('scroll', this.handleVisualViewportChange);
    } else {
      window.removeEventListener('resize', this.handleWindowResize);
    }

    document.removeEventListener('focusin', this.handleFocusIn);
    document.removeEventListener('focusout', this.handleFocusOut);
  }
}

// Singleton
let vkManager: VirtualKeyboardManager | null = null;

export function initVirtualKeyboard(): VirtualKeyboardManager {
  if (!vkManager && typeof window !== 'undefined') {
    vkManager = new VirtualKeyboardManager();
  }
  return vkManager!;
}

export function getVirtualKeyboard(): VirtualKeyboardManager | null {
  return vkManager;
}

// Auto-init on mobile only
if (typeof window !== 'undefined') {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  if (isMobile) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => initVirtualKeyboard());
    } else {
      initVirtualKeyboard();
    }
  }
}
