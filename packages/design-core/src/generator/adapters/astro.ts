/**
 * @file Astro Adapter — YAML → Astro component generator.
 * Generates .astro files with Tailwind class strings and frontmatter props.
 *
 * Output: packages/design-core/src/generated-astro/<Component>.astro
 */

import { writeFileSync, readFileSync } from 'fs';
import { resolve } from 'path';
import type { ComponentDef, ComponentsFile, GeneratedFile, GeneratorOptions } from '../shared';
import {
  loadComponents,
  loadTokens,
  ensureDir,
  COMPONENTS_YAML,
} from '../shared';
import { shouldRegenerate, writeCachedHash } from '../cache';

const OUTPUT_DIR = resolve(process.cwd(), '..', '..', 'packages', 'design-core', 'src', 'generated-astro');

const COMPONENT_TEMPLATES: Record<string, (name: string, def: ComponentDef) => string> = {
  GlassCard: (name, def) => `---
// @file ${name} — Glassmorphic card variant for Astro.
// Auto-generated from components.yml.

interface Props {
  children: AstroSlotChildren;
  strong?: boolean;
  class?: string;
}

const { children, strong = false, class: className = '' } = Astro.props;
const baseCls = \`rounded-2xl border border-white/[0.06] backdrop-blur-xl \${strong ? 'bg-void-raised/80 shadow-[0_8px_32px_color-mix(in_oklch,var(--p31-void)_40%,transparent)]' : 'bg-void-raised/60 shadow-[0_4px_16px_color-mix(in_oklch,var(--p31-void)_30%,transparent)]'} \${className}\`;
---

<div class={baseCls}>
  <slot />
</div>
`,

  GlassPanel: (name, def) => `---
// @file ${name} — Elevated glass surface for Astro.
// Auto-generated from components.yml.

interface Props {
  children: AstroSlotChildren;
  padding?: 'sm' | 'md' | 'lg';
  class?: string;
}

const { children, padding = 'md', class: className = '' } = Astro.props;
const paddingClasses = { sm: 'p-4', md: 'p-6', lg: 'p-8' };
const baseCls = \`\${paddingClasses[padding]} rounded-2xl border border-white/[0.06] backdrop-blur-xl bg-void-raised/60 shadow-[0_4px_16px_color-mix(in_oklch,var(--p31-void)_30%,transparent)] \${className}\`;
---

<div class={baseCls}>
  <slot />
</div>
`,

  GlassStrong: (name, def) => `---
// @file ${name} — High-opacity glass surface for Astro.
// Auto-generated from components.yml.

interface Props {
  children: AstroSlotChildren;
  class?: string;
}

const { children, class: className = '' } = Astro.props;
const baseCls = \`rounded-2xl border border-white/[0.08] backdrop-blur-2xl bg-void-raised/80 shadow-[0_8px_32px_color-mix(in_oklch,var(--p31-void)_40%,transparent)] \${className}\`;
---

<div class={baseCls}>
  <slot />
</div>
`,

  GlassSubtle: (name, def) => `---
// @file ${name} — Low-opacity glass surface for Astro.
// Auto-generated from components.yml.

interface Props {
  children: AstroSlotChildren;
  class?: string;
}

const { children, class: className = '' } = Astro.props;
const baseCls = \`rounded-2xl border border-white/[0.06] backdrop-blur-xl bg-void-raised/60 shadow-[0_4px_16px_color-mix(in_oklch,var(--p31-void)_30%,transparent)] \${className}\`;
---

<div class={baseCls}>
  <slot />
</div>
`,

  Button: (name, def) => `---
// @file ${name} — Primary action button for Astro.
// Auto-generated from components.yml.

interface Props {
  children: AstroSlotChildren;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  class?: string;
}

const { children, variant = 'primary', disabled, class: className = '' } = Astro.props;
const variantCls = {
  primary: 'bg-accent text-void hover:bg-accent/90 shadow-[0_0_12px_color-mix(in_oklch,var(--p31-accent)_40%,transparent)] focus-visible:ring-accent',
  secondary: 'bg-void-raised/80 border border-white/10 text-text hover:border-white/20 focus-visible:ring-violet',
  ghost: 'bg-transparent text-text-secondary hover:text-text hover:bg-white/5 focus-visible:ring-white/20',
};
---

<button class={\`btn btn-\${variant} \${variantCls[variant]} \${disabled ? 'opacity-50 cursor-not-allowed' : ''} \${className}\`} disabled={disabled}>
  <slot />
</button>
`,

  SpoonMeter: (name, def) => `---
// @file ${name} — Cognitive load meter for Astro.
// Auto-generated from components.yml.

interface Props {
  spoons: number;
  onChange?: (level: number) => void;
  class?: string;
}

const { spoons, onChange, class: className = '' } = Astro.props;
---

<div class={\`flex items-center gap-1 \${className}\`} role="img" aria-label={\`Spoon level \${spoons} of 5\`}>
  {Array.from({ length: 5 }, (_, i) => (
    <span
      class={\`w-[18px] h-[18px] \${i < spoons ? 'text-accent' : 'text-white/20'}\`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 200 200" fill="currentColor">
        <path d="M100 30 Q96 80 100 110 Q100 120 100 145" stroke="currentColor" stroke-width="5" fill="none" stroke-linecap="round"/>
        <ellipse cx="100" cy="145" rx="16" ry="26" fill="currentColor"/>
        <circle cx="100" cy="30" r="6" fill="currentColor"/>
      </svg>
    </span>
  ))}
</div>
`,

  Topbar: (name, def) => `---
// @file ${name} — Fixed glass navigation header.
// Auto-generated from components.yml.

interface Props {
  brand?: AstroSlotChildren;
  left?: AstroSlotChildren;
  center?: AstroSlotChildren;
  right?: AstroSlotChildren;
  class?: string;
}

const { brand, left, center, right, class: className = '' } = Astro.props;
---

<header class={\`topbar glass-navbar \${className}\`}>
  <div class="topbar-left">{brand || left}</div>
  <div class="topbar-center">{center}</div>
  <div class="topbar-right">{right}</div>
</header>
`,

  BottomNav: (name, def) => `---
// @file ${name} — Fixed bottom navigation bar for mobile-first apps.
// Auto-generated from components.yml.

interface Props {
  items: { icon: AstroSlotChildren; label: string; href: string; active?: boolean }[];
  activeIndex?: number;
  class?: string;
}

const { items, activeIndex = 0, class: className = '' } = Astro.props;
---

<nav class={\`bottom-nav \${className}\`} role="navigation" aria-label="Main">
  {items.map((item, i) => (
    <a
      key={i}
      href={item.href}
      class={\`nav-item \${i === activeIndex ? 'active' : ''}\`}
      aria-current={i === activeIndex ? 'page' : undefined}
    >
      {item.icon}
      <span>{item.label}</span>
    </a>
  ))}
</nav>
`,

  SpoonDial: (name, def) => `---
// @file ${name} — Cognitive load selector (0-5 spoons).
// Auto-generated from components.yml.

interface Props {
  level: number;
  onChange?: (level: number) => void;
  class?: string;
}

const { level, onChange, class: className = '' } = Astro.props;
---

<div class={\`spoon-dial \${className}\`} role="radiogroup" aria-label="Cognitive load">
  {Array.from({ length: 6 }, (_, i) => (
    <button
      type="button"
      class={\`spoon-btn \${i === level ? 'active' : ''}\`}
      onClick={() => onChange?.(i)}
      role="radio"
      aria-checked={i === level}
      aria-label={\`Spoons = \${i}\`}
title={\`Cognitive load level \${i}\`}
      />
    ))}
  </div>
`,
  SectionStrip: (name, def) => `---
// @file ${name} — Desktop pill navigation strip.
// Auto-generated from components.yml. Router-agnostic.

interface Props {
  items: { id: string; label: string; active?: boolean }[];
  onSelect?: (id: string) => void;
  class?: string;
}

const { items, onSelect, class: className = '' } = Astro.props;
---

<nav class={\`section-strip \${className}\`.trim()} aria-label="Design system sections">
  {items.map((s) => (
    <button
      type="button"
      class={\`section-tab\${s.active ? ' is-active' : ''}\`}
      onClick={() => onSelect?.(s.id)}
      aria-current={s.active ? 'page' : undefined}
    >
      {s.label}
    </button>
  ))}
</nav>
`,
  CommandPalette: (name, def) => `---
// @file ${name} — Keyboard-friendly command palette.
// Auto-generated from components.yml. Controlled open state.

interface Props {
  items: { id: string; label: string; description?: string }[];
  placeholder?: string;
  open?: boolean;
  class?: string;
}

const { items, placeholder = 'Search…', open = false, class: className = '' } = Astro.props;
---

{open && (
  <div class={\`cmdk-overlay \${className}\`.trim()} role="presentation">
    <div class="cmdk-panel" role="dialog" aria-label="Command palette" aria-modal="true">
      <div class="cmdk-input-row">
        <input class="cmdk-input" placeholder={placeholder} aria-label={placeholder} />
        <kbd class="cmdk-kbd">esc</kbd>
      </div>
      <ul class="cmdk-list" role="listbox" aria-label="Results">
        {items.map((s) => (
          <li>
            <button class="cmdk-item" role="option" aria-selected="false">
              <span class="cmdk-label">{s.label}</span>
              {s.description && <span class="cmdk-path">{s.description}</span>}
            </button>
          </li>
        ))}
      </ul>
    </div>
  </div>
)}
`,
  Chameleon: (name, def) => `---
// @file ${name} — Adaptive theme controls (brand × world × age × sensory).
// Auto-generated from components.yml. Wraps the canonical React implementation.

interface Props {
  class?: string;
}

const { class: className = '' } = Astro.props;
---

<div class={\`chameleon \${className}\`.trim()}>
  <button class="chameleon-trigger" type="button" aria-haspopup="dialog" aria-expanded="false"
    aria-label="Adaptive theme controls" title="Chameleon — brand, world, and sensory controls">
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3a9 9 0 0 0-9 9h4a5 5 0 0 1 5 5v.4a3.6 3.6 0 0 1-3.6 3.6H12a9 9 0 1 0 0-18z" />
    </svg>
  </button>
</div>
`,
  PageHeader: (name, def) => `---
// @file ${name} — Inner-page hero: mono eyebrow, gradient title, lede.
// Auto-generated from components.yml.

interface Props {
  eyebrow: string;
  title: string;
  lede?: string;
  class?: string;
}

const { eyebrow, title, lede, class: className = '' } = Astro.props;
---

<header class={\`page-header-route \${className}\`.trim()}>
  <span class="hero-eyebrow">{eyebrow}</span>
  <h1>{title}</h1>
  {lede && <p class="page-lede">{lede}</p>}
</header>
`,
  };

