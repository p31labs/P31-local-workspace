/**
 * @file P31 Design System MCP tools — Cloudflare Worker safe.
 *
 * This module reimplements the 13 MCP tool handlers without any Node.js fs
 * dependencies, making it safe for Cloudflare Workers deployment.
 *
 * For the stdio/local version, see src/mcp/tools.ts
 */

import {
  COMPONENT_DEFS,
  COMPONENT_CATEGORIES,
  type ComponentDef,
  type ComponentCategory,
} from '../componentDefs.js';
import {
  convertReactToAstro,
  convertAstroToReact,
  convertHtmlToReact,
  convertReactToHtml,
} from '../converter/index.js';
import { auditCssFile } from '../converter/audit.js';
import { getPrinciples, getReviewRules } from '../principles.js';
import {
  TOKEN_MAP,
  TOKENS_DATA,
  RECIPE_MAP,
  RECIPE_NAMES,
  RECIPE_CATEGORIES,
} from './shared.js';

import type {
  McpRequest,
  McpResponse,
  ToolResult,
} from './shared.js';
import {
  findToken,
  resolveTokenValue,
  extractClasses,
  extractTokens,
} from './shared.js';
import { generateWcTemplate } from './wc-template.js';

// ─── Inline Component Generator (Worker-safe) ───────────────────────────────

