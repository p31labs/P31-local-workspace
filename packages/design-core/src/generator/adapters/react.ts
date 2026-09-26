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
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}

export function ${name}({ children, className, strong, style, onClick }: ${name}Props) {
  const cls = \`rounded-2xl border border-white/[0.06] backdrop-blur-xl \${strong ? 'bg-void-raised/80 shadow-[0_8px_32px_color-mix(in_oklch,var(--p31-void)_40%,transparent)]' : 'bg-void-raised/60 shadow-[0_4px_16px_color-mix(in_oklch,var(--p31-void)_30%,transparent)]'} \${className || ''}\`;
  return <div onClick={onClick} className={cls} style={style}>{children}</div>;
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
  const cls = \`\${paddingClasses[padding]} rounded-2xl border border-white/[0.06] backdrop-blur-xl bg-void-raised/60 shadow-[0_4px_16px_color-mix(in_oklch,var(--p31-void)_30%,transparent)] \${className || ''}\`;
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
  const cls = \`rounded-2xl border border-white/[0.08] backdrop-blur-2xl bg-void-raised/80 shadow-[0_8px_32px_color-mix(in_oklch,var(--p31-void)_40%,transparent)] \${className || ''}\`;
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
  const cls = \`rounded-2xl border border-white/[0.06] backdrop-blur-xl bg-void-raised/60 shadow-[0_4px_16px_color-mix(in_oklch,var(--p31-void)_30%,transparent)] \${className || ''}\`;
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
    primary: 'bg-accent text-void hover:bg-accent/90 shadow-[0_0_12px_color-mix(in_oklch,var(--p31-accent)_40%,transparent)] focus-visible:ring-accent',
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

  SectionStrip: (name, def) => `/**
 * @file ${name} — Desktop pill navigation strip.
 * Auto-generated from components.yml. Router-agnostic: shell owns active state + navigation.
 */

import type { ReactNode, CSSProperties } from 'react';

export interface SectionItem {
  id: string;
  label: string;
  icon?: ReactNode;
  active?: boolean;
}

export interface ${name}Props {
  items: SectionItem[];
  onSelect?: (id: string) => void;
  className?: string;
  style?: CSSProperties;
}

export function ${name}({ items, onSelect, className = '', style }: ${name}Props) {
  return (
    <nav className={\`section-strip \${className}\`.trim()} aria-label="Design system sections" style={style}>
      {items.map((s) => (
        <button
          key={s.id}
          type="button"
          className={\`section-tab\${s.active ? ' is-active' : ''}\`}
          onClick={() => onSelect?.(s.id)}
          aria-current={s.active ? 'page' : undefined}
        >
          {s.icon}
          {s.label}
        </button>
      ))}
    </nav>
  );
}

export default ${name};
`,

  CommandPalette: (name, def) => `/**
 * @file ${name} — Keyboard-friendly command palette.
 * Auto-generated from components.yml. Controlled open state; shell owns item actions.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon?: ReactNode;
  keywords?: string;
}

export interface ${name}Props {
  open: boolean;
  onClose: () => void;
  items: CommandItem[];
  onSelect: (id: string) => void;
  placeholder?: string;
  leadingIcon?: ReactNode;
}

export function ${name}({ open, onClose, items, onSelect, placeholder = 'Search…', leadingIcon }: ${name}Props) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActive(0);
    const t = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((s) => {
      if (!q) return true;
      return \`\${s.label} \${s.description ?? ''} \${s.keywords ?? ''}\`.toLowerCase().includes(q);
    });
  }, [items, query]);

  const run = (id: string) => { onSelect(id); onClose(); };

  if (!open) return null;

  return (
    <div className="cmdk-overlay" onClick={onClose} role="presentation">
      <div className="cmdk-panel" role="dialog" aria-label="Command palette" aria-modal="true"
        onClick={(e) => e.stopPropagation()}>
        <div className="cmdk-input-row">
          {leadingIcon}
          <input ref={inputRef} className="cmdk-input" value={query}
            onChange={(e) => setQuery(e.target.value)} placeholder={placeholder} aria-label={placeholder} />
          <kbd className="cmdk-kbd">esc</kbd>
        </div>
        <ul className="cmdk-list" role="listbox" aria-label="Results">
          {results.map((s, i) => (
            <li key={s.id}>
              <button className={\`cmdk-item\${i === active ? ' is-active' : ''}\`}
                onMouseEnter={() => setActive(i)} onClick={() => run(s.id)}
                role="option" aria-selected={i === active}>
                {s.icon}
                <span className="cmdk-label">{s.label}</span>
                {s.description && <span className="cmdk-path">{s.description}</span>}
              </button>
            </li>
          ))}
          {results.length === 0 && <li className="cmdk-empty">No matches.</li>}
        </ul>
      </div>
    </div>
  );
}

export default ${name};
`,

  Chameleon: (name, def) => `/**
 * @file ${name} — Adaptive theme controls (brand × world × age × sensory).
 * Auto-generated from components.yml. Zero-reload token swaps via theme-store.
 */

import { useEffect, useRef, useState } from 'react';
import { useThemeStore, resolveBrandTokens, THEME_TOKENS, type ThemeId, type BrandId, type AgeTier } from '../theming/theme-store';

const BRANDS: BrandId[] = ['p31ca', 'phos', 'phosphorus31', 'willow', 'bonding'];
const AGES: AgeTier[] = ['child', 'teen', 'adult'];
const WORLD_LABELS: Record<ThemeId, string> = { garden: 'Garden', ocean: 'Ocean', aurora: 'Aurora', zen: 'Zen', volt: 'Volt' };

export interface ${name}Props {
  className?: string;
  style?: React.CSSProperties;
}

export function ${name}({ className = '', style }: ${name}Props) {
  const [open, setOpen] = useState(false);
  const [brand, setBrand] = useState<BrandId>('p31ca');
  const ref = useRef<HTMLDivElement>(null);
  const { theme, age, muted, warmLight, setTheme, setAge, setMuted, setWarmLight } = useThemeStore();

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const applyBrand = (next: BrandId) => {
    setBrand(next);
    const tokens = resolveBrandTokens(next);
    Object.entries(tokens).forEach(([key, value]) => document.documentElement.style.setProperty(key, value as string));
  };

  const swatch = (id: ThemeId) => THEME_TOKENS[id]?.['--p31-accent'];

  return (
    <div ref={ref} className={\`chameleon \${className}\`.trim()} style={style}>
      <button className="chameleon-trigger" onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog" aria-expanded={open} aria-label="Adaptive theme controls"
        title="Chameleon — brand, world, and sensory controls">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 3a9 9 0 0 0-9 9h4a5 5 0 0 1 5 5v.4a3.6 3.6 0 0 1-3.6 3.6H12a9 9 0 1 0 0-18z" />
        </svg>
        <span className="chameleon-dot" style={{ background: swatch(theme) }} aria-hidden="true" />
      </button>
      {open && (
        <div className="chameleon-panel" style={{ width: 264 }} role="dialog" aria-label="Adaptive theme controls">
          <span className="chameleon-label">Brand</span>
          <div className="chameleon-row chameleon-brands" role="group" aria-label="Brand">
            {BRANDS.map((b) => (
              <button key={b} className={\`brand-chip\${brand === b ? ' is-active' : ''}\`}
                onClick={() => applyBrand(b)} aria-pressed={brand === b} title={brand === b ? \`\${b} (current)\` : b}>
                {b}
              </button>
            ))}
          </div>
          <span className="chameleon-label">World</span>
          <div className="chameleon-row" role="group" aria-label="Color world">
            {(Object.keys(THEME_TOKENS) as ThemeId[]).map((id) => (
              <button key={id} className={\`world-dot \${theme === id ? 'is-active' : ''}\`}
                style={{ background: swatch(id) }} onClick={() => setTheme(id)}
                aria-pressed={theme === id} title={\`\${WORLD_LABELS[id]}\${theme === id ? ' (current)' : ''}\`}>
                <span className="sr-only">{WORLD_LABELS[id]}</span>
              </button>
            ))}
          </div>
          <div className="chameleon-row chameleon-seg" role="group" aria-label="Age tier">
            {AGES.map((a) => (
              <button key={a} className={\`seg \${age === a ? 'is-active' : ''}\`}
                onClick={() => setAge(a)} aria-pressed={age === a}>
                {a}
              </button>
            ))}
          </div>
          <div className="chameleon-row chameleon-toggles">
            <label className="toggle">
              <input type="checkbox" checked={muted} onChange={(e) => setMuted(e.target.checked)} />
              <span>Muted</span>
            </label>
            <label className="toggle">
              <input type="checkbox" checked={warmLight} onChange={(e) => setWarmLight(e.target.checked)} />
              <span>Warm dusk</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

export default ${name};
`,

  PageHeader: (name, def) => `/**
 * @file ${name} — Inner-page hero: mono eyebrow, gradient title, lede.
 * Auto-generated from components.yml.
 */

import type { ReactNode, CSSProperties } from 'react';

export interface ${name}Props {
  eyebrow: string;
  title: string;
  lede?: string;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function ${name}({ eyebrow, title, lede, children, className = '', style }: ${name}Props) {
  return (
    <header className={\`page-header-route \${className}\`.trim()} style={style}>
      <span className="hero-eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      {lede && <p className="page-lede">{lede}</p>}
      {children && <div className="page-actions">{children}</div>}
    </header>
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
