/**
 * @file React/TSX Adapter — YAML → React component generator.
 * Generates .tsx, .test.tsx, and .stories.tsx files.
 *
 * Adapter interface:
 *   - generate(components, tokens, options) → GeneratedFile[]
 *   - write(components, tokens, options) → void
 */

import { readFileSync, writeFileSync } from 'fs';
import { writeFile } from 'fs/promises';
import { resolve } from 'path';
import type { ComponentDef, ComponentsFile, TokensFile, GeneratedFile, GeneratorOptions } from '../shared';
import {
  loadComponents,
  loadTokens,
  parseYamlSimple,
  ensureDir,
  COMPONENTS_YAML,
} from '../shared';
import { shouldRegenerate, writeCachedHash } from '../cache';

const OUTPUT_DIR = resolve(process.cwd(), '..', '..', 'packages', 'design-core', 'src', 'generated');

const COMPONENT_TEMPLATES: Record<string, (name: string, def: ComponentDef) => string> = {
  GlassCard: (name, def) => `/**
 * @file ${name} — Shared glassmorphic card (all 4 apps).
 * Uses design-core glass tokens. 'strong' variant for darker, more opaque glass.
 */

import type { ReactNode } from 'react';

export interface ${name}Props {
  children: ReactNode;
  className?: string;
  strong?: boolean;
  style?: React.CSSProperties;
}

export function ${name}({ children, className, strong, style }: ${name}Props) {
  const cls = \`rounded-2xl border border-white/[0.06] backdrop-blur-xl \${strong ? 'bg-void-raised/80 shadow-[0_8px_32px_rgba(0,0,0,0.4)]' : 'bg-void-raised/60 shadow-[0_4px_16px_rgba(0,0,0,0.3)]'} \${className || ''}\`;
  return <div className={cls} style={style}>{children}</div>;
}

export default ${name};
`,

  GlassPanel: (name, def) => `/**
 * @file ${name} — Glassmorphic elevated surface with backdrop blur.
 * Auto-generated from components.yml.
 */

import type { ReactNode } from 'react';

export interface ${name}Props {
  children: ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  style?: React.CSSProperties;
}

export function ${name}({ children, className, padding = 'md', style }: ${name}Props) {
  const paddingClasses = { sm: 'p-4', md: 'p-6', lg: 'p-8' };
  const cls = \`\${paddingClasses[padding]} rounded-2xl border border-white/[0.06] backdrop-blur-xl bg-void-raised/60 shadow-[0_4px_16px_rgba(0,0,0,0.3)] \${className || ''}\`;
  return <div className={cls} style={style}>{children}</div>;
}

export default ${name};
`,

  GlassStrong: (name, def) => `/**
 * @file ${name} — High-opacity glass surface with strong blur.
 * Auto-generated from components.yml.
 */

import type { ReactNode } from 'react';

export interface ${name}Props {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function ${name}({ children, className, style }: ${name}Props) {
  const cls = \`rounded-2xl border border-white/[0.08] backdrop-blur-2xl bg-void-raised/80 shadow-[0_8px_32px_rgba(0,0,0,0.4)] \${className || ''}\`;
  return <div className={cls} style={style}>{children}</div>;
}

export default ${name};
`,

  GlassSubtle: (name, def) => `/**
 * @file ${name} — Low-opacity glass surface with subtle blur.
 * Auto-generated from components.yml.
 */

import type { ReactNode } from 'react';

export interface ${name}Props {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function ${name}({ children, className, style }: ${name}Props) {
  const cls = \`rounded-2xl border border-white/[0.06] backdrop-blur-xl bg-void-raised/60 shadow-[0_4px_16px_rgba(0,0,0,0.3)] \${className || ''}\`;
  return <div className={cls} style={style}>{children}</div>;
}

export default ${name};
`,

  Button: (name, def) => `/**
 * @file ${name} — Primary action button.
 * Auto-generated from components.yml.
 */

import type { ReactNode } from 'react';

export interface ${name}Props {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

export function ${name}({ children, variant = 'primary', disabled, onClick, type = 'button', className }: ${name}Props) {
  const variantCls = {
    primary: 'bg-accent text-void hover:bg-accent/90 shadow-[0_0_12px_rgba(0,240,255,0.4)] focus-visible:ring-accent',
    secondary: 'bg-void-raised/80 border border-white/10 text-text hover:border-white/20 focus-visible:ring-violet',
    ghost: 'bg-transparent text-text-secondary hover:text-text hover:bg-white/5 focus-visible:ring-white/20',
  };
  return (
    <button
      type={type}
      className={\`btn btn-\${variant} \${variantCls[variant]} \${disabled ? 'opacity-50 cursor-not-allowed' : ''} \${className || ''}\`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export default ${name};
`,

  SpoonMeter: (name, def) => `/**
 * @file ${name} — Cognitive load meter showing 0-5 spoons.
 * Auto-generated from components.yml.
 */

import type { ReactNode } from 'react';

export interface ${name}Props {
  spoons: number;
  onChange?: (level: number) => void;
  className?: string;
}

const SPOON_SVG = \`<svg viewBox="0 0 200 200" width="15" height="15" aria-hidden="true"><path d="M100 30 Q96 80 100 110 Q100 120 100 145" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round"/><ellipse cx="100" cy="145" rx="16" ry="26" fill="currentColor"/><circle cx="100" cy="30" r="6" fill="currentColor"/></svg>\`;

export function ${name}({ spoons, onChange, className }: ${name}Props) {
  return (
    <div className={\`flex items-center gap-1 \${className || ''}\`} role="img" aria-label={\`Spoon level \${spoons} of 5\`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={\`w-[18px] h-[18px] \${i < spoons ? 'text-accent' : 'text-white/20'}\`}
          dangerouslySetInnerHTML={{ __html: SPOON_SVG }}
        />
      ))}
    </div>
  );
}

export default ${name};
`,

  Topbar: (name, def) => `/**
 * @file ${name} — Fixed glass navigation header.
 * Auto-generated from components.yml.
 */

import type { ReactNode } from 'react';

export interface ${name}Props {
  brand?: ReactNode;
  left?: ReactNode;
  center?: ReactNode;
  right?: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function ${name}({ brand, left, center, right, className, style }: ${name}Props) {
  const cls = \`topbar glass-navbar \${className || ''}\`;
  return (
    <header className={cls} style={style}>
      <div className="topbar-left">{brand || left}</div>
      <div className="topbar-center">{center}</div>
      <div className="topbar-right">{right}</div>
    </header>
  );
}

export default ${name};
`,

  BottomNav: (name, def) => `/**
 * @file ${name} — Fixed bottom navigation bar for mobile-first apps.
 * Auto-generated from components.yml.
 */

import type { ReactNode } from 'react';

export interface NavItem {
  icon: ReactNode;
  label: string;
  href: string;
  active?: boolean;
}

export interface ${name}Props {
  items: NavItem[];
  activeIndex?: number;
  className?: string;
}

export function ${name}({ items, activeIndex = 0, className }: ${name}Props) {
  return (
    <nav className={\`bottom-nav \${className || ''}\`} role="navigation" aria-label="Main">
      {items.map((item, i) => (
        <a
          key={i}
          href={item.href}
          className={\`nav-item \${i === activeIndex ? 'active' : ''}\`}
          aria-current={i === activeIndex ? 'page' : undefined}
        >
          {item.icon}
          <span>{item.label}</span>
        </a>
      ))}
    </nav>
  );
}

export default ${name};
`,

  SpoonDial: (name, def) => `/**
 * @file ${name} — Cognitive load selector (0-5 spoons).
 * Auto-generated from components.yml.
 */

import type { ReactNode } from 'react';

export interface ${name}Props {
  level: number;
  onChange?: (level: number) => void;
  className?: string;
}

const SPOON_SVG = \`<svg viewBox="0 0 200 200" width="15" height="15" aria-hidden="true"><path d="M100 30 Q96 80 100 110 Q100 120 100 145" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round"/><ellipse cx="100" cy="145" rx="16" ry="26" fill="currentColor"/><circle cx="100" cy="30" r="6" fill="currentColor"/></svg>\`;

export function ${name}({ level, onChange, className }: ${name}Props) {
  return (
    <div className={\`spoon-dial \${className || ''}\`} role="radiogroup" aria-label="Cognitive load">
      {Array.from({ length: 6 }, (_, i) => (
        <button
          key={i}
          type="button"
          className={\`spoon-btn \${i === level ? 'active' : ''}\`}
          onClick={() => onChange?.(i)}
          role="radio"
          aria-checked={i === level}
          aria-label={\`Spoons = \${i}\`}
          title={\`Cognitive load level \${i}\`}
        >
          <span dangerouslySetInnerHTML={{ __html: SPOON_SVG }} />
        </button>
      ))}
    </div>
  );
}

export default ${name};
`,

  MetricBadge: (name, def) => `/**
 * @file ${name} — Compact metric display with icon.
 * Auto-generated from components.yml.
 */

import type { ReactNode } from 'react';

export interface ${name}Props {
  icon?: ReactNode;
  value: string | number;
  label?: string;
  clickable?: boolean;
  className?: string;
}

export function ${name}({ icon, value, label, clickable, className }: ${name}Props) {
  return (
    <div className={\`metric-badge \${clickable ? 'clickable' : ''} \${className || ''}\`}>
      {icon && <span className="status-dot">{icon}</span>}
      <span>{value}</span>
      {label && <span className="text-tertiary">{label}</span>}
    </div>
  );
}

export default ${name};
`,

  StatusBadge: (name, def) => `/**
 * @file ${name} — Status indicator badge.
 * Auto-generated from components.yml.
 */

import type { ReactNode } from 'react';

export type Status = 'online' | 'offline' | 'busy' | 'away';

export interface ${name}Props {
  status: Status;
  label?: string;
  className?: string;
}

const STATUS_CLASS: Record<Status, string> = {
  online: 'badge-success',
  offline: 'badge-error',
  busy: 'badge-warning',
  away: 'badge-info',
};

export function ${name}({ status, label, className }: ${name}Props) {
  return (
    <span className={\`badge \${STATUS_CLASS[status]} \${className || ''}\`}>
      <span className="status-dot" data-status={status} />
      {label || status}
    </span>
  );
}

export default ${name};
`,

  Starfield: (name, def) => `/**
 * @file ${name} — Animated starfield background.
 * Auto-generated from components.yml.
 */

import type { ReactNode } from 'react';

export interface ${name}Props {
  spoons?: number;
  warmStars?: boolean;
  reduceMotion?: boolean;
  className?: string;
}

export function ${name}({ spoons = 3, warmStars = false, reduceMotion = false, className }: ${name}Props) {
  if (reduceMotion || spoons <= 1) {
    return <div className={\`starfield-bg \${className || ''}\`} aria-hidden="true" />;
  }
  return (
    <div className={\`starfield-bg \${className || ''}\`} aria-hidden="true">
      <canvas />
    </div>
  );
}

export default ${name};
`,

  CrisisOverlay: (name, def) => `/**
 * @file ${name} — Full-screen crisis mode overlay.
 * Auto-generated from components.yml.
 */

import type { ReactNode } from 'react';

export interface ${name}Props {
  onReady?: () => void;
  message?: string;
  className?: string;
}

export function ${name}({ onReady, message = 'Rest. Breathe. The mesh holds.', className }: ${name}Props) {
  return (
    <div className={\`crisis-overlay \${className || ''}\`} data-spoons="0">
      <div className="flex flex-col items-center justify-center gap-6 p-10 min-h-screen">
        <p className="text-xl font-light text-center" style={{ color: 'var(--p31-text)' }}>
          {message}
        </p>
        <button
          type="button"
          onClick={onReady}
          className="btn btn-primary"
        >
          I'm Ready
        </button>
      </div>
    </div>
  );
}

export default ${name};
`,
};

