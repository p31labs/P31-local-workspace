/**
 * @file useFocusTrap — Keyboard focus trap for overlay / modal containers.
 *
 * When `active` is true:
 *   - Moves focus to the first focusable element inside `containerRef`
 *   - Tab cycles forward through focusable elements, wrapping at the end
 *   - Shift+Tab cycles backwards, wrapping at the start
 *   - Escape fires the optional `onEscape` callback (e.g. close the overlay)
 *   - Restores focus to the element that had it before the trap activated
 *
 * No npm dependency — hand-rolled to avoid bundle cost of focus-trap-react.
 * Listens on the container (not window) so it doesn't conflict with other handlers.
 */

import { useEffect } from 'react';

// Selector for all keyboard-reachable elements
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'summary',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(', ');

export function useFocusTrap(
  containerRef: React.RefObject<HTMLElement | null>,
  active: boolean,
  onEscape?: () => void,
): void {
  useEffect(() => {
    if (!active || !containerRef.current) return;

    const container = containerRef.current;
    // Snapshot the currently focused element — restore on deactivation
    const previouslyFocused = document.activeElement as HTMLElement | null;

    // Defer first-focus by one microtask so overlay CSS transitions don't fight focus
    const focusTimer = setTimeout(() => {
      const first = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)[0];
      first?.focus();
    }, 0);

    function getFocusable(): HTMLElement[] {
      // Exclude elements hidden by inert or not in layout (offsetParent = null)
      return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        el => !el.closest('[inert]') && (el.offsetParent !== null || el instanceof HTMLElement && el.style.position === 'fixed'),
      );
    }

    function handleKeyDown(e: KeyboardEvent): void {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onEscape?.();
        return;
      }

      if (e.key !== 'Tab') return;

      const focusable = getFocusable();
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        // Backwards: if focus is on first element, wrap to last
        if (document.activeElement === first || !container.contains(document.activeElement)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        // Forwards: if focus is on last element, wrap to first
        if (document.activeElement === last || !container.contains(document.activeElement)) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(focusTimer);
      container.removeEventListener('keydown', handleKeyDown);
      // Return focus to where the user was before the overlay opened
      previouslyFocused?.focus?.();
    };
  }, [active, containerRef, onEscape]);
}
