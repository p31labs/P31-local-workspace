#!/usr/bin/env node
/**
 * P31 Design System MCP Server
 * Exposes design tokens, component schemas, and usage data via MCP stdio JSON-RPC.
 *
 * Tools:
 *   token_resolve(path)     → resolve DTCG path to value
 *   component_schema(name)  → get full component definition
 *   component_usage(name)   → list which HTML pages use a component
 *
 * Usage: node cli/design-mcp-server.js
 */

const yaml = require('yaml');
const fs = require('fs');
const path = require('path');

const { renderLayout } = require('./tokens/shared/layout');

// ─── Load tokens ─────────────────────────────────────────────────────────────

const ROOT = path.resolve(__dirname, '..');
const tokensFile = path.join(__dirname, 'tokens', 'tokens.yml');
const tokens = yaml.parse(fs.readFileSync(tokensFile, 'utf8'));

// ─── Token resolver (same as component-registry.js) ──────────────────────────

function dt(pathStr) {
  const parts = pathStr.split('.');
  let node = tokens;
  for (const part of parts) {
    if (node == null || typeof node !== 'object') return undefined;
    node = node[part];
  }
  return (node != null && typeof node === 'object' && node['$value'] != null)
    ? node['$value']
    : node;
}

function resolveReferences(value, seen = new Set()) {
  if (typeof value !== 'string') return value;
  return value.replace(/\{([^}]+)\}/g, (_, ref) => {
    if (seen.has(ref)) throw new Error(`Circular reference: ${ref}`);
    seen.add(ref);
    const resolved = dt(ref);
    if (resolved === undefined) throw new Error(`Unresolved reference: ${ref}`);
    return resolveReferences(resolved, seen);
  });
}

function tokenResolve(pathStr) {
  const raw = dt(pathStr);
  if (raw === undefined) return null;
  return resolveReferences(raw);
}

// ─── Flatten token tree for listings ─────────────────────────────────────────

function flattenTokens(node, prefix = '') {
  const result = {};
  if (typeof node === 'object' && node !== null) {
    if (node['$value'] !== undefined) {
      result[prefix || 'value'] = {
        value: node['$value'],
        type: node['$type'] || 'string',
        description: node['$description'] || '',
      };
    } else {
      for (const key of Object.keys(node)) {
        if (key.startsWith('$')) continue;
        const childPrefix = prefix ? `${prefix}.${key}` : key;
        Object.assign(result, flattenTokens(node[key], childPrefix));
      }
    }
  }
  return result;
}

// ─── Component definitions ───────────────────────────────────────────────────

const COMPONENTS = [];

function loadComponents() {
  const compFile = path.join(__dirname, 'tokens', 'components.yml');
  if (!fs.existsSync(compFile)) return;
  const comps = yaml.parse(fs.readFileSync(compFile, 'utf8'));
  for (const [name, c] of Object.entries(comps.components || {})) {
    const props = {};
    if (c.props) {
      for (const [pname, pdef] of Object.entries(c.props)) {
        props[pname] = {
          type: pdef.type || 'string',
          default: pdef.default,
        };
        if (pdef.options) props[pname].options = pdef.options;
        if (pdef.range) props[pname].range = pdef.range;
      }
    }
    COMPONENTS.push({
      name,
      description: c.description,
      css_class: c.css_class,
      variants: c.variants || [],
      props,
      slots: c.slots || [],
      tokens: c.tokens || [],
    });
  }
}

loadComponents();

// ─── Component usage scan ────────────────────────────────────────────────────

const HTML_PATHS = [
  path.join(ROOT, 'apps', 'p31ca', 'index.html'),
  path.join(ROOT, 'apps', 'phosphorus31', 'index.html'),
];

