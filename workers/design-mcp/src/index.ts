/**
 * P31 Design System MCP Worker
 * MCP 2026-07-28 Stateless Core — no session handshake.
 *
 * Endpoints:
 *   POST /              MCP JSON-RPC (tools/list, tools/call, server/discover, ping)
 *   GET  /health         Health check
 *   GET  /              Tool listing page (HTML)
 *
 * Deploy: wrangler deploy
 * Bind to: mcp.p31ca.org (or custom domain)
 */

import { tokens, components, icons, iconCatalog } from './data';
import {
  proposeComponent,
  proposeIcon,
  proposeToken,
  tokenize,
  scoreComponents,
  suggestTokens,
  suggestProps,
  generateGuidance,
  validateProposal,
} from './proposer';
import { validateComponent, auditTokens, auditIcons, type ValidationResult, type AuditResult, type AuditIconsResult } from './validator';
import { scanUI, type MCPAnnotation } from './handlers/scan-ui';
import { handleToggleDrawer, handleNavigate, handleSetSpoonLevel } from './handlers/tools';
import skillsData from './generated/skills.json';
const SKILLS = skillsData as Record<string, { title: string; body: string; has_evals: boolean }>;

// ─── MCP 2026-07-28 Stateless Core ──────────────────────────────────────

const PROTOCOL_VERSION = '2026-07-28';

interface RequestMeta {
  protocolVersion?: string;
  capabilities?: Record<string, any>;
  clientInfo?: { name?: string; version?: string };
}

function extractMeta(body: any): RequestMeta {
  return (body && body._meta) || {};
}

function metaEnvelope(): { _meta: { protocolVersion: string } } {
  return { _meta: { protocolVersion: PROTOCOL_VERSION } };
}

// ─── Token resolver ─────────────────────────────────────────────────────────

function dt(pathStr: string): unknown {
  const parts = pathStr.split('.');
  let node: any = tokens;
  for (const part of parts) {
    if (node == null || typeof node !== 'object') return undefined;
    node = node[part];
  }
  return (node != null && typeof node === 'object' && node['$value'] != null)
    ? node['$value']
    : node;
}

function resolveReferences(value: any, seen = new Set<string>()): any {
  if (typeof value !== 'string') return value;
  return value.replace(/\{([^}]+)\}/g, (_, ref) => {
    if (seen.has(ref)) throw new Error(`Circular reference: ${ref}`);
    seen.add(ref);
    const resolved = dt(ref);
    if (resolved === undefined) throw new Error(`Unresolved reference: ${ref}`);
    return resolveReferences(resolved, seen);
  });
}

function tokenResolve(pathStr: string): any {
  const raw = dt(pathStr);
  if (raw === undefined) return null;
  return resolveReferences(raw);
}

// ─── Component schema ────────────────────────────────────────────────────────

interface CompDef {
  description?: string;
  css_class?: string;
  aiGuidance?: {
    useWhen?: string;
    avoidWhen?: string;
    examples?: string[];
  };
  variants?: string[];
  props?: Record<string, { type?: string; default?: any; options?: string[]; range?: [number, number] }>;
  slots?: string[];
  tokens?: string[];
}

const COMP_LIST = components?.components || {};

function getComponent(name: string) {
  const key = Object.keys(COMP_LIST).find(
    k => k.toLowerCase() === name.toLowerCase()
  );
  if (!key) return null;
  const raw: CompDef = COMP_LIST[key];

  const props: Record<string, any> = {};
  for (const [pname, pdef] of Object.entries(raw.props || {})) {
    props[pname] = {
      type: pdef.type || 'string',
      default: pdef.default,
    };
    if (pdef.options) props[pname].options = pdef.options;
    if (pdef.range) props[pname].range = pdef.range;
  }

  const resolvedTokens: Record<string, any> = {};
  for (const t of raw.tokens || []) {
    try { resolvedTokens[t] = tokenResolve(t); } catch {}
  }

  return {
    name: key,
    description: raw.description,
    css_class: raw.css_class,
    aiGuidance: raw.aiGuidance || null,
    variants: raw.variants || [],
    props,
    slots: raw.slots || [],
    tokens: raw.tokens || [],
    resolved_tokens: resolvedTokens,
  };
}

// ─── MCP Tools definition ────────────────────────────────────────────────────

