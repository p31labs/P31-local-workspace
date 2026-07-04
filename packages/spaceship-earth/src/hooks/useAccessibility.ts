// spaceship-earth/src/hooks/useAccessibility.ts
// Comprehensive accessibility hook system for quantum-level inclusive design
import { useEffect, useRef, useCallback, useState } from 'react';

export interface AccessibilityPreferences {
  reducedMotion: boolean;
  reducedTransparency: boolean;
  highContrast: boolean;
  focusVisibleOnly: boolean;
  skipAnimations: boolean;
  largeText: boolean;
  motorAccessibility: boolean;
  screenReaderMode: boolean;
}

export interface KeyboardShortcuts {
  [key: string]: {
    key: string;
    description: string;
    action: () => void;
    category: 'navigation' | 'interaction' | 'system';
  };
}

export interface FocusManagement {
  focusTrap: (container: HTMLElement) => void;
  restoreFocus: () => void;
  focusFirstInteractive: (container: HTMLElement) => void;
}

/**
 * Main accessibility hook providing comprehensive accessibility features
 */
export function useAccessibility() {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>({
    reducedMotion: false,
    reducedTransparency: false,
    highContrast: false,
    focusVisibleOnly: false,
    skipAnimations: false,
    largeText: false,
    motorAccessibility: false,
    screenReaderMode: false,
  });

  const focusHistory = useRef<HTMLElement[]>([]);
  const shortcutsRef = useRef<KeyboardShortcuts>({});
  const observerRef = useRef<MutationObserver | null>(null);

  // Initialize accessibility preferences from media queries and localStorage
  useEffect(() => {
    const mediaQueries = {
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)'),
      reducedTransparency: window.matchMedia('(prefers-reduced-transparency: reduce)'),
      highContrast: window.matchMedia('(forced-colors: active)'),
    };

    const updatePreferences = () => {
      const newPrefs: Partial<AccessibilityPreferences> = {
        reducedMotion: mediaQueries.reducedMotion.matches,
        reducedTransparency: mediaQueries.reducedTransparency.matches,
        highContrast: mediaQueries.highContrast.matches,
      };

      // Check localStorage for user preferences
      try {
        const saved = localStorage.getItem('p31-accessibility-preferences');
        if (saved) {
          const parsed = JSON.parse(saved);
          Object.assign(newPrefs, parsed);
        }
      } catch (e) {
        console.warn('[P31] Failed to load accessibility preferences:', e);
      }

      setPreferences(prev => ({ ...prev, ...newPrefs }));
    };

    updatePreferences();

    // Listen for media query changes
    Object.values(mediaQueries).forEach(mq => {
      mq.addEventListener('change', updatePreferences);
    });

    return () => {
      Object.values(mediaQueries).forEach(mq => {
        mq.removeEventListener('change', updatePreferences);
      });
    };
  }, []);

  // Apply CSS custom properties for accessibility preferences
  useEffect(() => {
    const root = document.documentElement;
    
    // Reduced motion
    if (preferences.reducedMotion || preferences.skipAnimations) {
      root.style.setProperty('--reduce-motion', '1');
      root.style.setProperty('--animation-duration', '0.01ms');
    } else {
      root.style.removeProperty('--reduce-motion');
      root.style.removeProperty('--animation-duration');
    }

    // Reduced transparency
    if (preferences.reducedTransparency) {
      root.style.setProperty('--reduce-transparency', '1');
    } else {
      root.style.removeProperty('--reduce-transparency');
    }

    // High contrast
    if (preferences.highContrast) {
      root.style.setProperty('--high-contrast', '1');
      root.classList.add('high-contrast-mode');
    } else {
      root.style.removeProperty('--high-contrast');
      root.classList.remove('high-contrast-mode');
    }

    // Large text
    if (preferences.largeText) {
      root.style.setProperty('--text-scale', '1.25');
    } else {
      root.style.removeProperty('--text-scale');
    }

    // Motor accessibility (larger touch targets)
    if (preferences.motorAccessibility) {
      root.style.setProperty('--touch-target-scale', '1.5');
      root.style.setProperty('--touch-sensitivity', '1');
    } else {
      root.style.removeProperty('--touch-target-scale');
      root.style.removeProperty('--touch-sensitivity');
    }

    // Save to localStorage
    try {
      localStorage.setItem('p31-accessibility-preferences', JSON.stringify(preferences));
    } catch (e) {
      console.warn('[P31] Failed to save accessibility preferences:', e);
    }
  }, [preferences]);

  // Keyboard shortcuts management
  const registerShortcut = useCallback((id: string, shortcut: KeyboardShortcuts[string]) => {
    shortcutsRef.current[id] = shortcut;
  }, []);

  const unregisterShortcut = useCallback((id: string) => {
    delete shortcutsRef.current[id];
  }, []);

  // Global keyboard event handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if typing in input/textarea
      if (e.target instanceof HTMLInputElement || 
          e.target instanceof HTMLTextAreaElement ||
          e.target instanceof HTMLSelectElement) {
        return;
      }

      // Handle focus-visible logic
      if (preferences.focusVisibleOnly) {
        document.body.classList.add('focus-visible');
      }

      // Process registered shortcuts
      Object.values(shortcutsRef.current).forEach(({ key, action }) => {
        if (e.key.toLowerCase() === key.toLowerCase()) {
          e.preventDefault();
          e.stopPropagation();
          action();
        }
      });

      // Built-in shortcuts
      switch (e.key) {
        case 'Escape':
          // Close modals, overlays
          const activeModal = document.querySelector('[role="dialog"][aria-modal="true"]');
          if (activeModal) {
            const closeBtn = activeModal.querySelector('[data-close]');
            if (closeBtn instanceof HTMLElement) {
              closeBtn.click();
            }
          }
          break;
        case 'Tab':
          // Ensure focus-visible class is applied
          if (preferences.focusVisibleOnly) {
            document.body.classList.add('focus-visible');
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [preferences.focusVisibleOnly]);

  // Focus management utilities
  const focusManagement: FocusManagement = {
    focusTrap: (container: HTMLElement) => {
      focusHistory.current.push(document.activeElement as HTMLElement);
      
      const focusableElements = container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as NodeListOf<HTMLElement>;
      
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      const handleKeydown = (e: KeyboardEvent) => {
        if (e.key === 'Tab') {
          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              e.preventDefault();
              lastElement.focus();
            }
          } else {
            if (document.activeElement === lastElement) {
              e.preventDefault();
              firstElement.focus();
            }
          }
        }
      };

      container.addEventListener('keydown', handleKeydown);
      
      // Focus first element
      if (firstElement) {
        firstElement.focus();
      }

      return () => {
        container.removeEventListener('keydown', handleKeydown);
      };
    },

    restoreFocus: () => {
      const lastFocus = focusHistory.current.pop();
      if (lastFocus && lastFocus.focus) {
        lastFocus.focus();
      }
    },

    focusFirstInteractive: (container: HTMLElement) => {
      const firstInteractive = container.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement;
      if (firstInteractive) {
        firstInteractive.focus();
      }
    },
  };

  // Screen reader utilities
  const screenReader = {
    announce: (message: string, priority: 'polite' | 'assertive' = 'polite') => {
      const liveRegion = document.getElementById('p31-live-region');
      if (liveRegion) {
        liveRegion.setAttribute('aria-live', priority);
        liveRegion.textContent = message;
        // Clear after a short delay to allow re-announcement
        setTimeout(() => {
          if (liveRegion.textContent === message) {
            liveRegion.textContent = '';
          }
        }, 1000);
      }
    },

    createLiveRegion: () => {
      if (!document.getElementById('p31-live-region')) {
        const region = document.createElement('div');
        region.id = 'p31-live-region';
        region.setAttribute('aria-live', 'polite');
        region.setAttribute('aria-atomic', 'true');
        region.style.position = 'absolute';
        region.style.left = '-10000px';
        region.style.width = '1px';
        region.style.height = '1px';
        region.style.overflow = 'hidden';
        document.body.appendChild(region);
      }
    },
  };

  // Motor accessibility utilities
  const motorAccessibility = {
    enhanceTouchTargets: (element: HTMLElement) => {
      if (preferences.motorAccessibility) {
        element.style.minHeight = '44px';
        element.style.minWidth = '44px';
        element.style.padding = '12px';
        element.style.margin = '-6px';
      }
    },

    addDwellClick: (element: HTMLElement, callback: () => void, delay = 1000) => {
      let timer: number;
      
      const handleMouseEnter = () => {
        timer = window.setTimeout(() => {
          callback();
        }, delay);
      };

      const handleMouseLeave = () => {
        if (timer) {
          clearTimeout(timer);
        }
      };

      element.addEventListener('mouseenter', handleMouseEnter);
      element.addEventListener('mouseleave', handleMouseLeave);

      return () => {
        element.removeEventListener('mouseenter', handleMouseEnter);
        element.removeEventListener('mouseleave', handleMouseLeave);
        if (timer) clearTimeout(timer);
      };
    },
  };

  // High contrast mode utilities
  const highContrast = {
    ensureContrast: (element: HTMLElement) => {
      if (preferences.highContrast) {
        element.style.outline = '2px solid ButtonText';
        element.style.outlineOffset = '2px';
      }
    },

    addHighContrastStyles: () => {
      if (preferences.highContrast) {
        const style = document.createElement('style');
        style.textContent = `
          .high-contrast-mode * {
            background-color: ButtonFace !important;
            color: ButtonText !important;
            border-color: ButtonText !important;
          }
          .high-contrast-mode button:hover,
          .high-contrast-mode a:hover {
            background-color: Highlight !important;
            color: HighlightText !important;
          }
        `;
        document.head.appendChild(style);
      }
    },
  };

  return {
    preferences,
    setPreferences,
    registerShortcut,
    unregisterShortcut,
    focusManagement,
    screenReader,
    motorAccessibility,
    highContrast,
    shortcuts: shortcutsRef.current,
  };
}

