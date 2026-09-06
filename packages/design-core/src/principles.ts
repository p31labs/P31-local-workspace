/**
 * @file P31 UI/UX Design Principles
 * These principles govern all component generation, review, and conversion.
 */

export interface Principle {
  id: string;
  category: string;
  title: string;
  description: string;
  antiPattern: string;
  example: string;
}

export const PRINCIPLES: Principle[] = [
  {
    id: 'P1',
    category: 'tokens',
    title: 'Tokens Are the Single Source of Truth',
    description: 'All visual values must originate from @p31/design-core tokens. No hardcoded hex, spacing, or font values in component code.',
    antiPattern: 'Hardcoding #00F0FF instead of var(--p31-accent)',
    example: 'color: var(--p31-accent); /* not color: #00F0FF */',
  },
  {
    id: 'P2',
    category: 'css',
    title: 'CSS-First, Framework-Agnostic Styling',
    description: 'Visual styling lives in CSS classes, not framework-specific code. React and Astro components import the same CSS.',
    antiPattern: 'Duplicating glass styles in both React inline styles and Astro CSS',
    example: '.glass-panel { background: var(--p31-glass-bg); backdrop-filter: blur(12px); }',
  },
  {
    id: 'P3',
    category: 'accessibility',
    title: 'Spoon-Aware by Default',
    description: 'Every animation, transition, and visual effect must respect data-spoons. At spoons=0, all motion and blur is disabled.',
    antiPattern: 'Animations that run regardless of cognitive load setting',
    example: 'body[data-spoons="0"] * { animation: none !important; backdrop-filter: none !important; }',
  },
  {
    id: 'P4',
    category: 'accessibility',
    title: 'Focus Visibility is Non-Negotiable',
    description: 'All interactive elements must have visible focus indicators. Use :focus-visible, not :focus.',
    antiPattern: 'Removing focus outlines with outline: none without replacement',
    example: ':focus-visible { outline: 2px solid var(--p31-accent); outline-offset: 2px; }',
  },
  {
    id: 'P5',
    category: 'semantics',
    title: 'Semantic Tokens Over Primitive Tokens',
    description: 'Use semantic aliases (--p31-status-online, --p31-text-secondary) instead of raw primitives in component code.',
    antiPattern: 'Using --p31-accent-green for success status instead of --p31-status-online',
    example: 'color: var(--p31-status-online); /* not color: var(--p31-accent-green) */',
  },
  {
    id: 'P6',
    category: 'performance',
    title: 'Zero-JS by Default',
    description: 'Marketing pages render as static HTML. JavaScript hydrates only when interactive behavior is required.',
    antiPattern: 'client:load on every component regardless of interactivity',
    example: '<TerminalDemo client:visible /> <!-- hydrates only when scrolled into view -->',
  },
  {
    id: 'P7',
    category: 'motion',
    title: 'Reduced Motion is Mandatory',
    description: 'Respect prefers-reduced-motion and data-spoons. All animations must be pauseable or skippable.',
    antiPattern: 'Infinite CSS animations without prefers-reduced-motion fallback',
    example: '@media (prefers-reduced-motion: reduce) { * { animation-duration: 0.01ms !important; } }',
  },
  {
    id: 'P8',
    category: 'glass',
    title: 'Glass Tiers, Not Ad-Hoc Opacity',
    description: 'Use the defined glass tiers (subtle, standard, strong) instead of arbitrary opacity values.',
    antiPattern: 'background: rgba(255,255,255,0.13) instead of var(--p31-glass-bg-strong)',
    example: 'background: var(--p31-glass-bg-strong); /* oklch(100% 0.01 75 / 0.22) */',
  },
  {
    id: 'P9',
    category: 'typography',
    title: 'One Font per Role',
    description: 'Use Plus Jakarta Sans for body, JetBrains Mono for code/labels. Never mix fonts within a component.',
    antiPattern: 'Using 3 different font families in a single card',
    example: 'font-family: var(--p31-font-mono); /* for labels */',
  },
  {
    id: 'P10',
    category: 'layout',
    title: 'Recipe Classes for Layout',
    description: 'Use framework-agnostic recipe classes (.topbar, .viewport, .spoon-dial) instead of rebuilding layout in each framework.',
    antiPattern: 'Building a custom topbar in Astro that looks different from the React topbar',
    example: '<header class="topbar glass-navbar"> <!-- same CSS in React and Astro -->',
  },
];

export function getPrinciples(): Principle[] {
  return PRINCIPLES;
}

export function getReviewRules() {
  return {
    name: 'P31 Design System Review Rules',
    version: '2.1.0',
    rules: [
      {
        id: 'R1',
        rule: 'No hardcoded hex colors',
        check: 'grep -Er "#[0-9a-f]{6}" src --include="*.tsx" --include="*.css" | grep -v comment',
        severity: 'error',
      },
      {
        id: 'R2',
        rule: 'No hardcoded spacing values',
        check: 'grep -Er "(padding|margin|gap):\\s*[0-9]+px" src --include="*.tsx" --include="*.css"',
        severity: 'warn',
      },
      {
        id: 'R3',
        rule: 'No hardcoded font families',
        check: 'grep -Er "font-family:\\s*[^var]" src --include="*.tsx" --include="*.css"',
        severity: 'warn',
      },
      {
        id: 'R4',
        rule: 'All interactive elements have focus-visible',
        check: 'grep -Er ":focus" src --include="*.css" | grep -v "focus-visible"',
        severity: 'error',
      },
      {
        id: 'R5',
        rule: 'data-spoons attribute present on html element',
        check: "grep -Er '<html[^>]*data-spoons' src --include='*.astro' --include='*.tsx'",
        severity: 'error',
      },
      {
        id: 'R6',
        rule: 'prefers-reduced-motion respected',
        check: 'grep -Er "prefers-reduced-motion" src --include="*.css"',
        severity: 'warn',
      },
      {
        id: 'R7',
        rule: 'Semantic tokens used for status',
        check: 'grep -Er "color:\\s*var\\(--p31-accent-(green|red|gold)\\)" src --include="*.tsx" --include="*.css" | grep -v "status"',
        severity: 'warn',
      },
      {
        id: 'R8',
        rule: 'Glass components use recipe classes',
        check: 'grep -Er "glass-(panel|card|navbar)" src --include="*.astro" --include="*.tsx"',
        severity: 'info',
      },
    ],
  };
}
