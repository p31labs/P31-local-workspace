// A2UI v0.9 adapter — maps P31 InterfaceDescription -> A2UI v0.9 wire message.
// Ground truth: A2UI v0.9 specification (https://a2ui.org/specification/v0_9/),
// inspected from the published a2ui-core 0.1.1 / a2ui-agent-sdk 0.4.0
// (installed at ~/a2ui-app). The pip SDK version is 0.4.0; the wire
// schema it emits is v0.9.
//
// Message = oneOf createSurface / updateComponents / updateDataModel / deleteSurface.
// Components are discriminated by `component` (Text|Card|Column|Row|List|Button|...).
// Exactly ONE component MUST have id "root". `version` is the const string "v0.9".

import type { InterfaceDescription, Widget } from '../types';
import { ICON_CATALOG } from './icons';

export type A2UIComponentName =
  | 'Text' | 'Image' | 'Icon' | 'Video' | 'AudioPlayer'
  | 'Row' | 'Column' | 'List' | 'Card' | 'Tabs' | 'Modal'
  | 'Divider' | 'Button' | 'TextField' | 'CheckBox'
  | 'ChoicePicker' | 'Slider' | 'DateTimeInput';

export interface IconProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  label?: string;
}

export interface A2UIComponent {
  id: string;
  component: A2UIComponentName;
  accessibility?: { label?: string; description?: string };
  children?: string[] | { componentId: string; path: string };
  weight?: number;
  props?: Record<string, unknown>;
}

export interface A2UICreateSurface {
  surfaceId: string;
  catalogId: string;
  theme?: Record<string, any>;
  sendDataModel?: boolean;
}

export interface A2UIUpdateComponents {
  surfaceId: string;
  components: A2UIComponent[];
}

export interface A2UIP31WidgetMeta {
  id: string;
  type: string;
  dataBinding: string | null;
  size?: 'small' | 'medium' | 'large' | 'full';
  order?: number;
  props?: Record<string, unknown>;
}

// P31 custom extension namespace — A2UI clients ignore unknown extensions.
export interface A2UIP31Extension {
  crisisMode?: boolean;
  spoons?: number;
  density?: InterfaceDescription['density'];
  layout?: InterfaceDescription['layout'];
  widgets?: A2UIP31WidgetMeta[];
}

export interface A2UIMessage {
  version: 'v0.9';
  createSurface?: A2UICreateSurface;
  updateComponents?: A2UIUpdateComponents;
  updateDataModel?: { surfaceId: string; path?: string; value?: unknown };
  deleteSurface?: { surfaceId: string };
  extensions?: { p31?: A2UIP31Extension };
}

// P31 WidgetType -> A2UI v0.9 `component` name.
export const WIDGET_TO_A2UI: Record<string, A2UIComponentName> = {
  'stat-card': 'Card',
  'metric-grid': 'Column',
  'table': 'Card',
  'alert-list': 'List',
  'node-grid': 'Column',
  'transaction-feed': 'List',
  'deadline-list': 'List',
  'queue-panel': 'List',
  'entanglement-graph': 'Column',
  'action-button': 'Button',
  'text-block': 'Text',
  'spacer': 'Divider',
};

function mapLayoutToContainer(layout: InterfaceDescription['layout']): A2UIComponentName {
  // A2UI has Row/Column containers; map P31 layouts onto them.
  if (layout === 'two-column' || layout === 'grid') return 'Row';
  return 'Column';
}

function mapDensityToTheme(density: InterfaceDescription['density']): Record<string, any> {
  return { primaryColor: '#22d3ee', density, iconCatalog: ICON_CATALOG };
}

function widgetToA2UI(w: Widget, index: number): A2UIComponent {
  const component = WIDGET_TO_A2UI[w.type] ?? 'Card';
  const comp: A2UIComponent = {
    id: w.id || `widget-${index}`,
    component,
  };
  if (w.title) comp.accessibility = { label: w.title };
  return comp;
}

// Main adapter. `spoons` is carried from GeneratorInput (not in
// InterfaceDescription) so the A2UI renderer can scale motion/contrast per DESIGN.md.
export function toA2UI(description: InterfaceDescription, spoons?: number): A2UIMessage {
  const surfaceId = 'p31-surface';
  const container = mapLayoutToContainer(description.layout);

  const children = description.widgets.map((w, i) => w.id || `widget-${i}`);
  const root: A2UIComponent = {
    id: 'root',
    component: container,
    accessibility: { label: 'P31 Surface' },
    children,
  };

  const widgetComponents = description.widgets.map((w, i) => widgetToA2UI(w, i));
  const components: A2UIComponent[] = [root, ...widgetComponents];

  const p31Widgets: A2UIP31WidgetMeta[] = description.widgets.map((w, i) => ({
    id: w.id || `widget-${i}`,
    type: w.type,
    dataBinding: w.dataBinding,
    size: w.size,
    order: w.order,
    props: w.props,
  }));

  const message: A2UIMessage = {
    version: 'v0.9',
    createSurface: {
      surfaceId,
      catalogId: 'p31ca.org:a2ui',
      theme: mapDensityToTheme(description.density),
      sendDataModel: false,
    },
    updateComponents: { surfaceId, components },
  };

  if (description.crisisMode || spoons !== undefined) {
    message.extensions = {
      p31: {
        crisisMode: description.crisisMode,
        spoons,
        density: description.density,
        layout: description.layout,
        widgets: p31Widgets,
      },
    };
  }

  return message;
}

export function validateA2UI(msg: A2UIMessage): boolean {
  if (msg.version !== 'v0.9') return false;
  const components = msg.updateComponents?.components;
  if (!components || components.length === 0) return false;
  const ids = new Set(components.map((c) => c.id));
  if (!ids.has('root')) return false;
  for (const c of components) {
    if (Array.isArray(c.children)) {
      for (const child of c.children) {
        if (!ids.has(child)) return false;
      }
    }
  }
  return true;
}
