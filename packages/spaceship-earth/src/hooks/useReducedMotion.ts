/**
 * @file useReducedMotion — React hook that tracks prefers-reduced-motion media query.
 *
 * Returns `true` when the user has requested reduced motion via OS accessibility
 * settings. Responds to live changes (e.g. user toggles setting while app is open).
 *
 * Usage:
 *   const reduceMotion = useReducedMotion();
 *   style={{ animation: reduceMotion ? 'none' : 'breathe 4s infinite' }}
 *
 * For non-React code (Three.js RAF): call `prefersReducedMotion()` directly.
 */

import { useState, useEffect } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

/** Synchronous check — safe to call in RAF callbacks, event handlers, useEffect bodies. */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(QUERY).matches;
}

/** React hook version — triggers re-render when the media query changes. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() => prefersReducedMotion());

  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    // Modern API: addEventListener (Chrome 79+, Firefox 55+, Safari 14+)
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return reduced;
}
