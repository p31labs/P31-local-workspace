/**
 * @file device.ts — P31 runtime device detection (SMART Artifact / CWP-2026-071).
 *
 * Computes the device size-class + input mode from viewport width and pointer
 * capabilities, and writes them to <html data-size-class> / data-input>.
 *
 * The size-class drives CSS token overrides (css/size-class.css); layout is
 * resolved by CSS (grid-template-columns: repeat(var(--p31-columns), …)), so
 * no React re-render is required on resize — the attribute flips, CSS reflows.
 *
 * Hybrid input detection (touch + fine pointer → 'hybrid') handles touchscreen
 * Chromebooks, iPads with keyboards, and Surface devices correctly.
 */

import { useEffect } from 'react';

export type SizeClass = 'compact' | 'regular' | 'medium' | 'expanded';
export type InputMode = 'touch' | 'mouse' | 'hybrid';

/** Pure function: derive size-class + input mode from the current environment. */
export function getDeviceClass(): { sizeClass: SizeClass; inputMode: InputMode } {
  const w = typeof window !== 'undefined' ? window.innerWidth : 1024;
  let sizeClass: SizeClass = 'regular';
  if (w <= 480) sizeClass = 'compact';
  else if (w >= 768 && w <= 1023) sizeClass = 'medium';
  else if (w >= 1024) sizeClass = 'expanded';

  const hasTouch = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
  const hasMouse = typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches;
  const inputMode: InputMode = hasTouch && hasMouse ? 'hybrid' : hasTouch ? 'touch' : 'mouse';

  return { sizeClass, inputMode };
}

/** Writes data-size-class + data-input to <html> and keeps them in sync on resize. */
export function useDeviceClass(): void {
  useEffect(() => {
    const update = () => {
      const { sizeClass, inputMode } = getDeviceClass();
      document.documentElement.dataset.sizeClass = sizeClass;
      document.documentElement.dataset.input = inputMode;
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
}
