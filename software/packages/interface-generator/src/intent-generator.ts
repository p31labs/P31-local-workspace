import type { GenerationIntent, InterfaceDescription, Widget, WidgetType } from './types';
import { spoonGuide } from './rules/spoon-guide';

/**
 * Intent-to-InterfaceDescription generator.
 *
 * Maps natural language prompts to declarative UI layouts deterministically.
 * This is the safe, predictable core; LLM enhancement is a layer on top
 * (see generateInterfaceFromIntentLLM for the agentic path).
 *
 * Safety invariants (non-negotiable):
 * - Crisis mode always overrides (spoons === 0 → crisisMode: true)
 * - Motion scaling always respected (via spoonGuide)
 * - Required widgets always present (stat-card for primary metric)
 */

interface IntentPattern {
  keywords: string[];
  widgets: Array<{ type: WidgetType; title: string; dataBinding: string | null; size?: Widget['size'] }>;
  layout?: InterfaceDescription['layout'];
  density?: InterfaceDescription['density'];
}

const INTENT_PATTERNS: IntentPattern[] = [
  {
    keywords: ['love', 'ledger', 'balance', 'care'],
    widgets: [
      { type: 'stat-card', title: 'LOVE Balance', dataBinding: 'love_balance', size: 'large' },
      { type: 'metric-grid', title: 'Care Score', dataBinding: 'care_metrics' },
      { type: 'transaction-feed', title: 'Recent Activity', dataBinding: 'love_transactions' },
    ],
  },
  {
    keywords: ['deadline', 'deliverable', 'milestone', 'due'],
    widgets: [
      { type: 'deadline-list', title: 'Upcoming Deadlines', dataBinding: 'deadlines' },
      { type: 'stat-card', title: 'Days Remaining', dataBinding: 'days_remaining' },
    ],
    layout: 'single-column',
  },
  {
    keywords: ['participant', 'user', 'session', 'usage'],
    widgets: [
      { type: 'stat-card', title: 'Active Participants', dataBinding: 'participants_count' },
      { type: 'transaction-feed', title: 'Recent Sessions', dataBinding: 'sessions' },
      { type: 'metric-grid', title: 'Usage Metrics', dataBinding: 'usage_metrics' },
    ],
    layout: 'grid',
    density: 'detailed',
  },
  {
    keywords: ['compliance', 'wcag', 'accessibility', 'audit'],
    widgets: [
      { type: 'stat-card', title: 'WCAG Pass Rate', dataBinding: 'wcag_pass_rate' },
      { type: 'alert-list', title: 'Violations', dataBinding: 'violations' },
      { type: 'metric-grid', title: 'Compliance Score', dataBinding: 'compliance_metrics' },
    ],
    layout: 'two-column',
  },
  {
    keywords: ['payment', 'queue', 'pending', 'billing'],
    widgets: [
      { type: 'queue-panel', title: 'Pending Payments', dataBinding: 'payments_pending' },
      { type: 'transaction-feed', title: 'Payment History', dataBinding: 'payment_history' },
    ],
  },
  {
    keywords: ['brain', 'dump', 'thought', 'note', 'capture'],
    widgets: [
      { type: 'text-block', title: 'Quick Capture', dataBinding: null },
      { type: 'action-button', title: 'Save Thought', dataBinding: 'brain_dump_action' },
    ],
    layout: 'focus-mode',
    density: 'minimal',
  },
  {
    keywords: ['graph', 'network', 'connection', 'entangle'],
    widgets: [
      { type: 'entanglement-graph', title: 'Connection Map', dataBinding: 'entanglements' },
      { type: 'node-grid', title: 'Connected Nodes', dataBinding: 'nodes' },
    ],
    layout: 'grid',
    density: 'exhaustive',
  },
  {
    keywords: ['crisis', 'emergency', 'help', 'safe'],
    widgets: [
      { type: 'action-button', title: 'I Need Help', dataBinding: 'crisis_action' },
      { type: 'text-block', title: 'You are safe. Take a breath.', dataBinding: null },
    ],
    layout: 'focus-mode',
    density: 'minimal',
  },
];

/**
 * Deterministic intent-to-interface generator.
 * Parses the prompt for keyword matches, selects widgets, applies safety constraints.
 */
export function generateInterfaceFromIntent(intent: GenerationIntent): InterfaceDescription {
  const { prompt, spoons, role, constraints } = intent;
  const rules = spoonGuide(spoons);

  // Crisis mode: override everything
  if (spoons === 0) {
    return {
      layout: 'focus-mode',
      density: 'minimal',
      navigation: 'hidden',
      interactions: 'guided',
      feedback: 'subtle',
      widgets: [
        { type: 'action-button', id: 'crisis-exit', title: "I'm Ready", dataBinding: null },
      ],
      crisisMode: true,
      ...constraints,
    };
  }

  const lowerPrompt = prompt.toLowerCase();

  // Find matching intent patterns
  const matchedPatterns = INTENT_PATTERNS.filter(pattern =>
    pattern.keywords.some(kw => lowerPrompt.includes(kw))
  );

  // Build widget list from matched patterns
  let widgets: Widget[] = [];
  if (matchedPatterns.length > 0) {
    for (const pattern of matchedPatterns) {
      for (const w of pattern.widgets) {
        widgets.push({
          type: w.type,
          id: `intent-${w.dataBinding || w.type}`,
          title: w.title,
          dataBinding: w.dataBinding,
          size: w.size,
        });
      }
    }
  } else {
    // No keyword match — use role-based defaults from the existing generator
    widgets = [
      { type: 'stat-card', id: 'intent-primary', title: 'Overview', dataBinding: 'primary_metric' },
      { type: 'text-block', id: 'intent-context', title: 'Context', dataBinding: 'context_text' },
    ];
  }

  // Apply spoon-level truncation (low spoons = fewer widgets)
  if (spoons <= 2) {
    widgets = widgets.slice(0, 3);
  }

  // Ensure at least one stat-card is present (required widget invariant)
  const hasStatCard = widgets.some(w => w.type === 'stat-card');
  if (!hasStatCard) {
    widgets.unshift({
      type: 'stat-card',
      id: 'intent-fallback-stat',
      title: 'Primary Metric',
      dataBinding: 'primary_metric',
    });
  }

  // Apply layout override from matched patterns (or use spoon default)
  const layoutOverride = matchedPatterns.find(p => p.layout)?.layout;
  const densityOverride = matchedPatterns.find(p => p.density)?.density;

  return {
    layout: constraints?.layout ?? layoutOverride ?? rules.layout,
    density: constraints?.density ?? densityOverride ?? rules.density,
    navigation: constraints?.navigation ?? rules.navigation,
    interactions: constraints?.interactions ?? rules.interactions,
    feedback: constraints?.feedback ?? rules.feedback,
    widgets,
    crisisMode: false,
    ...constraints,
  };
}
