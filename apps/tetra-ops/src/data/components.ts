/**
 * @file components.ts — Static registry of all @p31ca/ui design components.
 */

export interface PropDef {
  type: 'string' | 'select' | 'boolean' | 'number';
  default: unknown;
  options?: string[];
  label?: string;
}

export interface ComponentEntry {
  id: string;
  name: string;
  description: string;
  category: 'chrome' | 'ui' | 'layout' | 'containers';
  package: string;
  installCommand: string;
  status: 'stable' | 'beta';
  version: string;
  maturity: 'alpha' | 'beta' | 'stable' | 'deprecated';
  usedBy: string[];
  props?: Record<string, PropDef>;
}

export const COMPONENTS: ComponentEntry[] = [
  { id: 'app-nav', name: 'AppNav', category: 'chrome', status: 'stable', version: '1.0.0', maturity: 'stable', usedBy: ['PHOS', 'WILLOW'], package: '@p31ca/ui/chrome', installCommand: "import { AppNav } from '@p31ca/ui/chrome';", description: 'Canonical header for SPAs (PHOS + WILLOW) — BrandMark, nav links, SpoonDial, companion trigger.' },
  { id: 'site-nav', name: 'SiteNav', category: 'chrome', status: 'stable', version: '1.0.0', maturity: 'stable', usedBy: ['phosphorus31', 'p31ca'], package: '@p31ca/ui/chrome', installCommand: "import { SiteNav } from '@p31ca/ui/chrome';", description: 'Canonical header for Astro sites (phosphorus31 + p31ca) — brand box, spoon pips, dyslexia toggle, BONDING button.' },
  { id: 'brand-mark', name: 'BrandMark', category: 'chrome', status: 'stable', version: '1.0.0', maturity: 'stable', usedBy: ['All apps'], package: '@p31ca/ui/chrome', installCommand: "import { BrandMark } from '@p31ca/ui/chrome';", description: 'P31 brand glyph — gradient icon + app name + tagline.', props: { showTagline: { type: 'boolean', default: true, label: 'Show tagline' } } },
  { id: 'spoon-dial', name: 'SpoonDial', category: 'chrome', status: 'stable', version: '1.0.0', maturity: 'stable', usedBy: ['All apps'], package: '@p31ca/ui/chrome', installCommand: "import { SpoonDial } from '@p31ca/ui/chrome';", description: 'Spoon-level selector — button mode (compact) or pips mode (6 dots + crisis toggle).', props: { mode: { type: 'select', default: 'pips', options: ['pips', 'buttons'], label: 'Display mode' }, compact: { type: 'boolean', default: false, label: 'Compact layout' } } },
  { id: 'sovereignty-strip', name: 'SovereigntyStrip', category: 'chrome', status: 'stable', version: '1.0.0', maturity: 'stable', usedBy: ['All apps'], package: '@p31ca/ui/chrome', installCommand: "import { SovereigntyStrip } from '@p31ca/ui/chrome';", description: 'Persistent identity strip at viewport bottom — shows passport display name, pronouns, and "sovereign" badge.' },
  { id: 'companion-panel', name: 'CompanionPanel', category: 'chrome', status: 'stable', version: '1.0.0', maturity: 'stable', usedBy: ['All apps'], package: '@p31ca/ui/chrome', installCommand: "import { CompanionPanel } from '@p31ca/ui/chrome';", description: 'Tabbed slide-over — Companion tab (breathing pacer, soundscape, Star Buddy, care partner) + Settings tab (spoons, dyslexia, color, name).', props: { defaultTab: { type: 'select', default: 'companion', options: ['companion', 'settings'], label: 'Default tab' } } },
  { id: 'footer', name: 'Footer', category: 'layout', status: 'stable', version: '1.0.0', maturity: 'stable', usedBy: ['phosphorus31'], package: '@p31ca/ui/chrome', installCommand: "import { Footer } from '@p31ca/ui/chrome';", description: 'Canonical institutional footer — P31 logo, products, organization links, copyright.' },
  { id: 'glass-card', name: 'GlassCard', category: 'ui', status: 'stable', version: '1.0.0', maturity: 'stable', usedBy: ['All apps'], package: '@p31ca/ui/chrome', installCommand: "import { GlassCard } from '@p31ca/ui/chrome';", description: 'Glassmorphic card — subtle or strong background, backdrop blur, accent border.', props: { variant: { type: 'select', default: 'subtle', options: ['subtle', 'strong'], label: 'Glass intensity' }, accentBorder: { type: 'boolean', default: false, label: 'Accent border' } } },
  { id: 'glow-button', name: 'GlowButton', category: 'ui', status: 'stable', version: '1.0.0', maturity: 'stable', usedBy: ['All apps'], package: '@p31ca/ui/chrome', installCommand: "import { GlowButton } from '@p31ca/ui/chrome';", description: 'Accent-glow button — 5 colors, 3 sizes, 3 variants. Min 44px touch target.', props: { color: { type: 'select', default: 'quantum-cyan', options: ['quantum-cyan', 'emerald', 'rose', 'violet', 'amber'], label: 'Accent color' }, size: { type: 'select', default: 'md', options: ['sm', 'md', 'lg'], label: 'Size' }, variant: { type: 'select', default: 'solid', options: ['solid', 'outline', 'ghost'], label: 'Variant' } } },
  { id: 'skip-link', name: 'SkipLink', category: 'chrome', status: 'stable', version: '1.0.0', maturity: 'stable', usedBy: ['All apps'], package: '@p31ca/ui/chrome', installCommand: "import { SkipLink } from '@p31ca/ui/chrome';", description: 'Skip-to-content link — sr-only until focused, then fixed top-left. WCAG 2.2 compliant.' },
  { id: 'starfield', name: 'Starfield', category: 'ui', status: 'stable', version: '1.0.0', maturity: 'stable', usedBy: ['All apps'], package: '@p31ca/design-core/starfield', installCommand: "import { mountStarfield } from '@p31ca/design-core/starfield';", description: 'GPU-accelerated ambient particle field — spoon-aware density, accent-tinted particles.', props: { density: { type: 'select', default: 'medium', options: ['low', 'medium', 'high'], label: 'Particle density' } } },
  { id: 'k4-hero', name: 'K4Hero', category: 'ui', status: 'stable', version: '1.0.0', maturity: 'beta', usedBy: ['bonding'], package: '@p31ca/ui/K4Hero', installCommand: "import { K4Hero } from '@p31ca/ui/K4Hero';", description: 'Animated K4 tetrahedron SVG — 3 outer nodes + 1 central node, dashed edges, orbital glow ellipses.', props: { animated: { type: 'boolean', default: true, label: 'Enable animation' } } },
  { id: 'spoon-orbit', name: 'SpoonOrbit', category: 'ui', status: 'stable', version: '1.0.0', maturity: 'stable', usedBy: ['All apps'], package: '@p31ca/ui/spoon-orbit', installCommand: "import { SpoonOrbit } from '@p31ca/ui/SpoonOrbit';", description: 'Canonical Spoon Orbit SVG — central breathing core + 5 orbiting accent nodes on SMIL animateMotion paths.', props: { size: { type: 'select', default: 'md', options: ['sm', 'md', 'lg'], label: 'Display size' } } },
  { id: 'crisis-overlay', name: 'CrisisOverlay', category: 'layout', status: 'stable', version: '1.0.0', maturity: 'stable', usedBy: ['All apps'], package: '@p31ca/design-core/crisis-overlay', installCommand: "import { registerP31CrisisOverlay } from '@p31ca/design-core/crisis-overlay';", description: 'Full-screen breathing circle overlay — activates at spoons=0.' },
  { id: 'cradle-stage', name: 'CradleStage', category: 'containers', status: 'stable', version: '1.0.0', maturity: 'beta', usedBy: ['All apps'], package: '@p31ca/ui', installCommand: "import { EphemeralProvider } from '@p31ca/ui';", description: 'Ambient depth-of-field container (CWP-2026-073). Wraps surfaces and assigns data-ui-active so non-focused panels ghost into the void. Enforces soft-ambient focus across the mesh via BroadcastChannel.' },
  { id: 'adaptive-layout', name: 'AdaptiveLayout', category: 'containers', status: 'stable', version: '1.0.0', maturity: 'stable', usedBy: ['All apps'], package: '@p31ca/ui', installCommand: "import { AdaptiveLayout } from '@p31ca/ui';", description: 'CSS-grid that follows --p31-columns (1/1/2/3 by size-class). Optional fill stretches columns to consume empty width. No JS re-render on resize.' },
];

export function searchComponents(q: string): ComponentEntry[] {
  return COMPONENTS.filter(c => c.name.toLowerCase().includes(q.toLowerCase()) || c.description.toLowerCase().includes(q.toLowerCase()));
}