const TOOLS = [
  {
    name: 'token_resolve',
    description: 'Resolve a DTCG token path to its computed value.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        path: { type: 'string' as const, description: 'Dotted token path (e.g. semantic.color.accent.default)' },
      },
      required: ['path'],
    },
  },
  {
    name: 'component_schema',
    description: 'Get the full schema for a P31 design system component.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string' as const, description: 'Component name (e.g. GlassCard, Button)' },
      },
      required: ['name'],
    },
  },
  {
    name: 'component_usage',
    description: 'List all P31 components with descriptions and CSS classes.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string' as const, description: 'Optional filter by component name' },
      },
    },
  },
  {
    name: 'generate_component',
    description: 'Generate a React/TSX component from components.yml. Returns the component code, test, and Storybook story.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string' as const, description: 'Component name to generate (e.g. GlassCard, Button, SpoonMeter). Omit to generate all.' },
      },
    },
  },
  {
    name: 'component_search',
    description: 'Search P31 design components by name, description, CSS class, or AI guidance keywords.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string' as const, description: 'Search query — matches component name, description, css_class, or aiGuidance fields (e.g. "form", "button", "spoons", "crisis").' },
      },
      required: ['query'],
    },
  },
  {
    name: 'token_list',
    description: 'List all available token categories with key values.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        prefix: { type: 'string' as const, description: 'Optional filter prefix' },
      },
    },
  },
  {
    name: 'layout_generate',
    description: 'Generate sovereign HTML layout from a JSON description. Supports hero, tetra-grid, card-grid, section, and cta layout types. Set format: "a2ui" for A2UI JSON output.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        type: { type: 'string' as const, enum: ['hero', 'tetra-grid', 'card-grid', 'section', 'cta'], description: 'Layout type to render.' },
        format: { type: 'string' as const, enum: ['html', 'a2ui'], description: 'Output format. Default "html". Set "a2ui" for JSON component tree.' },
        title: { type: 'string' as const, description: 'Main heading (hero, section).' },
        subtitle: { type: 'string' as const, description: 'Subtitle text (hero).' },
        heading: { type: 'string' as const, description: 'Section heading (card-grid, section, cta).' },
        description: { type: 'string' as const, description: 'Section description (card-grid, section, cta).' },
        columns: { type: 'number' as const, description: 'Number of grid columns (card-grid, default 3, max 4).' },
        badge: { type: 'string' as const, description: 'Badge text (hero).' },
        content: { type: 'string' as const, description: 'Raw HTML content (section).' },
        ctas: { type: 'array' as const, description: 'Array of {label, href, variant} buttons (hero).' },
        stats: { type: 'array' as const, description: 'Array of {value, label} stat cards (hero).' },
        buttons: { type: 'array' as const, description: 'Array of {label, href, variant} buttons (cta).' },
        items: { type: 'array' as const, description: 'Array of {component: "GlassCard", props: {color, title, description, href}} (tetra-grid, card-grid).' },
      },
      required: ['type'],
    },
  },
  {
    name: 'list_icons',
    description: 'List all P31 icons with family, colors, animation, and description.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        family: { type: 'string' as const, enum: ['regular', 'advanced'], description: 'Optional filter by icon family.' },
      },
    },
  },
  {
    name: 'get_icon',
    description: 'Get a single P31 icon SVG + metadata by id.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string' as const, description: 'Icon id (e.g. sovereign-crown, spoon).' },
      },
      required: ['name'],
    },
  },
  {
    name: 'icon_search',
    description: 'Search P31 icons by name, concept keyword, or color palette. Returns matching icons with metadata.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string' as const, description: 'Search query — matches icon id, name, description, or colors (e.g. "crown", "gold", "sovereign").' },
        family: { type: 'string' as const, enum: ['regular', 'advanced'], description: 'Optional filter by icon family.' },
      },
      required: ['query'],
    },
  },
  {
    name: 'icon_preview',
    description: 'Get a rendered P31 icon preview (HTML with embedded SVG) plus metadata for agent visualization.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string' as const, description: 'Icon id (e.g. sovereign-crown, spoon).' },
        size: { type: 'string' as const, enum: ['sm', 'md', 'lg'], description: 'Preview size: sm=24px, md=40px, lg=64px. Default md.' },
      },
      required: ['name'],
    },
  },
  {
    name: 'propose_component',
    description: 'Propose a new P31 design system component from a natural language description.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        description: { type: 'string' as const, description: 'Natural language description of the component.' },
        style: { type: 'string' as const, enum: ['glass', 'solid', 'minimal'], description: 'Visual style preference.' },
        interactive: { type: 'boolean' as const, description: 'Whether the component accepts user input.' },
        surfaceId: { type: 'string' as const, description: 'The surface ID this component proposal belongs to' },
        userId: { type: 'string' as const, description: 'The user ID for this request' },
      },
      required: ['description'],
    },
  },
  {
    name: 'propose_icon',
    description: 'Propose a new P31 icon from a natural language description.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        description: { type: 'string' as const, description: 'What the icon represents.' },
        family: { type: 'string' as const, enum: ['regular', 'advanced'], description: 'Icon family preference.' },
        colors: { type: 'array' as const, items: { type: 'string' }, description: 'Preferred color tokens.' },
        surfaceId: { type: 'string' as const, description: 'The surface ID this icon proposal belongs to' },
        userId: { type: 'string' as const, description: 'The user ID for this request' },
      },
      required: ['description'],
    },
  },
  {
    name: 'propose_token',
    description: 'Propose a new P31 design token from a natural language description. Returns path, value, type, category, and rationale.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        description: { type: 'string' as const, description: 'Natural language description of the token need (e.g. "a soft purple glow for hover states").' },
        category: { type: 'string' as const, enum: ['primitive', 'semantic', 'theme'], description: 'Token namespace. Defaults to primitive.' },
        type: { type: 'string' as const, enum: ['color', 'dimension', 'fontFamily', 'shadow'], description: 'Token value type. Defaults inferred from description.' },
        surfaceId: { type: 'string' as const, description: 'The surface ID this token proposal belongs to' },
        userId: { type: 'string' as const, description: 'The user ID for this request' },
      },
      required: ['description'],
    },
  },
  {
    name: 'validate_component',
    description: 'Validate a P31 component against the design system schema.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string' as const, description: 'Component name to validate.' },
      },
      required: ['name'],
    },
  },
  {
    name: 'audit_tokens',
    description: 'Audit the P31 token tree for inconsistencies, orphans, and dead tokens.',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'audit_icons',
    description: 'Audit the P31 icon catalog for missing SVGs, metadata, family mismatches, color count errors, duplicates, animation/viewBox/aria-label issues, and catalog mismatches.',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'get_template_spec',
    description: 'Get the DESIGN.md spec for a canonical P31 page template. Returns the full template specification including visual theme, color palette, typography, layout, components used, tokens used, and agent generation rules.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        template: { type: 'string' as const, enum: ['template-developer-hub', 'template-institutional', 'template-caregiver'], description: 'Template identifier.' },
        returnFormat: { type: 'string' as const, enum: ['json', 'markdown'], description: 'Output format. "json" (default) returns structured fields. "markdown" returns the full DESIGN.md prose optimized for AI agent reasoning.' },
      },
      required: ['template'],
    },
  },
  {
    name: 'template_preview',
    description: 'Get a live preview URL and metadata for a P31 canonical page template. Returns the live URL, screenshot placeholder, source file path, and a concise visual description optimized for AI agents to "see" the template.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        template: { type: 'string' as const, enum: ['template-developer-hub', 'template-institutional', 'template-caregiver'], description: 'Template identifier.' },
      },
      required: ['template'],
    },
  },
  {
    name: 'scan_ui',
    description: 'Scan HTML for WebMCP annotations (data-mcp-* attributes). Returns structured list of all annotations found.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        html: { type: 'string' as const, description: 'HTML string to scan (usually a component or page).' },
      },
      required: ['html'],
    },
  },
  {
    name: 'toggleDrawer',
    description: 'Open or close the navigation drawer',
    inputSchema: {
      type: 'object' as const,
      properties: {
        state: { type: 'string' as const, enum: ['open', 'closed'], description: 'Desired drawer state' },
        target: { type: 'string' as const, description: 'Which drawer to toggle (e.g. nav-drawer)' },
        surfaceId: { type: 'string' as const, description: 'The surface ID this drawer belongs to' },
        userId: { type: 'string' as const, description: 'The user ID for this request' },
      },
      required: ['state', 'target'],
    },
  },
  {
    name: 'navigate',
    description: 'Navigate to a URL',
    inputSchema: {
      type: 'object' as const,
      properties: {
        href: { type: 'string' as const, description: 'URL to navigate to' },
        external: { type: 'boolean' as const, description: 'Whether the URL is external' },
        surfaceId: { type: 'string' as const, description: 'The surface ID this navigation occurs in' },
        userId: { type: 'string' as const, description: 'The user ID for this request' },
      },
      required: ['href'],
    },
  },
  {
    name: 'setSpoonLevel',
    description: 'Set cognitive load level (0–5)',
    inputSchema: {
      type: 'object' as const,
      properties: {
        level: { type: 'number' as const, minimum: 0, maximum: 5, description: 'Spoon level (0 = crisis, 5 = quantum)' },
        surfaceId: { type: 'string' as const, description: 'The surface ID this spoon level applies to' },
        userId: { type: 'string' as const, description: 'The user ID for this request' },
      },
      required: ['level'],
    },
  },
  {
    name: 'list_skills',
    description: 'List all available P31 skills — machine-readable standards agents can load at runtime via p31://skills resources.',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'get_skill',
    description: 'Get the full body of a P31 skill (machine-readable standard) by name. Returns the SKILL.md content with audit rules and golden eval cases.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string' as const, description: 'Skill name (e.g. p31-standards)' },
      },
      required: ['name'],
    },
  },
];