/**
 * Hook for managing skip navigation links
 */
export function useSkipNavigation() {
  useEffect(() => {
    // Create skip navigation link if it doesn't exist
    if (!document.getElementById('p31-skip-nav')) {
      const skipNav = document.createElement('a');
      skipNav.id = 'p31-skip-nav';
      skipNav.href = '#main-content';
      skipNav.className = 'skip-nav';
      skipNav.textContent = 'Skip to main content';
      skipNav.style.position = 'fixed';
      skipNav.style.top = '-100%';
      skipNav.style.left = '16px';
      skipNav.style.zIndex = '9999';
      skipNav.style.padding = '8px 16px';
      skipNav.style.background = 'var(--void)';
      skipNav.style.color = 'var(--cyan)';
      skipNav.style.border = '2px solid var(--cyan)';
      skipNav.style.borderRadius = 'var(--radius-sm)';
      skipNav.style.fontFamily = 'var(--font-data)';
      skipNav.style.fontSize = '12px';
      skipNav.style.textDecoration = 'none';
      skipNav.style.letterSpacing = '1px';
      skipNav.style.textShadow = 'var(--glow-cyan)';
      skipNav.style.transition = 'top var(--trans-base)';
      
      skipNav.addEventListener('focus', () => {
        skipNav.style.top = '8px';
      });
      
      skipNav.addEventListener('blur', () => {
        skipNav.style.top = '-100%';
      });

      document.body.appendChild(skipNav);
    }
  }, []);
}

