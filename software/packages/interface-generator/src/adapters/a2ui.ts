// [VERIFY] A2UI v0.9 adapter — maps P31 InterfaceDescription → A2UI declarative schema.
// Ground truth: A2UI v0.9 (April 2026), Agent SDK on PyPI (`a2ui-agent-sdk`).
// This environment cannot reach PyPI, so exact A2UI wire field names are flagged
// [VERIFY] and must be confirmed against the SDK once install is possible.
// The mapping itself (field-by-field) is in ../../a2ui-schema-mapping.md (CWP-2026-009/L4.2).

import type { InterfaceDescription, Widget } from '../types';

// [VERIFY] A2UI v0.9 component shape (from spec: declarative `components[]`).
// Exact prop names to be confirmed via SDK.
export interface A2UIComponent {
  id: string;
  type: string;
  props?: Record<string, unknown>;
  children?: A2UIComponent[];
}

// [VERIFY] A2UI v0.9 root document shape.
export interface A2UIRoot {
  version: '0.9';
  components: A2UIComponent[];
  // [VERIFY] P31 custom extension namespace — A2UI clients ignore unknown extensions.
  extensions?: { p31?: { crisisMode?: boolean; spoons?: number } };
}

// Exported so the map can be dynamically overridden/extended once the SDK
// reveals authoritative A2UI component type names.
export const WIDGET_TO_A2UI: Record<string, string> = {
  'stat-card': 'StatCard',
  'metric-grid': 'MetricGrid',
  'table': 'Table',
  'alert-list': 'AlertList',
  'node-grid': 'NodeGrid',
  'transaction-feed': 'TransactionFeed',
  'deadline-list': 'DeadlineList',
  'queue-panel': 'QueuePanel',
  'entanglement-graph': 'EntanglementGraph',
  'action-button': 'ActionButton',
  'text-block': 'TextBlock',
  'spacer': 'Spacer',
};

function widgetToA2UI(widget: Widget, index: number): A2UIComponent {
  const type = WIDGET_TO_A2UI[widget.type] ?? 'Unknown';
  return {
    id: widget.id || `widget-${index}`,
    type,
    props: {
      title: widget.title,
      dataBinding: widget.dataBinding,
      size: widget.size,
      order: widget.order,
      ...(widget.props ?? {}),
    },
    // [VERIFY] A2UI may use `children` for nested layouts; P31 widgets are flat.
  };
}

// [VERIFY] Main adapter. `spoons` is carried from GeneratorInput (not in
// InterfaceDescription) so the renderer can scale motion/contrast per DESIGN.md.
export function toA2UI(description: InterfaceDescription, spoons?: number): A2UIRoot {
  const components = description.widgets.map((w, i) => widgetToA2UI(w, i));

  // [VERIFY] A2UI v0.9 may require a root layout container (e.g. Flex/Grid)
  // derived from `description.layout`. Emitted flat for now; wrap once SDK confirms.
  const root: A2UIRoot = {
    version: '0.9',
    components,
  };

  if (description.crisisMode || spoons !== undefined) {
    root.extensions = {
      p31: { crisisMode: description.crisisMode, spoons },
    };
  }

  return root;
}