// ─── Layout generator ──────────────────────────────────────────────────────

const COLOR_TO_VAR: Record<string, string> = {
  accent: 'var(--p31-accent)',
  violet: 'var(--p31-accent-violet)',
  gold: 'var(--p31-accent-gold)',
  green: 'var(--p31-accent-green)',
  red: 'var(--p31-accent-red)',
  iris: 'var(--p31-accent-iris)',
};

function h(s: string): string {
  if (typeof s !== 'string') return String(s);
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function renderA2UI(type: string, props: any): any {
  function make(tag: string, props: any, children?: any[]) {
    return Object.assign({ component: tag, properties: props || {} }, children ? { children } : {});
  }

  switch (type) {
    case 'hero': {
      const children: any[] = [];
      if (props.badge) children.push(make('Label', { text: props.badge, variant: 'badge' }));
      children.push(make('Heading', { text: props.title || '', level: 1 }));
      if (props.subtitle) children.push(make('Text', { text: props.subtitle, variant: 'subtitle' }));
      if (props.ctas) children.push(make('ButtonRow', { buttons: props.ctas.map((c: any) => ({ label: c.label, href: c.href, variant: c.variant || 'primary' })) }));
      if (props.stats) children.push(make('StatRow', { stats: props.stats.map((s: any) => ({ value: s.value, label: s.label })) }));
      return { version: 'p31-a2ui-0.9', layout: 'hero', root: make('Hero', {}, children) };
    }

    case 'tetra-grid':
      return {
        version: 'p31-a2ui-0.9', layout: 'tetra-grid',
        root: make('TetraGrid', {}, (props.items || []).map((item: any, i: number) => {
          const p = item.props || {};
          return make('GlassCard', { title: p.title || '', description: p.description || '', color: p.color || ['accent', 'violet', 'gold', 'green'][i], href: p.href || '' });
        })),
      };

    case 'card-grid': {
      const children: any[] = [];
      if (props.heading) children.push(make('Heading', { text: props.heading, level: 2 }));
      if (props.description) children.push(make('Text', { text: props.description, variant: 'description' }));
      children.push(make('Grid', { columns: props.columns || 3 }, (props.items || []).map((item: any) => {
        const p = item.props || {};
        return make('GlassCard', { title: p.title || '', description: p.description || '', color: p.color || 'accent', href: p.href || '' });
      })));
      return { version: 'p31-a2ui-0.9', layout: 'card-grid', root: make('Section', { variant: 'grid' }, children) };
    }

    case 'section': {
      const children: any[] = [];
      if (props.heading) children.push(make('Heading', { text: props.heading, level: 2 }));
      if (props.description) children.push(make('Text', { text: props.description, variant: 'description' }));
      if (props.content) children.push(make('HtmlBlock', { html: props.content }));
      return { version: 'p31-a2ui-0.9', layout: 'section', root: make('Section', {}, children) };
    }

    case 'cta':
      return {
        version: 'p31-a2ui-0.9', layout: 'cta',
        root: make('CTABlock', { heading: props.heading || '', description: props.description || '', buttons: (props.buttons || []).map((b: any) => ({ label: b.label, href: b.href || '#', variant: b.variant || 'primary' })) }),
      };

    default:
      return { error: `Unknown layout type: ${type}`, supported: ['hero', 'tetra-grid', 'card-grid', 'section', 'cta'] };
  }
}

function renderLayout(input: any): any {
  const format = (input && input.format) || 'html';
  const { type, format: _, ...props } = input || {};

  if (!type) return { error: 'Missing "type" field.' };

  if (format === 'a2ui') return renderA2UI(type, props);

  // HTML format
  switch (type) {
    case 'hero': {
      const { title, subtitle, ctas, stats, badge } = props;
      const badgeHtml = badge ? `<div style="display:inline-flex;align-items:center;gap:8px;padding:6px 16px;border-radius:32px;margin-bottom:20px;" class="glass-subtle">${h(badge)}</div>` : '';
      const ctasHtml = (ctas || []).map((c: any) => `<a href="${h(c.href || '#')}" class="btn-${c.variant === 'secondary' ? 'secondary' : c.variant === 'ghost' ? 'ghost' : 'primary'}" style="display:inline-flex;align-items:center;gap:8px;">${h(c.label || '')}</a>`).join('');
      const statsHtml = (stats || []).map((s: any) => `<div class="glass-subtle" style="padding:12px 16px;text-align:center;min-width:80px;"><div style="font-size:20px;font-weight:700;color:var(--p31-text);">${h(String(s.value))}</div><div style="font-size:10px;color:var(--p31-text-tertiary);text-transform:uppercase;letter-spacing:0.05em;">${h(s.label)}</div></div>`).join('');
      return `<section style="text-align:center;padding:60px 0 40px;max-width:1280px;margin:0 auto;padding-left:24px;padding-right:24px;">${badgeHtml}<h1 style="font-size:clamp(2.5rem,6vw,4rem);font-weight:800;color:var(--p31-text);margin-bottom:16px;line-height:1.15;">${h(title || '')}</h1>${subtitle ? `<p style="font-size:1.125rem;color:var(--p31-text-secondary);max-width:650px;margin:0 auto 32px;">${h(subtitle)}</p>` : ''}${ctasHtml ? `<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-bottom:${statsHtml ? '32px' : '0'};">${ctasHtml}</div>` : ''}${statsHtml ? `<div style="display:flex;gap:24px;justify-content:center;flex-wrap:wrap;border-top:1px solid rgba(255,255,255,0.06);padding-top:24px;">${statsHtml}</div>` : ''}</section>`;
    }

    case 'tetra-grid': {
      const { items } = props;
      if (!items || items.length !== 4) return '<p>Error: tetra-grid requires exactly 4 items.</p>';
      const cards = items.map((item: any, i: number) => {
        const p = item.props || {};
        const color = p.color || ['accent', 'violet', 'gold', 'green'][i];
        const border = `border-left:2px solid ${COLOR_TO_VAR[color] || COLOR_TO_VAR.accent};`;
        const inner = `${p.title ? `<h3 style="color:var(--p31-text);font-size:14px;font-weight:700;">${h(p.title)}</h3>` : ''}${p.description ? `<p style="color:var(--p31-text-secondary);font-size:12px;line-height:1.5;">${h(p.description)}</p>` : ''}`;
        return (p.href && p.href !== '#')
          ? `<a href="${h(p.href)}" class="glass-card" style="${border}text-decoration:none;display:block;">${inner}</a>`
          : `<div class="glass-card" style="${border}">${inner}</div>`;
      }).join('');
      return `<div class="tetra-grid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;padding:16px 0;">${cards}</div>`;
    }

    case 'card-grid': {
      const { columns, heading, description, items } = props;
      const headingHtml = heading ? `<h2 style="font-size:clamp(1.5rem,3vw,2.25rem);font-weight:700;color:var(--p31-text);margin-bottom:8px;text-align:center;">${h(heading)}</h2>` : '';
      const descHtml = description ? `<p style="color:var(--p31-text-secondary);text-align:center;max-width:650px;margin:0 auto 24px;">${h(description)}</p>` : '';
      const col = Math.min(columns || 3, 4);
      const cards = (items || []).map((item: any) => {
        const p = item.props || {};
        const border = p.color ? `border-left:2px solid ${COLOR_TO_VAR[p.color] || COLOR_TO_VAR.accent};` : '';
        const inner = `${p.title ? `<h3 style="color:var(--p31-text);font-size:14px;font-weight:700;margin-bottom:4px;">${h(p.title)}</h3>` : ''}${p.description ? `<p style="color:var(--p31-text-secondary);font-size:12px;line-height:1.5;">${h(p.description)}</p>` : ''}`;
        return (p.href && p.href !== '#')
          ? `<a href="${h(p.href)}" class="glass-card" style="${border}text-decoration:none;display:block;">${inner}</a>`
          : `<div class="glass-card" style="${border}">${inner}</div>`;
      }).join('');
      return `<div style="max-width:1280px;margin:0 auto;padding:24px;">${headingHtml}${descHtml}<div style="display:grid;grid-template-columns:repeat(${col},1fr);gap:16px;">${cards}</div></div>`;
    }

    case 'section': {
      const { heading, description, content } = props;
      return `<section style="padding:48px 24px;max-width:1280px;margin:0 auto;">${heading ? `<h2 style="font-size:clamp(1.5rem,3vw,2.25rem);font-weight:700;color:var(--p31-text);margin-bottom:8px;text-align:center;">${h(heading)}</h2>` : ''}${description ? `<p style="color:var(--p31-text-secondary);text-align:center;max-width:650px;margin:0 auto 24px;">${h(description)}</p>` : ''}${content || ''}</section>`;
    }

    case 'cta': {
      const { heading, description, buttons } = props;
      const btnHtml = (buttons || []).map((b: any) => `<a href="${h(b.href || '#')}" class="btn-${b.variant === 'secondary' ? 'secondary' : b.variant === 'ghost' ? 'ghost' : 'primary'}" style="display:inline-flex;align-items:center;gap:8px;">${h(b.label || '')}</a>`).join('');
      return `<div class="glass-strong" style="padding:48px 24px;text-align:center;max-width:720px;margin:0 auto;border-radius:var(--p31-radius-xl);"><h2 style="font-size:clamp(1.5rem,3vw,2rem);font-weight:700;color:var(--p31-text);margin-bottom:12px;">${h(heading || '')}</h2>${description ? `<p style="color:var(--p31-text-secondary);margin-bottom:24px;max-width:550px;margin-left:auto;margin-right:auto;">${h(description)}</p>` : ''}${btnHtml ? `<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">${btnHtml}</div>` : ''}</div>`;
    }

    default:
      return `<p>Unknown layout type: "${h(type)}". Supported: hero, tetra-grid, card-grid, section, cta.</p>`;
  }
}

// ─── Tool execution ─────────────────────────────────────────────────────────

  async function executeTool(name: string, args: Record<string, any>) {
  switch (name) {
    case 'token_resolve': {
      const value = tokenResolve(args.path);
      if (value === null) return { error: `Token not found: "${args.path}"`, status: 'error' };
      const raw = dt(args.path) as any;
      return {
        path: args.path,
        value: String(value),
        type: (raw && raw['$type']) || typeof value,
        status: 'ok',
      };
    }

    case 'component_schema': {
      const comp = getComponent(args.name);
      if (!comp) {
        const available = Object.keys(COMP_LIST).join(', ');
        return { error: `Unknown component "${args.name}". Available: ${available}`, status: 'error' };
      }
      return { component: comp, status: 'ok' };
    }

    case 'component_usage': {
      if (args.name) {
        const comp = getComponent(args.name);
        if (!comp) return { error: `Unknown component "${args.name}"`, status: 'error' };
        return { name: comp.name, component: comp, status: 'ok' };
      }
      const all: Record<string, { description: string; css_class: string }> = {};
      for (const key of Object.keys(COMP_LIST)) {
        all[key] = {
          description: (COMP_LIST[key] as CompDef).description || '',
          css_class: (COMP_LIST[key] as CompDef).css_class || '',
        };
      }
      return { components: all, total: Object.keys(all).length, status: 'ok' };
    }

    case 'token_list': {
      const entries: Record<string, unknown> = {};
      const prefix = args.prefix || '';

      function walk(node: any, pathStr: string) {
        if (!node || typeof node !== 'object') return;
        if (node['$value'] !== undefined) {
          if (!prefix || pathStr.startsWith(prefix)) {
            entries[pathStr] = { value: node['$value'], type: node['$type'] || 'string' };
          }
          return;
        }
        for (const key of Object.keys(node)) {
          if (key.startsWith('$')) continue;
          walk(node[key], pathStr ? `${pathStr}.${key}` : key);
        }
      }

      walk(tokens, '');
      return { tokens: entries, total: Object.keys(entries).length, status: 'ok' };
    }

    case 'layout_generate': {
      const result = renderLayout(args);
      return (args && args.format === 'a2ui')
        ? { a2ui: result, status: 'ok' }
        : { html: result, status: 'ok' };
    }

    case 'list_icons': {
      const familyFilter = args.family;
      const filtered = familyFilter ? icons.filter((i) => i.family === familyFilter) : icons;
      return {
        icons: filtered.map((i) => ({ id: i.id, name: i.name, family: i.family, colors: i.colors, animated: i.animated, description: i.description })),
        total: filtered.length,
        status: 'ok',
      };
    }

    case 'get_icon': {
      const icon = icons.find((i) => i.id === args.name);
      if (!icon) return { error: `Icon not found: "${args.name}"`, status: 'error' };
      return { icon, status: 'ok' };
    }

    case 'icon_search': {
      const q = (args.query || '').toLowerCase();
      const familyFilter = args.family;
      if (!q) return { error: 'Missing "query" field.', status: 'error' };
      const matches = icons.filter((i) => {
        if (familyFilter && i.family !== familyFilter) return false;
        const haystack = `${i.id} ${i.name} ${i.description} ${i.colors.join(' ')}`.toLowerCase();
        return haystack.includes(q);
      });
      return {
        query: args.query,
        results: matches.map((i) => ({ id: i.id, name: i.name, family: i.family, colors: i.colors, animated: i.animated, description: i.description })),
        total: matches.length,
        status: 'ok',
      };
    }

    case 'icon_preview': {
      const icon = icons.find((i) => i.id === args.name);
      if (!icon) return { error: `Icon not found: "${args.name}"`, status: 'error' };
      const size = args.size || 'md';
      const SIZE_PX = { sm: 24, md: 40, lg: 64 };
      const px = SIZE_PX[size] || 40;
      const colorSwatches = (icon.colors || []).map((c: string) => `<span style="display:inline-block;width:12px;height:12px;border-radius:2px;background:${c};margin-right:4px;" title="${c}"></span>`).join('');
      const preview = `<div style="display:inline-flex;align-items:center;gap:12px;padding:12px 16px;border-radius:8px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);"><div style="width:${px}px;height:${px}px;display:flex;align-items:center;justify-content:center;border-radius:6px;background:rgba(0,240,255,0.06);"><span style="font-size:${px * 0.5}px;color:var(--p31-accent);">⬡</span></div><div><div style="font-size:13px;font-weight:600;color:var(--p31-text);margin-bottom:2px;">${icon.name}</div><div style="font-size:11px;color:var(--p31-text-tertiary);margin-bottom:4px;">${icon.family} &middot; ${icon.animated ? 'animated' : 'static'}</div><div style="display:flex;align-items:center;">${colorSwatches}</div></div></div>`;
      return {
        id: icon.id,
        name: icon.name,
        family: icon.family,
        colors: icon.colors,
        animated: icon.animated,
        description: icon.description,
        size,
        preview,
         status: 'ok',
       };
     }

      case 'generate_component': {
        const name = (args as any).name;
        const componentsUrl = 'https://github.com/p31labs/P31-local-workspace/blob/main/cli/tokens/components.yml';
        const cliCommand = `andromeda generate${name ? ` --component ${name}` : ''}`;
        const available = ['GlassCard', 'GlassPanel', 'GlassStrong', 'GlassSubtle', 'Button', 'SpoonMeter', 'TetraGrid', 'HonestLabel', 'StatusBadge', 'CrisisOverlay', 'Starfield', 'ThemeToggle'];
        return {
          status: 'ok',
          message: 'Component generation runs at build time via the local CLI (not inside this edge worker).',
          cliCommand,
          componentsUrl,
          availableComponents: name ? available.filter(c => c.toLowerCase() === name.toLowerCase()) : available,
          instructions: `Run "${cliCommand}" from the monorepo root to generate ${name || 'all'} component(s) into packages/design-core/src/generated/.`,
        };
      }

      case 'component_search': {
        const query = (args.query || '').toLowerCase();
        if (!query) return { error: 'Missing "query" field.', status: 'error' };
        const matches: any[] = [];
        for (const key of Object.keys(COMP_LIST)) {
          const raw = COMP_LIST[key] as CompDef;
          const haystack = `${key} ${raw.description || ''} ${raw.css_class || ''} ${(raw.aiGuidance?.useWhen || '')} ${(raw.aiGuidance?.avoidWhen || '')} ${(raw.aiGuidance?.examples || []).join(' ')}`.toLowerCase();
          if (haystack.includes(query)) {
            matches.push({
              name: key,
              description: raw.description || '',
              css_class: raw.css_class || '',
              aiGuidance: raw.aiGuidance || null,
            });
          }
        }
        return {
          query: args.query,
          results: matches,
          total: matches.length,
          status: 'ok',
        };
      }

      case 'propose_component': {
        const description = String(args.description || '').trim();
        if (!description) return { error: 'Missing "description" field.', status: 'error' };
        const result = proposeComponent(description, args.style, args.interactive, components.components || {});
        return { ...result, status: 'ok' };
      }

      case 'propose_icon': {
        const description = String(args.description || '').trim();
        if (!description) return { error: 'Missing "description" field.', status: 'error' };
        const result = proposeIcon(description, args.family, args.colors);
        return { ...result, status: 'ok' };
      }

      case 'propose_token': {
        const description = String(args.description || '').trim();
        if (!description) return { error: 'Missing "description" field.', status: 'error' };
        const result = proposeToken(description, args.category, args.type);
        return { ...result, status: 'ok' };
      }

      case 'validate_component': {
        const targetName = String(args.name || '').trim();
        if (!targetName) return { error: 'Missing "name" field.', status: 'error' };
        const comp = COMP_LIST[targetName];
        if (!comp) {
          const available = Object.keys(COMP_LIST).join(', ');
          return { error: `Component not found: "${targetName}". Available: ${available}`, status: 'error' };
        }
        const result = validateComponent(targetName, comp, tokens, COMP_LIST);
        return { ...result, status: 'ok' };
      }

      case 'audit_tokens': {
        const result = auditTokens(tokens, components);
        return { ...result, status: 'ok' };
      }

      case 'get_template_spec': {
        const TEMPLATE_SPECS: Record<string, Record<string, any>> = {
          'template-developer-hub': {
            id: 'template-developer-hub',
            name: 'Developer Hub Landing (Fortress)',
            visualTheme: 'Dark, high-contrast, technical. Cyan primary accent with violet/emerald/gold support colors. Dense information architecture — 7 sections on one page.',
            colorPalette: {
              accent: { primary: '#00F0FF (cyan)', violet: '#A78BFA', gold: '#FBBF24', green: '#34D399', red: '#FB7185', iris: '#818CF8' },
              surface: { void: '#0A0A0F', 'glass-subtle': 'rgba(255,255,255,0.03)', 'glass-card': 'rgba(255,255,255,0.04)', 'glass-strong': 'rgba(255,255,255,0.08)' },
              text: { primary: '#F5F5F7', secondary: 'rgba(245,245,247,0.5)', tertiary: 'rgba(245,245,247,0.3)', muted: 'rgba(245,245,247,0.2)' },
            },
            typography: { heroTitle: '96px font-extrabold gradient accent', sectionHeader: 'text-3xl md:text-4xl font-bold', monoLabel: '10px JetBrains Mono tracking-[0.2em] uppercase white/20', cardTitle: 'text-sm/base font-bold', cardBody: 'text-xs white/40-50', body: 'Inter', mono: 'JetBrains Mono' },
            structure: ['AppShell', 'SectionHero (Crown + H1 + subtitle + CTAs + EIN)', 'Architecture (4 tetrahedral vertex cards)', 'Products (8-card grid, colored borders)', 'Family (Grandparent agents + children)', 'Agent Mesh (8-card grid with tool counts)', 'Research (6 papers, status badges)', 'CTA (glass-strong panel, 3 buttons)', 'Footer'],
            components: ['AppShell', 'Crown (size lg)', 'SectionHero', 'SectionFeatures', 'Footer', 'glass-card', 'glass-subtle', 'glass-strong', 'btn-primary', 'btn-secondary', 'btn-ghost'],
            tokens: { color: ['--p31-accent', '--p31-accent-violet', '--p31-accent-gold', '--p31-accent-green', '--p31-accent-red'], surface: ['--p31-glass-bg', '--p31-glass-surface', '--p31-glass-border'], animation: ['fadeIn 0.3-0.4s, stagger 0.06-0.1s per card'] },
            rules: ['Density-first: 7 sections, 30+ cards', 'Colored accent borders per card', 'Animated stagger reveal', 'Mono labels for section headers', 'EIN in hero', 'Agent cards show tool counts'],
            sourceFile: 'apps/p31ca/src/pages/index.astro (397 lines)',
            liveUrl: 'https://p31ca.org',
            designMdPath: 'docs/templates/template-developer-hub.md',
          },
          'template-institutional': {
            id: 'template-institutional',
            name: 'Institutional Landing (Garden)',
            visualTheme: 'Clean, trustworthy, editorial. Emerald (green) primary accent for growth and care. Amber secondary for warmth. Generous whitespace, text hierarchy, stats cards for social proof.',
            colorPalette: {
              accent: { primary: '#34D399 (emerald)', amber: '#FBBF24', cyan: '#00F0FF', violet: '#A78BFA' },
              surface: { void: '#0A0A0F', card: 'oklch(18% 0.015 240)', border: 'oklch(28% 0.02 240)' },
              text: { primary: 'oklch(96% 0.005 240)', secondary: 'oklch(75% 0.01 240)', muted: 'oklch(65% 0.01 240)', subtle: 'oklch(45% 0.01 240)' },
            },
            typography: { heroTitle: 'text-4xl md:text-6xl lg:text-7xl font-extrabold', sectionHeader: 'text-2xl md:text-4xl font-bold', stats: 'text-3xl md:text-4xl font-bold font-mono', body: 'text-sm leading-relaxed', buttons: 'px-8 py-3 rounded-full font-semibold text-sm' },
            structure: ['Layout (JSON-LD, canonical)', 'Page wrapper', 'HERO (501c3 badge + H1 + stats + 3 CTAs)', 'MISSION (4 accordion cards)', 'Team + Transparency panels', 'IMPACT (4 stat cards + testimonials)', 'PRODUCTS (4 cards)', 'RESEARCH (3 cards)', 'GET INVOLVED (4 action cards)', 'FINAL CTA (emerald card + 3 buttons)', 'Footer'],
            components: ['Layout', 'Page', 'SectionHero', 'SectionFeatures', 'Footer', 'details (accordion)', 'glass-subtle', 'glass-card'],
            tokens: { color: ['--p31-color-emerald', '--p31-color-amber', '--p31-color-cyan', '--p31-color-violet'], surface: ['--p31-surface-card', '--p31-surface-border'], spacing: ['--p31-space-xs', '--p31-space-xl'], maxWidth: ['--p31-max-width-lg'] },
            rules: ['Trust signals above fold (501c3, EIN, ORCID)', 'Live stats as social proof', 'Mission accordions with progressive disclosure', 'Emerald primary accent only', 'Pill CTAs (rounded-full)', 'No Crown SVG', 'Status badges on products'],
            sourceFile: 'apps/phosphorus31/src/pages/index.astro (363 lines)',
            liveUrl: 'https://phosphorus31.org',
            designMdPath: 'docs/templates/template-institutional.md',
          },
          'template-caregiver': {
            id: 'template-caregiver',
            name: 'Caregiver Companion (PHOS Conversational)',
            visualTheme: 'Minimal, calm, distraction-free. Near-black void background. Only two elements visible: pre-cognitive action chips and a text input bar. No chrome, no navigation, no footer.',
            colorPalette: {
              surface: { base: '#050508 (near-black)', panel: '#12121A', input: 'rgba(255,255,255,0.04)' },
            text: { primary: 'oklch(96% 0.005 240)', secondary: 'oklch(75% 0.01 240)', muted: 'oklch(65% 0.01 240)' },
            accent: { primary: '#A78BFA (violet — calm, non-alarming)' },
            },
            typography: { chips: '12px font-medium', input: '16px (var(--p31-text-base))', messages: '14px', fontFamily: 'Inter' },
            structure: ['ChipBar (5 pre-cognitive action chips, above input)', 'Message canvas (flex: 1, scrollable)', 'Input bar (glass-subtle, sticky bottom, max-width 640px)'],
            components: ['ChipBar (5 chips: Check spoons, Grounding, Log care proof, LOVE balance, Ask anything)', 'Native <input>', 'Native <button>'],
            componentsNOT: ['No Crown', 'No SiteNav', 'No Footer', 'No GlassCard component', 'No SpoonDial'],
            tokens: { surface: ['--p31-void-deep', '--p31-surface', '--p31-glass-surface', '--p31-glass-bg'], text: ['--p31-text-primary', '--p31-text-secondary', '--p31-text-muted'], border: ['--p31-glass-border'], spacing: ['--p31-space-xs', '--p31-space-sm', '--p31-space-md', '--p31-space-lg'], radius: ['--p31-radius-md', '--p31-radius-full'], blur: ['--p31-blur-strong (24px on input bar)'] },
            rules: ['Zero-reading default: no text reading required to start', 'Pre-cognitive chips ABOVE input bar (behavioral upgrade)', 'Exactly 5 chips max (cognitive load research)', 'Auto-focus input on mount', 'Chat-style message bubbles (user right/violet, system left/void)', 'Enter to send (no multiline)', '600ms processing delay', 'Spoon-aware: motion disabled at crisis (spoons 0-1)'],
            crisisMode: 'At spoons 0-1: all motion disabled, ChipBar still visible (fastest path to help), message canvas collapses to 3 messages, processing delay reduced to 0ms',
            sourceFile: 'apps/phos/src/features/conversational/components/ConversationalSurface.tsx (241 lines)',
            liveUrl: 'https://phos.p31ca.org/conversational',
            designMdPath: 'docs/templates/template-caregiver.md',
          },
        };
        const spec = TEMPLATE_SPECS[args.template];
        if (!spec) return { error: `Template not found: "${args.template}". Available: template-developer-hub, template-institutional, template-caregiver`, status: 'error' };

        if (args.returnFormat === 'markdown') {
          const md = generateTemplateMarkdown(spec);
          return { template: spec.id, format: 'markdown', content: md, status: 'ok' };
        }
        return { template: spec, status: 'ok' };
      }

      case 'template_preview': {
        const PREVIEWS: Record<string, { name: string; liveUrl: string; sourceFile: string; designMdPath: string; icon: string; accent: string; sections: number; description: string; layoutHints: string }> = {
          'template-developer-hub': { name: 'Developer Hub Landing', liveUrl: 'https://p31ca.org', sourceFile: 'apps/p31ca/src/pages/index.astro', designMdPath: 'docs/templates/template-developer-hub.md', icon: '🏰', accent: '#00F0FF', sections: 7, description: 'Dark technical hub. Crown hero, 8 product cards, 8 agent mesh cards, 6 research papers, glass CTA panel.', layoutHints: 'Use AppShell + SectionHero + SectionFeatures (4-col) + glass-card for cards. Colored left/right borders per card. Staggered fadeIn animation. Mono section labels.' },
          'template-institutional': { name: 'Institutional Landing', liveUrl: 'https://phosphorus31.org', sourceFile: 'apps/phosphorus31/src/pages/index.astro', designMdPath: 'docs/templates/template-institutional.md', icon: '🌿', accent: '#34D399', sections: 7, description: 'Emerald nonprofit landing. 501c3 badge, 4 live stats, mission accordions, testimonials, 3 CTAs.', layoutHints: 'Use Layout + Page + SectionHero + SectionFeatures. Emerald primary accent. Pill-shaped CTAs (rounded-full). <details> accordions for mission. Surface-card backgrounds.' },
          'template-caregiver': { name: 'Caregiver Companion', liveUrl: 'https://phos.p31ca.org/conversational', sourceFile: 'apps/phos/src/features/conversational/components/ConversationalSurface.tsx', designMdPath: 'docs/templates/template-caregiver.md', icon: '💬', accent: '#A78BFA', sections: 1, description: 'Minimal chat surface. 5 pre-cognitive chips above input bar. Void-deep background. No chrome, no nav, no footer.', layoutHints: 'Use void-deep background, flex-column layout. ChipBar above input bar. Glass-subtle input at bottom. Chat bubble messages. Violet accent for chips. Auto-focus input on mount.' },
        };
        const preview = PREVIEWS[args.template];
        if (!preview) return { error: `Template not found: "${args.template}"`, status: 'error' };
        return { preview, status: 'ok' };
      }

      case 'audit_icons': {
        const result = auditIcons(icons, iconCatalog);
        return { ...result, status: 'ok' };
      }

      case 'scan_ui': {
        const { html } = args as { html: string };
        const result = scanUI(html);
        return { html: result, status: 'ok' };
      }

       case 'toggleDrawer': {
         const result = await handleToggleDrawer(args as { state: 'open' | 'closed', target: string, surfaceId?: string, userId?: string });
         return { ...result, status: 'ok' };
       }

       case 'navigate': {
         const result = await handleNavigate(args as { href: string, external?: boolean, surfaceId?: string, userId?: string });
         return { ...result, status: 'ok' };
       }

       case 'setSpoonLevel': {
         const result = await handleSetSpoonLevel(args as { level: number, surfaceId?: string, userId?: string });
         return { ...result, status: 'ok' };
       }

       case 'list_skills': {
         const skills = Object.entries(SKILLS).map(([name, skill]) => ({
           name,
           title: skill.title,
           has_evals: skill.has_evals,
         }));
         return { skills, total: skills.length, status: 'ok' };
       }

       case 'get_skill': {
         const skillName = String(args.name || '');
         const skill = SKILLS[skillName];
         if (!skill) return { error: `Skill not found: "${skillName}"`, status: 'error' };
         return { name: skillName, body: skill.body, status: 'ok' };
       }

      default:
        return { error: `Unknown tool: ${name}`, status: 'error' };
   }
  }

// ─── Markdown formatter for template specs ─────────────────────────────────

function generateTemplateMarkdown(spec: Record<string, any>): string {
  const lines: string[] = [];
  lines.push(`# ${spec.name}`);
  lines.push('');
  lines.push(`> ${spec.visualTheme}`);
  lines.push('');

  if (spec.colorPalette) {
    lines.push('## Color Palette');
    lines.push('');
    for (const [group, colors] of Object.entries(spec.colorPalette as Record<string, any>)) {
      lines.push(`### ${group.charAt(0).toUpperCase() + group.slice(1)}`);
      for (const [name, value] of Object.entries(colors as Record<string, string>)) {
        lines.push(`- **${name}:** \`${value}\``);
      }
      lines.push('');
    }
  }

  if (spec.typography) {
    lines.push('## Typography');
    lines.push('');
    for (const [role, value] of Object.entries(spec.typography as Record<string, string>)) {
      lines.push(`- **${role}:** ${value}`);
    }
    lines.push('');
  }

  if (spec.structure) {
    lines.push('## Layout Structure');
    lines.push('');
    (spec.structure as string[]).forEach((s: string) => lines.push(`1. ${s}`));
    lines.push('');
  }

  if (spec.components) {
    lines.push('## Components Used');
    lines.push('');
    (spec.components as string[]).forEach((c: string) => lines.push(`- \`${c}\``));
    lines.push('');
  }

  if (spec.componentsNOT) {
    lines.push('## Components NOT Used');
    lines.push('');
    (spec.componentsNOT as string[]).forEach((c: string) => lines.push(`- ${c}`));
    lines.push('');
  }

  if (spec.tokens) {
    lines.push('## Design Tokens');
    lines.push('');
    for (const [group, tokens] of Object.entries(spec.tokens as Record<string, any>)) {
      lines.push(`### ${group.charAt(0).toUpperCase() + group.slice(1)}`);
      (tokens as string[]).forEach((t: string) => lines.push(`- \`${t}\``));
      lines.push('');
    }
  }

  if (spec.rules) {
    lines.push('## Behavioral Rules');
    lines.push('');
    (spec.rules as string[]).forEach((r: string) => lines.push(`- ${r}`));
    lines.push('');
  }

  if (spec.crisisMode) {
    lines.push('## Crisis Mode');
    lines.push('');
    lines.push(spec.crisisMode);
    lines.push('');
  }

  lines.push('## Source');
  lines.push('');
  lines.push(`- **File:** ${spec.sourceFile}`);
  lines.push(`- **Live:** ${spec.liveUrl}`);
  lines.push(`- **DESIGN.md:** ${spec.designMdPath}`);

  return lines.join('\n');
}

// ─── HTTP handler (Streamable HTTP) ─────────────────────────────────────────

function mcpResponse(id: any, result: any) {
  return new Response(JSON.stringify({ jsonrpc: '2.0', id, ...metaEnvelope(), result }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

function mcpError(id: any, code: number, message: string) {
  return new Response(JSON.stringify({ jsonrpc: '2.0', id, ...metaEnvelope(), error: { code, message } }), {
    status: 400,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);

  // CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  // Health check
  if (request.method === 'GET' && url.pathname === '/health') {
    return new Response(JSON.stringify({ status: 'healthy', components: Object.keys(COMP_LIST).length, tools: TOOLS.length }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  // ─── Component Generation Capacitor Cache ────────────────────────────────
  // In-memory Map with TTL. For production, swap to KV via wrangler binding.
  const _cacheStore = new Map<string, { ts: number; ttl: number }>();
  function _cacheGet(key: string): boolean {
    const entry = _cacheStore.get(key);
    if (!entry) return false;
    if (Date.now() > entry.ts + entry.ttl) {
      _cacheStore.delete(key);
      return false;
    }
    return true;
  }
  function _cacheSet(key: string, ttlMs = 60_000) {
    _cacheStore.set(key, { ts: Date.now(), ttl: ttlMs });
  }

  // GET /api/cache/check?key=<sha256-hash>
  if (request.method === 'GET' && url.pathname === '/api/cache/check') {
    const key = url.searchParams.get('key') || '';
    const hit = _cacheGet(key);
    return new Response(JSON.stringify({ hit, key }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  // POST /api/cache/store  body: { key: string, ttl?: number }
  if (request.method === 'POST' && url.pathname === '/api/cache/store') {
    try {
      const body = await request.json() as { key: string; ttl?: number };
      _cacheSet(body.key, body.ttl || 60_000);
      return new Response(JSON.stringify({ ok: true, key: body.key, ttl: body.ttl || 60_000 }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    } catch {
      return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }
  }

  // Tool listing page (human-friendly)
  if (request.method === 'GET' && url.pathname === '/') {
    const toolList = TOOLS.map(t => `  <li><strong>${t.name}</strong> — ${t.description}</li>`).join('\n');
    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>P31 Design System MCP</title><style>body{font-family:system-ui,sans-serif;background:#0A0A0F;color:#F5F5F7;max-width:800px;margin:60px auto;padding:0 24px;}h1{color:#00F0FF;}pre{background:rgba(255,255,255,0.04);padding:12px;border-radius:8px;overflow-x:auto;}code{font-family:monospace;color:#A78BFA;}li{margin:8px 0;}</style></head><body><h1>P31 Design System MCP</h1><p>Streamable HTTP endpoint. Send JSON-RPC requests via POST.</p><h2>Tools (${TOOLS.length})</h2><ul>${toolList}</ul><h2>Example</h2><pre><code>curl -X POST ${url.origin}/ \\\\\n  -H "Content-Type: application/json" \\\\\n  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"token_resolve","arguments":{"path":"semantic.color.accent.default"}}}'</code></pre><p style="color:rgba(245,245,247,0.3);margin-top:40px;font-size:12px;">P31 Labs &middot; Sovereign Design System &middot; ${new Date().toISOString()}</p></body></html>`;
    return new Response(html, { headers: { 'Content-Type': 'text/html' } });
  }

  // POST — MCP JSON-RPC
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: { 'Allow': 'POST, GET, OPTIONS' } });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return mcpError(null, -32700, 'Parse error');
  }

  const { id, method, params } = body || {};

  const meta = extractMeta(body);

  switch (method) {
    case 'server/discover':
      return mcpResponse(id, {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: {}, resources: {}, prompts: {} },
        serverInfo: { name: 'p31-design-system', version: '1.0.0' },
      });

    case 'resources/list':
      return mcpResponse(id, {
        resources: [
          { uri: 'design://tokens', name: 'Design Tokens', description: 'P31 design tokens (DTCG 2.0). Append /path for a specific token.', mimeType: 'application/json' },
          { uri: 'design://components', name: 'Component Registry', description: 'P31 component definitions with props, slots, and tokens.', mimeType: 'application/json' },
          { uri: 'design://icons', name: 'Icon Catalog', description: 'P31 icon pack manifest (regular + advanced). Append /id for a single icon.', mimeType: 'application/json' },
        ],
      });

    case 'resources/read': {
      const uri = params?.uri || '';
      if (uri === 'design://tokens' || uri.startsWith('design://tokens/')) {
        const pathStr = uri.replace('design://tokens/', '').replace('design://tokens', '');
        if (pathStr) {
          const value = dt(pathStr);
          return mcpResponse(id, { contents: [{ uri, mimeType: 'application/json', text: value !== undefined ? JSON.stringify(value, null, 2) : 'null' }] });
        } else {
          const topLevel = Object.keys(tokens).filter(k => !k.startsWith('$') && k !== 'version' && k !== 'metadata');
          return mcpResponse(id, { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify({ version: tokens.version, metadata: tokens.metadata, sections: topLevel }, null, 2) }] });
        }
      } else if (uri === 'design://components' || uri.startsWith('design://components/')) {
        const name = uri.replace('design://components/', '').replace('design://components', '');
        if (name) {
          const comp = getComponent(name);
          if (!comp) return mcpError(id, -32602, `Component not found: ${name}`);
          return mcpResponse(id, { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(comp, null, 2) }] });
        } else {
          const summaries = Object.keys(COMP_LIST).map(k => {
            const c = COMP_LIST[k] as CompDef;
            return { name: k, description: c.description, css_class: c.css_class };
          });
          return mcpResponse(id, { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify({ total: summaries.length, components: summaries }, null, 2) }] });
        }
      } else if (uri === 'design://icons' || uri.startsWith('design://icons/')) {
        const name = uri.replace('design://icons/', '').replace('design://icons', '');
        if (name) {
          const entry = iconCatalog[name];
          if (!entry) return mcpError(id, -32602, `Icon not found: ${name}`);
          return mcpResponse(id, { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify({ id: name, ...entry }, null, 2) }] });
        }
        return mcpResponse(id, { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify({ total: icons.length, icons }, null, 2) }] });
      } else if (uri === 'p31://skills') {
       } else if (uri === 'p31://skills') {
         const skills = Object.entries(SKILLS).map(([name, skill]) => ({ name, title: skill.title }));
         return mcpResponse(id, { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify({ skills }, null, 2) }] });
       } else if (uri.startsWith('p31://skills/')) {
         const skillName = uri.replace('p31://skills/', '');
         const skill = SKILLS[skillName];
         if (!skill) return mcpError(id, -32602, `Skill not found: ${skillName}`);
         return mcpResponse(id, { contents: [{ uri, mimeType: 'text/markdown', text: skill.body }] });
       }
      return mcpError(id, -32602, `Unknown resource URI: ${uri}`);
    }

    case 'prompts/list':
      return mcpResponse(id, {
        prompts: [
          { name: 'generate_landing_page', description: 'Generate a landing page layout with hero section, product grid, and CTA block.' },
          { name: 'generate_product_grid', description: 'Generate a responsive card grid of products.' },
          { name: 'generate_research_page', description: 'Generate a card grid of research papers.' },
        ],
      });

    case 'prompts/get': {
      const promptName = params?.name;
      if (promptName === 'generate_landing_page') {
        const msg = 'Generate a landing page layout using P31 design system components. Call layout_generate twice: (1) "hero" layout with title, subtitle, cta buttons, and stats (format: "a2ui"), (2) "card-grid" layout with products as GlassCard items. Rotate accent colors: cyan, violet, gold, green.';
        return mcpResponse(id, { description: 'Generate a landing page layout', messages: [{ role: 'user', content: { type: 'text', text: msg } }] });
      } else if (promptName === 'generate_product_grid') {
        const msg = 'Generate a responsive card grid with layout_generate: type="card-grid", format="a2ui", heading, columns (default 3), items as GlassCard objects. Use accent colors for visual variety.';
        return mcpResponse(id, { description: 'Generate a product grid', messages: [{ role: 'user', content: { type: 'text', text: msg } }] });
      } else if (promptName === 'generate_research_page') {
        const msg = 'Generate a research page with layout_generate: type="card-grid", format="a2ui", items as GlassCard objects with title, description, color, href. Published=green, In-review=gold, Preprint=violet.';
        return mcpResponse(id, { description: 'Generate a research page', messages: [{ role: 'user', content: { type: 'text', text: msg } }] });
      }
      return mcpError(id, -32602, `Prompt not found: ${promptName}`);
    }

    case 'tools/list':
      return mcpResponse(id, { tools: TOOLS });

    case 'tools/call': {
      const toolName = params?.name;
      const toolArgs = params?.arguments || {};
      const tool = TOOLS.find(t => t.name === toolName);
      if (!tool) return mcpError(id, -32602, `Unknown tool: ${toolName}`);
      try {
        const result = await executeTool(toolName, toolArgs);
        return mcpResponse(id, { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] });
      } catch (e: any) {
        return mcpResponse(id, {
          content: [{ type: 'text', text: JSON.stringify({ error: e.message, status: 'error' }) }],
          isError: true,
        });
      }
    }

    case 'ping':
      return mcpResponse(id, {});

    default:
      if (id !== undefined) return mcpError(id, -32601, `Method not found: ${method}`);
      return new Response(null, { status: 204 });
  }
}

export default {
  async fetch(request: Request): Promise<Response> {
    return handleRequest(request);
  },
};