function getTemplate(name: string, def: ComponentDef): string {
  const templateFn = COMPONENT_TEMPLATES[name];
  if (templateFn) {
    return templateFn(name, def);
  }

  // Generic template for components without specific templates
  return `---
// @file ${name} — ${def.description || 'Component'}
// Auto-generated from components.yml.

interface Props {
  children: AstroSlotChildren;
  class?: string;
}

const { children, class: className = '' } = Astro.props;
---

<div class={className}>
  <slot />
</div>
`;
}

export function generateAstro(options: GeneratorOptions = {}): GeneratedFile[] {
  const componentsPath = options.componentsPath || COMPONENTS_YAML;
  const componentsFile = loadComponents(componentsPath);
  const tokens = loadTokens(options.tokensPath);
  const componentName = options.component;

  const componentEntries: [string, ComponentDef][] = componentName
    ? (componentsFile.components[componentName]
        ? [[componentName, componentsFile.components[componentName]]]
        : [])
    : Object.entries(componentsFile.components) as [string, ComponentDef][];

  return componentEntries.map(([name, def]) => {
    const code = getTemplate(name, def);
    const fileName = name.endsWith('.astro') ? name : `${name}.astro`;
    const filePath = resolve(OUTPUT_DIR, fileName);

    return {
      name,
      path: filePath,
      code,
    };
  });
}

export function writeAstro(options: GeneratorOptions = {}): void {
  const componentsPath = options.componentsPath || COMPONENTS_YAML;
  const cacheResult = shouldRegenerate(componentsPath, options.force);

  if (cacheResult.hit) {
    console.log(`\n⚡ Cache hit — components.yml unchanged (hash: ${cacheResult.hash}). Skipping generation.`);
    console.log(`   Use --force to regenerate.`);
    return;
  }

  const generated = generateAstro(options);
  ensureDir(OUTPUT_DIR);

  for (const item of generated) {
    writeFileSync(item.path, item.code, 'utf-8');
    console.log(`  Generated: ${item.path}`);
  }

  console.log(`\n✅ Generated ${generated.length} Astro components for ${options.component || 'all components'}`);
}
