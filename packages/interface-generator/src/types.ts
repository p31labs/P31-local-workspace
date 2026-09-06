export type SizeClass = 'compact' | 'regular' | 'medium' | 'expanded';

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
  | 'icon-grid'
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
  id?: string;
  intent?: string;
  layout: 'single-column' | 'two-column' | 'grid' | 'focus-mode' | 'guided';
  density: 'minimal' | 'moderate' | 'detailed' | 'exhaustive';
  navigation: 'sidebar' | 'top-tabs' | 'breadcrumb' | 'contextual' | 'hidden';
  interactions: 'direct-manipulation' | 'guided' | 'exploratory' | 'batch';
  feedback: 'subtle' | 'explicit' | 'adaptive' | 'none';
  widgets: Widget[];
  nextStep?: { label: string; action: string; dataBinding?: string };
  crisisMode: boolean;
  metadata?: Record<string, any>;
  /** Resolved SMART-Artifact layout archetype for the target device size-class. */
  layoutArchetype?: 'phone' | 'tablet' | 'laptop' | 'desktop';
}

export interface GeneratorInput {
  passport: any; // normalized v4.1 subset
  viewData: any; // from /usertest/views/:role
  signals?: any; // from SSE stream
  role: 'coordinator' | 'researcher' | 'participant' | 'grant-reviewer';
  spoons: number; // 0–5
  /** Target device size-class (CWP-2026-071). */
  formFactor?: SizeClass;
}

export interface GenerationIntent {
  /** Natural language description of what the user wants to see */
  prompt: string;
  /** Current spoon level (0–5) */
  spoons: number;
  /** Optional role to filter relevant widgets */
  role?: GeneratorInput['role'];
  /** Optional hard constraints that override LLM output */
  constraints?: Partial<InterfaceDescription>;
  /** Target device size-class (CWP-2026-071). */
  formFactor?: SizeClass;
}

export type SpoonRules = {
  layout: InterfaceDescription['layout'];
  density: InterfaceDescription['density'];
  navigation: InterfaceDescription['navigation'];
  interactions: InterfaceDescription['interactions'];
  feedback: InterfaceDescription['feedback'];
  showNextStep: boolean;
  nextStepLabel: string;
  nextStepAction: string;
};

/** Map a size-class to a concrete layout archetype (CWP-2026-071). */
export function getLayoutArchetype(formFactor?: SizeClass): InterfaceDescription['layoutArchetype'] {
  switch (formFactor) {
    case 'compact': return 'phone';
    case 'regular': return 'tablet';
    case 'medium': return 'laptop';
    case 'expanded': return 'desktop';
    default: return 'tablet';
  }
}
