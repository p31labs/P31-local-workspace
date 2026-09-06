/**
 * @file AdaptiveLayout.tsx — SMART Artifact responsive grid (CWP-2026-071, Track C).
 *
 * Pure CSS-driven responsive grid. The column count is a token (`--p31-columns`)
 * set by `css/size-class.css` according to `data-size-class`; this component just
 * maps children into evenly-sized tracks. No JS breakpoint logic, no re-render on
 * resize — the attribute flips and CSS reflows (see device.ts + size-class.css).
 */

import type { ReactNode, CSSProperties } from 'react';

export interface AdaptiveLayoutProps {
  children: ReactNode;
  /** Optional min track width before wrapping to fewer columns. */
  minColumnWidth?: string;
  /** Gap between tracks (token-backed; defaults to --p31-spacing-unit * 2). */
  gap?: string;
  className?: string;
  style?: CSSProperties;
}

export function AdaptiveLayout({
  children,
  minColumnWidth = 'minmax(0, 1fr)',
  gap = 'calc(var(--p31-spacing-unit, 8px) * 2)',
  className,
  style,
}: AdaptiveLayoutProps) {
  return (
    <div
      className={className}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(var(--p31-columns, 1), ${minColumnWidth})`,
        gap,
        width: '100%',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
