/**
 * @file P31 Component Definitions
 * Source of truth for all P31 design system components.
 *
 * These definitions drive:
 *   - Multi-framework generation (React, Astro, HTML, Web Components)
 *   - MCP server tooling
 *   - Design system documentation
 *   - AI agent guidance
 */

export interface ComponentDef {
  description: string;
  css_class: string;
  category: ComponentCategory;
  tokens: string[];
  aiGuidance: {
    useWhen: string[];
    avoidWhen: string[];
    examples: string[];
  };
  props?: Record<string, { type: string; required?: boolean; default?: any; description: string; min?: number; max?: number }>;
  slots?: string[];
  variants?: string[];
  accessibility?: string[];
}

export const COMPONENT_CATEGORIES = [
  'surface',
  'navigation',
  'action',
  'feedback',
  'accessibility',
  'ambient',
] as const;

export type ComponentCategory = (typeof COMPONENT_CATEGORIES)[number];

export const COMPONENT_DEFS: Record<string, ComponentDef> = {
  GlassPanel: {
    description: 'Elevated glassmorphic surface with backdrop blur. Use for modals, drawers, and elevated content areas.',
    css_class: 'glass-panel',
    category: 'surface',
    tokens: ['glass.bg', 'glass.blur', 'glass.border', 'glass.radius', 'glass.shadow'],
    aiGuidance: {
      useWhen: ['Elevated content above other UI', 'Modal/dialog backgrounds', 'Dropdown menus'],
      avoidWhen: ['Inline content within a flow', 'Background surfaces'],
      examples: ['<div class="glass-panel">...</div>', '<GlassPanel padding="lg">...</GlassPanel>'],
    },
    props: {
      children: { type: 'ReactNode', description: 'Content to render inside the panel' },
      padding: { type: '"sm" | "md" | "lg"', default: 'md', description: 'Padding size' },
      className: { type: 'string', description: 'Additional CSS classes' },
    },
    slots: ['default'],
    variants: ['default', 'hover'],
    accessibility: ['Uses semantic glass tokens for contrast', 'Focus styles inherit from global :focus-visible'],
  },

  GlassCard: {
    description: 'Padded glassmorphic card for content grouping. Use for feature cards, paper listings, and content tiles.',
    css_class: 'glass-card',
    category: 'surface',
    tokens: ['glass.bg', 'glass.blur', 'glass.border', 'glass.radius', 'spacing.lg'],
    aiGuidance: {
      useWhen: ['Content grouping in grids', 'Feature cards', 'Paper/research listings', 'Dashboard tiles'],
      avoidWhen: ['Navigation elements', 'Form inputs', 'Full-width backgrounds'],
      examples: ['<div class="glass-card">...</div>', '<GlassCard strong>...</GlassCard>'],
    },
    props: {
      children: { type: 'ReactNode', description: 'Card content' },
      strong: { type: 'boolean', default: false, description: 'Use stronger glass opacity' },
      className: { type: 'string', description: 'Additional CSS classes' },
    },
    slots: ['default'],
    variants: ['default', 'strong'],
    accessibility: ['Minimum padding ensures touch target compliance'],
  },

  Topbar: {
    description: 'Fixed glass navigation header. Use for site-wide navigation and brand identity.',
    css_class: 'topbar',
    category: 'navigation',
    tokens: ['topbar.height', 'glass.bg', 'glass.blur', 'glass.border', 'spacing.sm', 'radius.candy'],
    aiGuidance: {
      useWhen: ['Site-wide navigation', 'Brand header', 'Persistent navigation context'],
      avoidWhen: ['Inline headers within content', 'Modal headers'],
      examples: ['<header class="topbar glass-navbar">...</header>'],
    },
    props: {
      brand: { type: 'string', description: 'Brand name/text' },
      left: { type: 'ReactNode', description: 'Left section content (brand, logo)' },
      center: { type: 'ReactNode', description: 'Center section content (nav links)' },
      right: { type: 'ReactNode', description: 'Right section content (actions, spoon dial)' },
    },
    slots: ['left', 'center', 'right'],
    variants: ['default', 'glass-navbar'],
    accessibility: ['Fixed position requires z-index management', 'Skip links recommended below topbar'],
  },

  BottomNav: {
    description: 'Fixed bottom navigation bar for mobile-first apps. Use for primary app navigation.',
    css_class: 'bottom-nav',
    category: 'navigation',
    tokens: ['topbar.height', 'glass.bg', 'glass.blur', 'glass.border', 'spacing.sm'],
    aiGuidance: {
      useWhen: ['Mobile app navigation', 'Primary navigation on small screens', 'Tab-based navigation'],
      avoidWhen: ['Desktop-only navigation', 'Secondary navigation', 'More than 5 items'],
      examples: ['<nav class="bottom-nav">...</nav>', '<BottomNav items={navItems} />'],
    },
    props: {
      items: { type: 'NavItem[]', description: 'Navigation items with icon, label, and href' },
      activeIndex: { type: 'number', description: 'Currently active item index' },
    },
    slots: ['default'],
    variants: ['default', 'mobile', 'tablet'],
    accessibility: ['Minimum 48px touch targets', 'Active state clearly indicated', 'aria-selected on active item'],
  },

  SpoonDial: {
    description: 'Cognitive load selector (0-5 spoons). Use for neurodivergent-first accessibility control.',
    css_class: 'spoon-dial',
    category: 'accessibility',
    tokens: ['radius.full', 'glass.bg', 'glass.border', 'accent', 'text.tertiary'],
    aiGuidance: {
      useWhen: ['Accessibility controls', 'Cognitive load adjustment', 'Neurodivergent-first UX'],
      avoidWhen: ['Primary navigation', 'Form inputs', 'Settings pages without context'],
      examples: ['<div class="spoon-dial">...</div>', '<SpoonDial level={3} onChange={setSpoons} />'],
    },
    props: {
      level: { type: 'number', min: 0, max: 5, description: 'Current spoon level (0-5)' },
      onChange: { type: '(level: number) => void', description: 'Callback when level changes' },
    },
    slots: ['default'],
    variants: ['default', 'crisis'],
    accessibility: ['Role: radiogroup', 'aria-checked on each button', 'Labels for each level'],
  },

  Button: {
    description: 'Primary action button. Use for CTAs, form submissions, and key actions.',
    css_class: 'btn',
    category: 'action',
    tokens: ['accent', 'radius.md', 'spacing.sm', 'spacing.lg', 'font.weight'],
    aiGuidance: {
      useWhen: ['Primary CTAs', 'Form submissions', 'Key actions requiring emphasis'],
      avoidWhen: ['Secondary actions', 'Destructive actions without confirmation', 'Inline links'],
      examples: ['<button class="btn btn-primary">...</button>', '<Button variant="primary">...</Button>'],
    },
    props: {
      children: { type: 'ReactNode', description: 'Button content' },
      variant: { type: '"primary" | "secondary" | "ghost"', default: 'primary', description: 'Visual variant' },
      disabled: { type: 'boolean', default: false, description: 'Disabled state' },
      onClick: { type: '() => void', description: 'Click handler' },
    },
    slots: ['default'],
    variants: ['primary', 'secondary', 'ghost'],
    accessibility: ['Minimum 48px height', 'Disabled state clearly indicated', 'Focus ring visible'],
  },

  StatusBadge: {
    description: 'Status indicator badge. Use for system status, health indicators, and state labels.',
    css_class: 'badge',
    category: 'feedback',
    tokens: ['radius.full', 'scale.xs', 'accent.green', 'accent.red', 'accent.gold'],
    aiGuidance: {
      useWhen: ['System health indicators', 'Feature flags', 'Beta/alpha labels', 'Connection status'],
      avoidWhen: ['Primary content', 'Long text', 'Interactive elements'],
      examples: ['<span class="badge badge-success">Live</span>', '<StatusBadge status="online" />'],
    },
    props: {
      status: { type: '"online" | "offline" | "busy" | "away"', description: 'Status type' },
      label: { type: 'string', description: 'Badge text' },
    },
    slots: ['default'],
    variants: ['success', 'warning', 'error', 'info'],
    accessibility: ['Color + icon for colorblind users', 'Screen reader text included'],
  },

  MetricBadge: {
    description: 'Compact metric display with icon. Use for dashboard KPIs and telemetry.',
    css_class: 'metric-badge',
    category: 'feedback',
    tokens: ['glass.bg', 'glass.border', 'radius.sm', 'scale.xs', 'text.secondary'],
    aiGuidance: {
      useWhen: ['Dashboard KPIs', 'Telemetry displays', 'Compact metrics in navbars'],
      avoidWhen: ['Primary content', 'Long values', 'Interactive controls'],
      examples: ['<div class="metric-badge"><span class="status-dot"></span> Online</div>'],
    },
    props: {
      icon: { type: 'ReactNode', description: 'Icon or indicator' },
      value: { type: 'string | number', description: 'Metric value' },
      label: { type: 'string', description: 'Metric label' },
      clickable: { type: 'boolean', default: false, description: 'Enable hover state' },
    },
    slots: ['default'],
    variants: ['default', 'clickable'],
    accessibility: ['Icon has aria-hidden or accessible name', 'Value is screen-reader accessible'],
  },

  Starfield: {
    description: 'Animated starfield background. Use for ambient backgrounds in shell and marketing.',
    css_class: 'starfield-bg',
    category: 'ambient',
    tokens: ['z.starfield', 'starfield.hearth', 'starfield.teal', 'starfield.remembrance'],
    aiGuidance: {
      useWhen: ['Page backgrounds', 'Ambient effects', 'Shell backgrounds'],
      avoidWhen: ['Content areas', 'Overlays on top of text', 'Crisis mode (spoons=0)'],
      examples: ['<div class="starfield-bg" aria-hidden="true"></div>', '<Starfield spoons={3} />'],
    },
    props: {
      spoons: { type: 'number', description: 'Current spoon level for density/speed' },
      warmStars: { type: 'boolean', description: 'Use warm color palette' },
      reduceMotion: { type: 'boolean', description: 'Disable animations' },
    },
    slots: ['default'],
    variants: ['default', 'warm', 'reduced-motion'],
    accessibility: ['aria-hidden="true"', 'Respects prefers-reduced-motion', 'Disabled at spoons=0'],
  },

  CrisisOverlay: {
    description: 'Full-screen crisis mode overlay. Shown when spoons=0. Only exit control visible.',
    css_class: 'crisis-overlay',
    category: 'accessibility',
    tokens: ['bg', 'text', 'accent', 'z.crisis'],
    aiGuidance: {
      useWhen: ['Cognitive overload protection', 'Spoons=0 state', 'Emergency break glass'],
      avoidWhen: ['Normal operation', 'Informational overlays', 'Non-critical warnings'],
      examples: ['<div class="crisis-overlay" data-spoons="0">...</div>', '<CrisisOverlay onReady={exitCrisis} />'],
    },
    props: {
      onReady: { type: '() => void', description: 'Callback when user dismisses overlay' },
      message: { type: 'string', description: 'Custom crisis message' },
    },
    slots: ['default'],
    variants: ['default'],
    accessibility: ['Full screen focus trap', 'Escape key exits', 'High contrast text'],
  },
};

export function getComponentDef(name: string): ComponentDef | undefined {
  return COMPONENT_DEFS[name];
}

export function listComponents(): string[] {
  return Object.keys(COMPONENT_DEFS);
}

export function listComponentsByCategory(category: ComponentCategory): string[] {
  return Object.entries(COMPONENT_DEFS)
    .filter(([_, def]) => def.category === category)
    .map(([name]) => name);
}