function getTemplate(name: string, def: ComponentDef): string {
  const templateFn = COMPONENT_TEMPLATES[name];
  if (templateFn) {
    return templateFn(name, def);
  }

  // Generic template for components without specific templates
  return `/**
 * @file ${name} — ${def.description || 'Component'}
 * Auto-generated from components.yml.
 */

import type { ReactNode } from 'react';

export interface ${name}Props {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function ${name}({ children, className, style }: ${name}Props) {
  return <div className={className} style={style}>{children}</div>;
}

export default ${name};
`;
}

export function generateReact(options: GeneratorOptions = {}): GeneratedFile[] {
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
    const fileName = name.endsWith('.tsx') ? name : `${name}.tsx`;
    const filePath = resolve(OUTPUT_DIR, fileName);

    return {
      name,
      path: filePath,
      code,
    };
  });
}

export function writeReact(options: GeneratorOptions = {}): void {
  const componentsPath = options.componentsPath || COMPONENTS_YAML;
  const cacheResult = shouldRegenerate(componentsPath, options.force);

  if (cacheResult.hit) {
    console.log(`\n⚡ Cache hit — components.yml unchanged (hash: ${cacheResult.hash}). Skipping generation.`);
    console.log(`   Use --force to regenerate.`);
    return;
  }

  const generated = generateReact(options);
  ensureDir(OUTPUT_DIR);

  const write = (item: GeneratedFile) => {
    writeFileSync(item.path, item.code, 'utf-8');
    console.log(`  Generated: ${item.path}`);
  };

  if (options.parallel) {
    Promise.all(generated.map(item => writeFile(item.path, item.code, 'utf-8')))
      .then(() => {
        writeCachedHash(cacheResult.hash);
        console.log(`\n✅ Generated ${generated.length} files for ${options.component || 'all components'}`);
      })
      .catch((err) => {
        console.error('\n❌ Parallel generation failed:', err);
        generated.forEach(write);
        writeCachedHash(cacheResult.hash);
        console.log(`\n✅ Generated ${generated.length} files for ${options.component || 'all components'} (fallback sequential)`);
      });
  } else {
    generated.forEach(write);
    writeCachedHash(cacheResult.hash);
    console.log(`\n✅ Generated ${generated.length} files for ${options.component || 'all components'}`);
  }
}