function scanComponentUsage() {
  const usage = {};
  for (const comp of COMPONENTS) {
    const classes = [comp.css_class, ...(comp.variants || [])].filter(Boolean);
    const pages = [];
    for (const htmlPath of HTML_PATHS) {
      if (!fs.existsSync(htmlPath)) continue;
      const content = fs.readFileSync(htmlPath, 'utf8');
      if (classes.some(cls => content.includes(`class="${cls}"`) || content.includes(`class='${cls}'`))) {
        pages.push(path.relative(ROOT, htmlPath));
      }
    }
    usage[comp.name] = { pages, total: pages.length };
  }
  return usage;
}

// ─── MCP Tools ───────────────────────────────────────────────────────────────

const TOOLS = [
  {
    name: 'token_resolve',
    description: 'Resolve a DTCG token path to its computed value. Use dotted paths like "semantic.color.accent.default" or "primitive.color.cyan". Returns value, type, and resolved references.',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Dotted token path (e.g. primitive.color.cyan, semantic.color.accent.default, component.glass_card.background)' },
      },
      required: ['path'],
    },
  },
  {
    name: 'component_schema',
    description: 'Get the full schema for a component: description, props, slots, CSS class, tokens used, and variants.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Component name (e.g. GlassCard, Button, SpoonMeter)' },
      },
      required: ['name'],
    },
  },
  {
    name: 'component_usage',
    description: 'Find which sovereign HTML pages use a given component. Returns page paths and count.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Component name (e.g. GlassCard, Button). Omit for all components.' },
      },
    },
  },
  {
    name: 'token_list',
    description: 'List all available token paths with their values and types. Useful for discovery.',
    inputSchema: {
      type: 'object',
      properties: {
        prefix: { type: 'string', description: 'Optional filter prefix (e.g. "primitive.color", "semantic", "component")' },
      },
    },
  },
  {
    name: 'layout_generate',
    description: 'Generate sovereign HTML layout from a JSON description. Supports hero, tetra-grid, card-grid, section, and cta layout types using P31 glass components. Set format: "a2ui" for A2UI JSON output.',
    inputSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['hero', 'tetra-grid', 'card-grid', 'section', 'cta'], description: 'Layout type to render.' },
        format: { type: 'string', enum: ['html', 'a2ui'], description: 'Output format. Default "html". Set "a2ui" for JSON component tree.' },
        title: { type: 'string', description: 'Main heading (hero, section).' },
        subtitle: { type: 'string', description: 'Subtitle text (hero).' },
        heading: { type: 'string', description: 'Section heading (card-grid, section, cta).' },
        description: { type: 'string', description: 'Section description (card-grid, section, cta).' },
        columns: { type: 'number', description: 'Number of grid columns (card-grid).' },
        badge: { type: 'string', description: 'Badge text (hero, e.g. "501(c)(3) Nonprofit").' },
        content: { type: 'string', description: 'Raw HTML content (section).' },
        ctas: { type: 'array', description: 'Array of button objects: {label, href, variant: "primary"|"secondary"|"ghost"} (hero).' },
        stats: { type: 'array', description: 'Array of stat objects: {value, label} (hero).' },
        buttons: { type: 'array', description: 'Array of button objects: {label, href, variant} (cta).' },
        items: { type: 'array', description: 'Array of {component: "GlassCard", props: {color, title, description, href}} (tetra-grid, card-grid).' },
      },
      required: ['type'],
    },
  },
  {
    name: 'validate_component',
    description: 'Validate a component or template code against P31 spatial rules. Ports logic from spatialValidator.mjs. Returns violations, warnings, and passed checks.',
    inputSchema: {
      type: 'object',
      properties: {
        code: { type: 'string', description: 'Raw CSS/JSX/HTML code string to validate.' },
        type: { type: 'string', enum: ['component', 'template'], description: 'Whether the code is a component (internal styling only) or template (external spacing allowed).' },
      },
      required: ['code', 'type'],
    },
  },
  {
    name: 'audit_tokens',
    description: 'Audit the design token tree for orphans, dead references, and missing values. Defaults to cli/tokens/tokens.yml.',
    inputSchema: {
      type: 'object',
      properties: {
        tokensPath: { type: 'string', description: 'Path to tokens YAML file. Defaults to cli/tokens/tokens.yml.' },
      },
    },
  },
  {
    name: 'suggest_fix',
    description: 'Suggest a fix for a common design-system violation. Pattern-matches margin, height, and position violations.',
    inputSchema: {
      type: 'object',
      properties: {
        violation: { type: 'string', description: 'The violation message or offending CSS property line (e.g. "margin: 16px" or "position: relative").' },
        code: { type: 'string', description: 'The full code snippet to apply the fix to.' },
      },
      required: ['violation', 'code'],
    },
  },
];

