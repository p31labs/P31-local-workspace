/**
 * @file EphemeralProvider.tsx — Ephemeralization layer (CWP-2026-073).
 *
 * Wraps a set of surfaces and assigns [data-ui-active] to each child so the
 * ambient.css depth-of-field layer can demote non-focused surfaces to "ghost".
 *
 * ambientMode:
 *  - 'soft' (default): every surface defaults to 'true' (glowing). Focusing one
 *    demotes the rest to 'ghost'; releasing restores all to 'true'. Backwards
 *    compatible with WILLOW/PHOS which show several lit panels at once.
 *  - 'hard': only the focused surface is 'hero'; everything else is 'ghost' even
 *    at rest. Use for dense cockpit-style views.
 */

import { Children, cloneElement, isValidElement, type ReactNode } from 'react';
import { useSurfaceManager, type SurfaceFocusState } from '../hooks/useSurfaceManager';

export interface EphemeralProviderProps {
  children: ReactNode;
  ambientMode?: 'soft' | 'hard';
  /** Surface id for the element that should be hero when nothing is focused (hard mode). */
  defaultHero?: string;
}

function withActiveState(
  child: ReactNode,
  surfaceId: string | undefined,
  focus: string | null,
  mode: 'soft' | 'hard',
): ReactNode {
  if (!isValidElement(child)) return child;
  let state: SurfaceFocusState;
  if (focus) {
    state = surfaceId === focus ? 'hero' : 'ghost';
  } else if (mode === 'hard') {
    state = surfaceId === undefined ? 'true' : 'ghost';
  } else {
    state = 'true';
  }
  const props = child.props as Record<string, unknown>;
  return cloneElement(child, { ...props, 'data-ui-active': state });
}

export function EphemeralProvider({ children, ambientMode = 'soft', defaultHero }: EphemeralProviderProps) {
  const { activeSurface, focus, release } = useSurfaceManager();

  const resolvedFocus = activeSurface ?? (ambientMode === 'hard' ? defaultHero ?? null : null);

  const items = Children.toArray(children).map((child, i) => {
    const el = child as { props?: { 'data-surface-id'?: string; key?: unknown } };
    const surfaceId =
      el.props?.['data-surface-id'] ??
      (typeof child === 'object' && child !== null && 'key' in child ? String((child as { key: unknown }).key) : undefined) ??
      `surface-${i}`;
    const wrapped = withActiveState(child, surfaceId, resolvedFocus, ambientMode);
    // Auto-wire onClick → focus so any surfaced block becomes hero on click.
    if (isValidElement(wrapped)) {
      const wp = wrapped.props as Record<string, unknown>;
      return cloneElement(wrapped, {
        onClick: (e: React.MouseEvent) => {
          (wp.onClick as ((e: React.MouseEvent) => void) | undefined)?.(e);
          focus(surfaceId);
        },
      } as Record<string, unknown>);
    }
    return wrapped;
  });

  return (
    <div
      data-ephemeral={ambientMode}
      onKeyDown={(e) => {
        if (e.key === 'Escape') release();
      }}
      style={{ display: 'contents' }}
    >
      {items}
    </div>
  );
}
