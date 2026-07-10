export type WidgetType =
  | 'stat-card'
  | 'metric-grid'
  | 'table'
  | 'alert-list'
  | 'node-grid'
  | 'transaction-feed'
  | 'deadline-list'
  | 'queue-panel'
  | 'entanglement-graph'
  | 'action-button'
  | 'text-block'
  | 'spacer';

export interface Widget {
  type: WidgetType;
  id: string;
  title?: string;
  dataBinding: string | null; // path in payload, or null for static
  props?: Record<string, any>;
  size?: 'small' | 'medium' | 'large' | 'full';
  order?: number;
}

export interface InterfaceDescription {
  layout: 'single-column' | 'two-column' | 'grid' | 'focus-mode' | 'guided';
  density: 'minimal' | 'moderate' | 'detailed' | 'exhaustive';
  navigation: 'sidebar' | 'top-tabs' | 'breadcrumb' | 'contextual' | 'hidden';
  interactions: 'direct-manipulation' | 'guided' | 'exploratory' | 'batch';
  feedback: 'subtle' | 'explicit' | 'adaptive' | 'none';
  widgets: Widget[];
  nextStep?: { label: string; action: string; dataBinding?: string };
  crisisMode: boolean;
}

export interface GeneratorInput {
  passport: any; // normalized v4.1 subset
  viewData: any; // from /usertest/views/:role
  signals?: any; // from SSE stream
  role: 'coordinator' | 'researcher' | 'participant' | 'grant-reviewer';
  spoons: number; // 0–5
}