// ─── Tool execution ──────────────────────────────────────────────────────────

function executeTool(name, args) {
  switch (name) {
    case 'token_resolve': {
      const value = tokenResolve(args.path);
      if (value === null) return { error: `Token path not found: "${args.path}"`, status: 'error' };
      const raw = dt(args.path);
      return {
        path: args.path,
        value: String(value),
        raw: raw && raw['$value'] != null ? raw : value,
        type: (raw && raw['$type']) || typeof value,
        resolved: value !== String(raw),
        status: 'ok',
      };
    }

    case 'component_schema': {
      const comp = COMPONENTS.find(c => c.name.toLowerCase() === (args.name || '').toLowerCase());
      if (!comp) {
        const available = COMPONENTS.map(c => c.name).join(', ');
        return { error: `Unknown component "${args.name}". Available: ${available}`, status: 'error' };
      }
      const resolvedTokens = {};
      for (const t of comp.tokens) {
        try { resolvedTokens[t] = tokenResolve(t); } catch {}
      }
      return {
        component: { ...comp, resolved_tokens: resolvedTokens },
        status: 'ok',
      };
    }

    case 'component_usage': {
      const usage = scanComponentUsage();
      if (args.name) {
        const compName = COMPONENTS.find(c => c.name.toLowerCase() === args.name.toLowerCase());
        if (!compName) {
          const available = COMPONENTS.map(c => c.name).join(', ');
          return { error: `Unknown component "${args.name}". Available: ${available}`, status: 'error' };
        }
        return { name: compName.name, usage: usage[compName.name], status: 'ok' };
      }
      return { components: usage, status: 'ok' };
    }

    case 'token_list': {
      const all = flattenTokens(tokens);
      if (args.prefix) {
        const filtered = {};
        for (const [k, v] of Object.entries(all)) {
          if (k.startsWith(args.prefix)) filtered[k] = v;
        }
        return { tokens: filtered, total: Object.keys(filtered).length, status: 'ok' };
      }
      return { tokens: all, total: Object.keys(all).length, status: 'ok' };
    }

    case 'layout_generate': {
      const result = renderLayout(args);
      if (args.format === 'a2ui') return { a2ui: result, status: 'ok' };
      return { html: result, status: 'ok' };
    }

    case 'validate_component': {
      const code = args.code || '';
      const type = args.type || 'component';
      const parsed = yaml.parse(fs.readFileSync(tokensFile, 'utf8'));
      const forbidden = parsed.spacing_rules?.component_forbidden_properties || [];
      const violations = [];
      const warnings = [];
      const passed = [];

      if (type === 'component') {
        const styleRegex = /([a-zA-Z-]+)\s*:\s*([^;}\n]+)/g;
        let match;
        while ((match = styleRegex.exec(code)) !== null) {
          const key = match[1].trim();
          const value = match[2].trim();
          const isForbidden = forbidden.some(rule => {
            if (rule.includes(':')) {
              const [prop, val] = rule.split(':').map(s => s.trim());
              return key === prop && value.includes(val);
            }
            return key === rule;
          });
          if (isForbidden) {
            violations.push(`Forbidden property "${key}: ${value}" in component.`);
          }
        }

        const marginMatches = code.match(/margin[A-Z]?:\s*['"]?-?\d+px['"]?/g) || [];
        const transformMatches = code.match(/transform:\s*['"]?translate[XY]?\([^)]+px\)/g) || [];
        const positionMatches = code.match(/position:\s*['"]?(relative|absolute)/g) || [];
        const topBottomMatches = code.match(/(top|bottom|left|right):\s*['"]?-?\d+px['"]?/g) || [];

        const allHardcoded = [...marginMatches, ...transformMatches, ...positionMatches, ...topBottomMatches];
        if (allHardcoded.length > 0) {
          violations.push(`Generated code contains forbidden spacing: ${allHardcoded.join(', ')}`);
        } else {
          passed.push('No hardcoded external spacing found.');
        }

        if (code.includes('display: inline-block')) {
          warnings.push('Uses display: inline-block (may cause baseline gaps).');
        }
      }

      if (type === 'template') {
        const suspicious = code.match(/margin[A-Z]?:\s*['"]?-?\d+px['"]?/g) || [];
        if (suspicious.length > 0) {
          warnings.push(`Template uses hardcoded margins: ${suspicious.join(', ')}.`);
        }
        passed.push('Template validation complete.');
      }

      return { valid: violations.length === 0, violations, warnings, passed };
    }

    case 'audit_tokens': {
      const tokensPath = args.tokensPath || path.join(__dirname, 'tokens', 'tokens.yml');
      if (!fs.existsSync(tokensPath)) {
        return { error: `Tokens file not found: ${tokensPath}`, valid: false, status: 'error' };
      }
      const parsed = yaml.parse(fs.readFileSync(tokensPath, 'utf8'));

      const primitiveColors = Object.keys(parsed.primitive?.color || {}).length;
      const primitiveSpacing = Object.keys(parsed.primitive?.spacing || {}).length;
      const primitiveRadius = Object.keys(parsed.primitive?.radius || {}).length;
      const primitiveTypography = Object.keys(parsed.primitive?.typography || {}).length;
      const primitiveBlur = Object.keys(parsed.primitive?.blur || {}).length;
      const primitiveShadow = Object.keys(parsed.primitive?.shadow || {}).length;
      const semanticColors = Object.keys(parsed.semantic?.color || {}).length;
      const components = Object.keys(parsed.component || {}).length;
      const boundingBoxes = Object.keys(parsed.bounding_boxes || {}).length;
      const layoutContainers = Object.keys(parsed.layout_containers || {}).length;

      const totalTokens = primitiveColors + primitiveSpacing + primitiveRadius + primitiveTypography + primitiveBlur + primitiveShadow + semanticColors + components + boundingBoxes + layoutContainers;

      const defined = new Set();
      const missingValues = [];

      function walk(node, p) {
        if (!node || typeof node !== 'object') return;
        const keys = Object.keys(node).filter(k => !k.startsWith('$'));
        if (keys.length === 0) return;
        const hasValue = node.$value !== undefined;
        const hasType = node.$type !== undefined;
        if (hasType && !hasValue) {
          missingValues.push(p);
        }
        if (hasValue || hasType) {
          if (p) defined.add(p);
        }
        for (const key of keys) {
          walk(node[key], p ? `${p}.${key}` : key);
        }
      }

      walk(parsed, '');

      const used = new Set();
      for (const comp of Object.values(parsed.component || {})) {
        if (comp.tokens) {
          for (const t of comp.tokens) used.add(t);
        }
      }

      const orphanedTokens = [...defined].filter(t => !used.has(t));
      const deadTokens = [...used].filter(t => !defined.has(t));

      return {
        valid: orphanedTokens.length === 0 && deadTokens.length === 0 && missingValues.length === 0,
        summary: { totalTokens, components, boundingBoxes, layoutContainers, primitiveColors, primitiveSpacing, primitiveRadius, primitiveTypography, primitiveBlur, primitiveShadow, semanticColors },
        orphanedTokens,
        deadTokens,
        missingValues,
        status: 'ok',
      };
    }

    case 'suggest_fix': {
      const violation = args.violation || '';
      const code = args.code || '';
      let suggestion = '';
      let fixedCode = code;

      if (/margin\s*:\s*['"]?-?\d+px['"]?/.test(violation) || /margin[A-Z]?\s*:\s*['"]?-?\d+px['"]?/.test(violation)) {
        suggestion = 'Replace hardcoded margin with template-level spacing (gap or padding).';
        fixedCode = code.replace(/margin\s*:\s*['"]?-?\d+px['"]?/g, 'gap: 16px');
      } else if (/height\s*:\s*56px/.test(violation)) {
        suggestion = 'Use the design token height (48px) or CSS variable var(--p31-header-h).';
        fixedCode = code.replace(/height\s*:\s*56px/g, 'height: 48px');
      } else if (/position\s*:\s*relative/.test(violation)) {
        suggestion = 'Remove position: relative and use template-level spacing instead.';
        fixedCode = code.replace(/position\s*:\s*relative/g, '/* position removed — use template spacing */');
      } else if (/position\s*:\s*absolute/.test(violation)) {
        suggestion = 'Remove position: absolute and use template-level spacing instead.';
        fixedCode = code.replace(/position\s*:\s*absolute/g, '/* position removed — use template spacing */');
      } else if (/transform\s*:\s*translate/.test(violation)) {
        suggestion = 'Remove transform translate hack and use template-level gap/padding.';
        fixedCode = code.replace(/transform\s*:\s*translate[^;]+/g, '/* transform removed — use template spacing */');
      } else if (/(top|bottom)\s*:\s*['"]?-?\d+px['"]?/.test(violation)) {
        suggestion = 'Remove positional offset and use template padding/gap.';
        fixedCode = code.replace(/(top|bottom)\s*:\s*['"]?-?\d+px['"]?/g, '/* $1 removed — use template spacing */');
      } else {
        suggestion = 'No specific fix pattern matched. Review the violation manually.';
      }

      return { suggestion, fixedCode };
    }

    default:
      return { error: `Unknown tool: ${name}`, status: 'error' };
  }
}

// ─── MCP stdio transport ─────────────────────────────────────────────────────

let buffer = '';

process.stdin.on('data', (chunk) => {
  buffer += chunk;
  const lines = buffer.split('\n');
  buffer = lines.pop();
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      handleRequest(JSON.parse(trimmed));
    } catch (_) { /* ignore malformed */ }
  }
});

function handleRequest(req) {
  const { id, method, params } = req;

  switch (method) {
    case 'initialize':
      respond(id, {
        protocolVersion: '2026-07-28',
        capabilities: { tools: {} },
        serverInfo: { name: 'p31-design-system', version: '1.0.0' },
      });
      break;

    case 'notifications/initialized':
      break;

    case 'resources/list':
      respond(id, {
        resources: [
          { uri: 'design://tokens', name: 'Design Tokens', description: 'P31 design tokens (DTCG 2.0). Append /path for a specific token.', mimeType: 'application/json' },
          { uri: 'design://components', name: 'Component Registry', description: 'P31 component definitions with props, slots, and tokens.', mimeType: 'application/json' },
        ],
      });
      break;

    case 'resources/read': {
      const uri = params?.uri || '';
      if (uri === 'design://tokens' || uri.startsWith('design://tokens/')) {
        const pathStr = uri.replace('design://tokens/', '').replace('design://tokens', '');
        if (pathStr) {
          const value = dt(pathStr);
          respond(id, { contents: [{ uri, mimeType: 'application/json', text: value !== undefined ? JSON.stringify(value, null, 2) : 'null' }] });
        } else {
          const topLevel = Object.keys(tokens).filter(k => !k.startsWith('$') && k !== 'version' && k !== 'metadata');
          respond(id, { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify({ version: tokens.version, metadata: tokens.metadata, sections: topLevel }, null, 2) }] });
        }
      } else if (uri === 'design://components' || uri.startsWith('design://components/')) {
        const name = uri.replace('design://components/', '').replace('design://components', '');
        if (name) {
          const comp = COMPONENTS.find(c => c.name.toLowerCase() === name.toLowerCase());
          if (!comp) respondError(id, -32602, `Component not found: ${name}`);
          else respond(id, { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(comp, null, 2) }] });
        } else {
          const summaries = COMPONENTS.map(c => ({ name: c.name, description: c.description, css_class: c.css_class }));
          respond(id, { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify({ total: summaries.length, components: summaries }, null, 2) }] });
        }
      } else {
        respondError(id, -32602, `Unknown resource URI: ${uri}`);
      }
      break;
    }

    case 'prompts/list':
      respond(id, {
        prompts: [
          { name: 'generate_landing_page', description: 'Generate a landing page layout with hero section, product grid, and CTA block.' },
          { name: 'generate_product_grid', description: 'Generate a responsive card grid of products.' },
          { name: 'generate_research_page', description: 'Generate a card grid of research papers.' },
        ],
      });
      break;

    case 'prompts/get': {
      const promptName = params?.name;
      if (promptName === 'generate_landing_page') {
        const msg = `Generate a landing page layout using P31 design system components.

Call layout_generate twice:
1. A "hero" layout with title, subtitle, cta buttons, and stats (use format: "a2ui")
2. A "card-grid" layout with the products as GlassCard items

Map products to: { component: "GlassCard", props: { title: ..., description: ..., color: ..., href: ... } }
Rotate accent colors: cyan, violet, gold, green for visual variety.`;
        respond(id, { description: 'Generate a landing page layout', messages: [{ role: 'user', content: { type: 'text', text: msg } }] });
      } else if (promptName === 'generate_product_grid') {
        const msg = `Generate a responsive card grid of products using P31 design system components.

Call layout_generate with:
  type: "card-grid"
  format: "a2ui"
  heading: the grid heading
  columns: 2-4 (default 3)
  items: array of { component: "GlassCard", props: { title, description, color, href } }

Use accent colors: accent (cyan), violet, gold, green.`;
        respond(id, { description: 'Generate a product grid', messages: [{ role: 'user', content: { type: 'text', text: msg } }] });
      } else if (promptName === 'generate_research_page') {
        const msg = `Generate a research papers page using P31 design system components.

Call layout_generate with:
  type: "card-grid"
  format: "a2ui"
  heading: the section heading
  columns: 2-3
  items: array of { component: "GlassCard", props: { title, description, color, href } }

For status, add a StatusBadge component inside each card description.
Published = green, In-review = gold, Preprint = violet.`;
        respond(id, { description: 'Generate a research page', messages: [{ role: 'user', content: { type: 'text', text: msg } }] });
      } else {
        respondError(id, -32602, `Prompt not found: ${promptName}`);
      }
      break;
    }

    case 'tools/list':
      respond(id, { tools: TOOLS });
      break;

    case 'tools/call': {
      const toolName = params?.name;
      const toolArgs = params?.arguments || {};
      const tool = TOOLS.find(t => t.name === toolName);
      if (!tool) {
        respondError(id, -32602, `Unknown tool: ${toolName}`);
        break;
      }
      try {
        const out = executeTool(toolName, toolArgs);
        respond(id, { content: [{ type: 'text', text: JSON.stringify(out, null, 2) }] });
      } catch (e) {
        respond(id, {
          content: [{ type: 'text', text: JSON.stringify({ error: e.message, status: 'error' }) }],
          isError: true,
        });
      }
      break;
    }

    case 'ping':
      respond(id, {});
      break;

    default:
      if (id !== undefined) respondError(id, -32601, `Method not found: ${method}`);
  }
}

function respond(id, result) {
  process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, result }) + '\n');
}

function respondError(id, code, message) {
  process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, error: { code, message } }) + '\n');
}