const COMPONENT_TEMPLATES: Record<string, (name: string, def: ComponentDef) => string> = {
  GlassPanel: (name, def) => `/**
 * @file ${name} — Glassmorphic elevated surface with backdrop blur.
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

  GlassCard: (name, def) => `/**
 * @file ${name} — Padded glassmorphic card for content grouping.
 */

import type { ReactNode } from 'react';

export interface ${name}Props {
  children: ReactNode;
  strong?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function ${name}({ children, strong, className, style }: ${name}Props) {
  const cls = \`rounded-2xl border border-white/[0.06] backdrop-blur-xl \${strong ? 'bg-void-raised/80 shadow-[0_8px_32px_rgba(0,0,0,0.4)]' : 'bg-void-raised/60 shadow-[0_4px_16px_rgba(0,0,0,0.3)]'} \${className || ''}\`;
  return <div className={cls} style={style}>{children}</div>;
}

export default ${name};
`,

  Topbar: (name, def) => `/**
 * @file ${name} — Fixed glass navigation header.
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
          aria-checked={i === level ? 'true' : 'false'}
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

  Button: (name, def) => `/**
 * @file ${name} — Primary action button.
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

  StatusBadge: (name, def) => `/**
 * @file ${name} — Status indicator badge.
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

  SpoonMeter: (name, def) => `/**
 * @file ${name} — Cognitive load meter showing 0-5 spoons.
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

  MetricBadge: (name, def) => `/**
 * @file ${name} — Compact metric display with icon.
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

  GlassStrong: (name, def) => `/**
 * @file ${name} — High-opacity glass surface with strong blur.
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

  HonestLabel: (name, def) => `/**
 * @file ${name} — Disclaimer badge for contested-science content.
 */

import type { ReactNode } from 'react';

export interface ${name}Props {
  children: ReactNode;
  className?: string;
}

export function ${name}({ children, className }: ${name}Props) {
  return (
    <span className={\`honest-label \${className || ''}\`} title="This content represents contested or emerging science. Verify independently.">
      {children}
    </span>
  );
}

export default ${name};
`,

  TetraGrid: (name, def) => `/**
 * @file ${name} — 4-column responsive grid for tetrahedral layouts.
 */

import type { ReactNode } from 'react';

export interface ${name}Props {
  children: ReactNode;
  className?: string;
}

export function ${name}({ children, className }: ${name}Props) {
  return (
    <div className={\`tetra-grid \${className || ''}\`}>
      {children}
    </div>
  );
}

export default ${name};
`,
};

function generateComponentCode(name: string): string {
  const templateFn = COMPONENT_TEMPLATES[name];
  if (templateFn) {
    const def = COMPONENT_DEFS[name] || { description: 'Component' };
    return templateFn(name, def);
  }

  // Generic template for components without specific templates
  const def = COMPONENT_DEFS[name] || { description: 'Component' };
  return `/**
 * @file ${name} — ${def.description}
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

// ─── Tool Handlers ──────────────────────────────────────────────────────────

export function handleToolCall(name: string, args: Record<string, any> = {}): ToolResult {
  try {
    switch (name) {
      // ─── Tokens ────────────────────────────────────────────────────────

      case 'list_tokens': {
        const category = args.category || 'all';
        let tokens = TOKENS_DATA.map(t => ({
          path: t.path,
          cssVar: t.cssVar,
          value: resolveTokenValue(t.path) || t.value,
        }));

        if (category !== 'all') {
          tokens = tokens.filter(t => t.path.startsWith(category));
        }

        return {
          content: [{ type: 'text', text: JSON.stringify({ count: tokens.length, tokens }, null, 2) }],
        };
      }

      case 'resolve_token': {
        const { path } = args;
        if (!path) return { content: [{ type: 'text', text: 'Missing required arg: path' }], isError: true };

        const entry = findToken(path);
        if (!entry) {
          return { content: [{ type: 'text', text: `Token not found: ${path}` }], isError: true };
        }

        const value = resolveTokenValue(path) || entry.value;
        return {
          content: [{ type: 'text', text: JSON.stringify({ path, cssVar: entry.cssVar, value }, null, 2) }],
        };
      }

      case 'search_tokens': {
        const { query } = args;
        if (!query) return { content: [{ type: 'text', text: 'Missing required arg: query' }], isError: true };

        const lowerQuery = query.toLowerCase();
        const matches = TOKENS_DATA
          .filter(t => {
            const resolved = resolveTokenValue(t.path) || t.value;
            return t.path.toLowerCase().includes(lowerQuery) || resolved.toLowerCase().includes(lowerQuery);
          })
          .map(t => ({
            path: t.path,
            cssVar: t.cssVar,
            value: resolveTokenValue(t.path) || t.value,
          }));

        return {
          content: [{ type: 'text', text: JSON.stringify({ count: matches.length, matches }, null, 2) }],
        };
      }

      // ─── Components ────────────────────────────────────────────────────

      case 'list_components': {
        const category = args.category as string | undefined;
        let entries = Object.entries(COMPONENT_DEFS);
        if (category && category !== 'all') {
          if (!COMPONENT_CATEGORIES.includes(category as ComponentCategory)) {
            return {
              content: [{
                type: 'text',
                text: `Invalid category: ${category}. Valid categories: ${COMPONENT_CATEGORIES.join(', ')}`,
              }],
              isError: true,
            };
          }
          entries = entries.filter(([_, def]) => def.category === (category as ComponentCategory));
        }
        const result = entries.map(([name, def]) => ({
          name,
          description: def.description || '',
          css_class: def.css_class,
          category: def.category,
        }));
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      case 'get_component': {
        const { name } = args;
        if (!name) return { content: [{ type: 'text', text: 'Missing required arg: name' }], isError: true };
        const def = COMPONENT_DEFS[name];
        if (!def) return { content: [{ type: 'text', text: `Component not found: ${name}` }], isError: true };
        return { content: [{ type: 'text', text: JSON.stringify(def, null, 2) }] };
      }

      case 'generate_component': {
        const { name, framework, options } = args;
        if (!name || !framework) {
          return { content: [{ type: 'text', text: 'Missing required args: name, framework' }], isError: true };
        }

        const def = COMPONENT_DEFS[name];
        if (!def) {
          return { content: [{ type: 'text', text: `Component not found: ${name}` }], isError: true };
        }

        let code = '';
        switch (framework) {
          case 'react': {
            code = generateComponentCode(name);
            break;
          }
          case 'astro': {
            const tsx = generateComponentCode(name);
            code = convertReactToAstro(tsx, name);
            break;
          }
          case 'html': {
            const tsx = generateComponentCode(name);
            code = convertReactToHtml(tsx, name);
            break;
          }
          case 'webcomponent': {
            code = generateWcTemplate(name, def);
            break;
          }
          default:
            return { content: [{ type: 'text', text: `Unsupported framework: ${framework}` }], isError: true };
        }

        return { content: [{ type: 'text', text: code }] };
      }

      // ─── Recipes ───────────────────────────────────────────────────────

      case 'list_recipes': {
        const category = args.category as string | undefined;
        if (category && category !== 'all') {
          const recipes = RECIPE_CATEGORIES[category];
          if (!recipes) {
            return {
              content: [{
                type: 'text',
                text: `Unknown category: ${category}. Valid categories: ${Object.keys(RECIPE_CATEGORIES).join(', ')}`,
              }],
              isError: true,
            };
          }
          return {
            content: [{ type: 'text', text: JSON.stringify({ count: recipes.length, category, recipes }, null, 2) }],
          };
        }
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              count: RECIPE_NAMES.length,
              categories: Object.keys(RECIPE_CATEGORIES),
              recipes: RECIPE_NAMES,
            }, null, 2),
          }],
        };
      }

      case 'get_recipe': {
        const { name } = args;
        if (!name) return { content: [{ type: 'text', text: 'Missing required arg: name' }], isError: true };
        const css = RECIPE_MAP[name];
        if (!css) return { content: [{ type: 'text', text: `Recipe not found: ${name}` }], isError: true };
        return { content: [{ type: 'text', text: css }] };
      }

      // ─── Converter ────────────────────────────────────────────────────

      case 'convert_component': {
        const { source, target, code, componentName } = args;
        if (!source || !target || !code || !componentName) {
          return { content: [{ type: 'text', text: 'Missing required args: source, target, code, componentName' }], isError: true };
        }

        let result = '';
        const key = `${source}->${target}`;

        switch (key) {
          case 'react->astro':
            result = convertReactToAstro(code, componentName);
            break;
          case 'astro->react':
            result = convertAstroToReact(code, componentName);
            break;
          case 'html->react':
            result = convertHtmlToReact(code, componentName);
            break;
          case 'react->html':
            result = convertReactToHtml(code, componentName);
            break;
          default:
            return { content: [{ type: 'text', text: `Unsupported conversion: ${source} → ${target}` }], isError: true };
        }

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ source, target, componentName, code: result }, null, 2),
          }],
        };
      }

      // ─── Audit ────────────────────────────────────────────────────────

      case 'audit_css': {
        const { content: cssContent, strict = false } = args;
        if (!cssContent) return { content: [{ type: 'text', text: 'Missing required arg: content' }], isError: true };
        const violations = auditCssFile(cssContent, strict);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ violationCount: violations.length, violations }, null, 2),
          }],
        };
      }

      case 'validate_parity': {
        const { sourceContent, targetContent } = args;
        if (!sourceContent || !targetContent) {
          return { content: [{ type: 'text', text: 'Missing required args: sourceContent, targetContent' }], isError: true };
        }

        const sourceClasses = extractClasses(sourceContent);
        const targetClasses = extractClasses(targetContent);
        const sourceTokens = extractTokens(sourceContent);
        const targetTokens = extractTokens(targetContent);

        const missingInTarget = Array.from(sourceClasses).filter(c => !targetClasses.has(c));
        const missingInSource = Array.from(targetClasses).filter(c => !sourceClasses.has(c));
        const missingTokens = Array.from(sourceTokens).filter(t => !targetTokens.has(t));

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              parity: missingInTarget.length === 0 && missingInSource.length === 0 && missingTokens.length === 0,
              missingClassesInTarget: missingInTarget,
              missingClassesInSource: missingInSource,
              missingTokens,
            }, null, 2),
          }],
        };
      }

      // ─── Principles ───────────────────────────────────────────────────

      case 'get_ui_principles': {
        const principles = getPrinciples();
        return { content: [{ type: 'text', text: JSON.stringify(principles, null, 2) }] };
      }

      case 'get_review_rules': {
        const rules = getReviewRules();
        return { content: [{ type: 'text', text: JSON.stringify(rules, null, 2) }] };
      }

      default:
        return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
    }
  } catch (error) {
    return {
      content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
      isError: true,
    };
  }
}
