/**
 * @file widgetToComponentMap.ts — Bridge generator → @p31/ui vocabulary (CWP-2026-073).
 *
 * The interface-generator reasons in abstract WidgetTypes (stat-card, metric-grid, …)
 * while the Page Builder / @p31/ui reason in physical ComponentEntry ids
 * (GlassCard, GlowButton, …). This adapter decouples them: the generator keeps
 * emitting abstract widgets; the renderer consults this map to pick the matching
 * physical block + its ambient surfaceId, without either side being refactored.
 */

import type { WidgetType } from '../types';

/** Abstract widget → @p31/ui ComponentEntry id (mirrors components.ts). */
export const widgetToComponentMap: Record<WidgetType, string> = {
  'stat-card': 'GlassCard',
  'metric-grid': 'GlassCard',
  table: 'GlassCard',
  'alert-list': 'GlassCard',
  'node-grid': 'K4Hero',
  'transaction-feed': 'GlassCard',
  'deadline-list': 'GlassCard',
  'queue-panel': 'GlassCard',
  'entanglement-graph': 'K4Hero',
  'action-button': 'GlowButton',
  'text-block': 'GlassCard',
  spacer: 'GlassCard',
};

/** Resolve a widget's physical block id, falling back to the abstract type. */
export function resolveComponentId(type: WidgetType): string {
  return widgetToComponentMap[type] ?? type;
}
