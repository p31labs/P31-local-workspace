/**
 * @p31/interface-generator/src/plasma.ts — PLASMA event-sourced mutation layer.
 *
 * Treats interfaces as organisms that accumulate changes over time,
 * preserving complete history. Enables undo/redo, time-travel debugging,
 * and collaborative editing.
 *
 * Research basis: PLASMA protocol treats interfaces as organisms that
 * accumulate changes over time, preserving complete history (2026).
 */

import type { InterfaceDescription, Widget } from './types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MutationType = 'addWidget' | 'removeWidget' | 'reorderWidget' | 'updateWidget' | 'setIntent';

export interface MutationEvent {
  type: MutationType;
  payload: unknown;
  timestamp: number;
  sessionId: string;
}

export interface AddWidgetPayload {
  widget: Widget;
  index?: number;
}

export interface RemoveWidgetPayload {
  widgetId: string;
}

export interface ReorderWidgetPayload {
  fromIndex: number;
  toIndex: number;
}

export interface UpdateWidgetPayload {
  widgetId: string;
  changes: Partial<Widget>;
}

export interface SetIntentPayload {
  intent: string;
}

export interface UIState {
  description: InterfaceDescription;
  events: MutationEvent[];
  version: number;
  sessionId: string;
  /** Original description at genesis (used for undo back to start). */
  initialDescription: InterfaceDescription;
}

// ---------------------------------------------------------------------------
// State management
// ---------------------------------------------------------------------------

export function createInitialState(
  description: InterfaceDescription,
  sessionId: string,
): UIState {
  return {
    description,
    events: [],
    version: 0,
    sessionId,
    initialDescription: { ...description },
  };
}

export function applyMutation(state: UIState, event: MutationEvent): UIState {
  const nextDescription = mutateDescription(state.description, event);
  return {
    description: nextDescription,
    events: [...state.events, event],
    version: state.version + 1,
    sessionId: state.sessionId,
    initialDescription: state.initialDescription,
  };
}

function mutateDescription(
  desc: InterfaceDescription,
  event: MutationEvent,
): InterfaceDescription {
  switch (event.type) {
    case 'addWidget': {
      const payload = event.payload as AddWidgetPayload;
      const widgets = [...desc.widgets];
      if (payload.index !== undefined && payload.index >= 0 && payload.index <= widgets.length) {
        widgets.splice(payload.index, 0, payload.widget);
      } else {
        widgets.push(payload.widget);
      }
      return { ...desc, widgets };
    }
    case 'removeWidget': {
      const payload = event.payload as RemoveWidgetPayload;
      const widgets = desc.widgets.filter((w) => w.id !== payload.widgetId);
      return { ...desc, widgets };
    }
    case 'reorderWidget': {
      const payload = event.payload as ReorderWidgetPayload;
      const widgets = [...desc.widgets];
      const [moved] = widgets.splice(payload.fromIndex, 1);
      widgets.splice(payload.toIndex, 0, moved);
      return { ...desc, widgets };
    }
    case 'updateWidget': {
      const payload = event.payload as UpdateWidgetPayload;
      const widgets = desc.widgets.map((w) =>
        w.id === payload.widgetId ? { ...w, ...payload.changes } : w,
      );
      return { ...desc, widgets };
    }
    case 'setIntent': {
      const payload = event.payload as SetIntentPayload;
      return { ...desc, intent: payload.intent };
    }
    default:
      return desc;
  }
}

export function reconstructState(events: MutationEvent[]): UIState {
  if (events.length === 0) {
    throw new Error('Cannot reconstruct state from empty event history');
  }
  const genesis = events[0];
  const initial: InterfaceDescription = {
    id: `reconstructed-${genesis.sessionId}`,
    intent: '',
    layout: 'single-column',
    density: 'minimal',
    navigation: 'top-tabs',
    interactions: 'guided',
    feedback: 'subtle',
    widgets: [],
    crisisMode: false,
    metadata: {},
  };
  let current = createInitialState(initial, genesis.sessionId);
  for (const event of events) {
    current = applyMutation(current, event);
  }
  return current;
}

export function undo(state: UIState): UIState {
  if (state.events.length === 0) {
    return state;
  }
  const remaining = state.events.slice(0, -1);
  if (remaining.length === 0) {
    return {
      ...state,
      description: { ...state.initialDescription },
      version: 0,
      events: [],
    };
  }
  return reconstructState(remaining);
}

export function redo(state: UIState, event: MutationEvent): UIState {
  return applyMutation(state, event);
}

export function getEventHistory(state: UIState): MutationEvent[] {
  return [...state.events];
}

export function getVersion(state: UIState): number {
  return state.version;
}