/**
 * Hook for managing ARIA live regions
 */
export function useLiveRegion() {
  useEffect(() => {
    const region = document.createElement('div');
    region.id = 'p31-live-region';
    region.setAttribute('aria-live', 'polite');
    region.setAttribute('aria-atomic', 'true');
    region.style.position = 'absolute';
    region.style.left = '-10000px';
    region.style.width = '1px';
    region.style.height = '1px';
    region.style.overflow = 'hidden';
    document.body.appendChild(region);

    return () => {
      if (region.parentNode) {
        region.parentNode.removeChild(region);
      }
    };
  }, []);
}

/**
 * Hook for focus management in modals and overlays
 */
export function useFocusManagement() {
  const trapRef = useRef<(() => void) | null>(null);

  const trapFocus = useCallback((container: HTMLElement) => {
    const activeElement = document.activeElement as HTMLElement;
    
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      } else if (e.key === 'Escape') {
        // Close modal logic could go here
        const closeBtn = container.querySelector('[data-close]');
        if (closeBtn instanceof HTMLElement) {
          closeBtn.click();
        }
      }
    };

    container.addEventListener('keydown', handleKeydown);
    
    if (firstElement) {
      firstElement.focus();
    }

    trapRef.current = () => {
      container.removeEventListener('keydown', handleKeydown);
      if (activeElement && activeElement.focus) {
        activeElement.focus();
      }
    };

    return () => {
      if (trapRef.current) {
        trapRef.current();
        trapRef.current = null;
      }
    };
  }, []);

  const restoreFocus = useCallback(() => {
    if (trapRef.current) {
      trapRef.current();
      trapRef.current = null;
    }
  }, []);

  return { trapFocus, restoreFocus };
}

/**
 * Hook for announcing dynamic content changes to screen readers
 */
export function useAnnouncement() {
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const region = document.getElementById('p31-live-region');
    if (region) {
      region.setAttribute('aria-live', priority);
      region.textContent = message;
      setTimeout(() => {
        if (region.textContent === message) {
          region.textContent = '';
        }
      }, 1000);
    }
  }, []);

  return { announce };
}