#!/usr/bin/env node

// ═════════════════════════════════════════════════════════════════════════════
// P31 Component Registry MCP Server
// Exposes PHOS design system components via Model Context Protocol
// Agents query this to get correct-by-construction component code
// ═════════════════════════════════════════════════════════════════════════════

const { designTokens } = require('./design-tokens-registry');

// ─── Component Registry ──────────────────────────────────────────────────────

const COMPONENTS = [
  {
    name: 'GlassPanel',
    description: 'Glassmorphic elevated surface with backdrop blur. Use for cards, modals, drawers.',
    tokens: ['glass-surface', 'glass-border', 'rounded.lg'],
    props: {
      children: { type: 'ReactNode', required: true },
      className: { type: 'string', required: false },
      hover: { type: 'boolean', default: false, description: 'Enable hover lift effect' },
    },
    css: `background: ${designTokens.colors['glass-surface']};
backdrop-filter: blur(12px);
-webkit-backdrop-filter: blur(12px);
border: 1px solid ${designTokens.colors['glass-border']};
border-radius: ${designTokens.rounded.lg};
box-shadow: 0 8px 32px rgba(0,0,0,0.15);
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);`,
    example: `<div className="phos-glass rounded-3xl p-6">
  {children}
</div>`,
  },
  {
    name: 'GlassCard',
    description: 'Compact glassmorphic card with padding. Use for list items, data tiles.',
    tokens: ['glass-surface', 'glass-border', 'rounded.lg', 'spacing.lg'],
    props: {
      children: { type: 'ReactNode', required: true },
      className: { type: 'string', required: false },
    },
    css: `background: ${designTokens.colors['glass-surface']};
backdrop-filter: blur(12px);
border: 1px solid ${designTokens.colors['glass-border']};
border-radius: ${designTokens.rounded.lg};
padding: ${designTokens.spacing.lg};
box-shadow: 0 8px 32px rgba(0,0,0,0.15);`,
    example: `<div className="phos-glass-card">
  <p className="text-[var(--phos-text)]">{content}</p>
</div>`,
  },
  {
    name: 'PillButton',
    description: 'Rounded pill-shaped button. Use for mode switches, toggles, actions.',
    tokens: ['quantum-cyan', 'rounded.md', 'spacing.sm', 'spacing.lg'],
    props: {
      children: { type: 'ReactNode', required: true },
      active: { type: 'boolean', default: false },
      onClick: { type: '() => void', required: true },
      variant: { type: "'primary' | 'secondary' | 'ghost'", default: 'primary' },
    },
    css: {
      primary: `background: ${designTokens.colors['quantum-cyan']};
color: ${designTokens.colors.void};
font-weight: 700;
padding: ${designTokens.spacing.sm} ${designTokens.spacing.lg};
border-radius: ${designTokens.rounded.md};
transition: all 0.2s ease;
box-shadow: 0 4px 16px rgba(0,240,255,0.2);`,
      secondary: `background: rgba(167,139,250,0.1);
color: ${designTokens.colors['quantum-violet']};
font-weight: 700;
border: 1px solid rgba(167,139,250,0.3);
border-radius: ${designTokens.rounded.md};`,
      ghost: `background: rgba(255,255,255,0.05);
color: ${designTokens.colors['text-secondary']};
font-weight: 700;
border: 1px solid rgba(255,255,255,0.1);
border-radius: ${designTokens.rounded.md};`,
    },
    example: `<button className="px-4 py-2 rounded-xl bg-[var(--phos-primary)] text-[var(--phos-bg)] font-bold
  hover:translate-y-[-2px] transition-all duration-200 shadow-[0_4px_16px_rgba(0,240,255,0.2)]">
  {label}
</button>`,
  },
  {
    name: 'SpoonDots',
    description: 'Energy level indicator dots (0–5). Use in headers for spoon state display.',
    tokens: ['quantum-cyan', 'void'],
    props: {
      level: { type: '0 | 1 | 2 | 3 | 4 | 5', required: true },
      onSet: { type: '(level: number) => void', required: true },
    },
    example: '<div className="flex gap-2">\n  {[0,1,2,3,4,5].map(sp => (\n    <button key={sp} onClick={() => onSet(sp)}\n      className="w-2.5 h-2.5 rounded-full transition-all duration-500"\n      style={{\n        backgroundColor: level >= sp ? \'var(--phos-primary)\' : \'rgba(255,255,255,0.1)\',\n        boxShadow: level >= sp && level > 0 ? \'0 0 6px var(--phos-primary)\' : \'none\',\n      }}\n      aria-label={"Energy level " + sp} />\n  ))}\n</div>',
  },
  {
    name: 'CrisisOverlay',
    description: 'Full-screen crisis mode overlay. ONLY rendered at spoons === 0. Hard invariant: no other UI chrome.',
    tokens: ['void', 'quantum-cyan'],
    props: {
      onExit: { type: '() => void', required: true, description: 'Resets spoons to 3' },
    },
    invariant: 'At spoons === 0, CrisisMode is the ONLY rendered component. No sidebar, no prompt bar, no navigation.',
    example: `{spoons === 0 && <CrisisMode onExit={() => spoonsStore.set(3)} />}`,
  },
  {
    name: 'Sidebar',
    description: 'Vertical icon sidebar for surface navigation. Hidden on mobile.',
    tokens: ['glass-surface', 'glass-border'],
    props: {
      surfaces: { type: 'SurfaceNavItem[]', required: true },
      active: { type: 'string', required: true },
      onSelect: { type: '(id: string) => void', required: true },
      spoons: { type: 'number', required: true },
    },
    example: `<div className="w-16 md:w-20 z-30 flex-shrink-0 border-r border-white/5 bg-black/20 backdrop-blur-md">
  <PHOSSidebar surfaces={SURFACE_NAV} active={cs} onSelect={ss} spoons={s} />
</div>`,
  },
  {
    name: 'PromptBar',
    description: 'Chat input bar with send button. Use for message composition.',
    tokens: ['glass-surface', 'quantum-cyan', 'rounded.md'],
    props: {
      onSend: { type: '(text: string) => void', required: true },
      disabled: { type: 'boolean', default: false },
    },
    example: `<PHOSPromptBar onSend={handleSend} disabled={s === 0} />`,
  },
  {
    name: 'SurfaceContent',
    description: 'Dynamic surface renderer. Routes to the correct surface component by ID.',
    tokens: [],
    props: {
      currentSurface: { type: 'string', required: true },
      setSurface: { type: '(id: string) => void', required: true },
      spoons: { type: 'number', required: true },
      theme: { type: 'object', required: true },
      isGuest: { type: 'boolean', required: true },
    },
    example: `<SurfaceContent currentSurface={cs} setSurface={ss} spoons={s} theme={theme} isGuest={false} />`,
  },
];

// ─── Design Token Reference ──────────────────────────────────────────────────

const TOKEN_REFERENCE = {
  colors: designTokens.colors,
  typography: {
    sans: designTokens.typography.sans,
    mono: designTokens.typography.mono,
  },
  rounded: designTokens.rounded,
  spacing: designTokens.spacing,
  invariants: [
    'Never use pure white (#FFFFFF) or pure black (#000000)',
    'Primary accent is quantum-cyan (#00F0FF)',
    'All glass surfaces require backdrop-filter: blur(12px)',
    'Border radius for elevated surfaces: 24px (rounded.lg)',
    'Crisis mode (spoons=0): no UI chrome, only breathing overlay',
    'Motion disabled at spoons 0-1, slowed at 2, baseline at 3, accelerated at 4-5',
  ],
};

// ─── Tool Definitions ────────────────────────────────────────────────────────

const TOOLS = [
  {
    name: 'design_list_components',
    description: 'List all available PHOS design system components with their descriptions.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'design_get_component',
    description: 'Get full component details: props, tokens, CSS, and usage example.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Component name (e.g. GlassPanel, CrisisOverlay)' },
      },
      required: ['name'],
    },
  },
  {
    name: 'design_get_tokens',
    description: 'Get all design system tokens (colors, typography, spacing, rounding) and invariants.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'design_search',
    description: 'Search components by keyword or token usage.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search term (e.g. "glass", "button", "crisis")' },
      },
      required: ['query'],
    },
  },
  {
    name: 'design_spoon_guide',
    description: 'Get spoon-level behavior guide — how the UI adapts at each energy level (0-5).',
    inputSchema: { type: 'object', properties: {} },
  },
];

// ─── Tool Execution ──────────────────────────────────────────────────────────

function executeTool(name, args) {
  switch (name) {
    case 'design_list_components':
      return {
        components: COMPONENTS.map(c => ({
          name: c.name,
          description: c.description,
          tokens: c.tokens,
        })),
        total: COMPONENTS.length,
        status: 'ok',
      };

    case 'design_get_component': {
      const comp = COMPONENTS.find(c => c.name.toLowerCase() === (args.name || '').toLowerCase());
      if (!comp) {
        const available = COMPONENTS.map(c => c.name).join(', ');
        return { error: `Unknown component "${args.name}". Available: ${available}`, status: 'error' };
      }
      return { component: comp, status: 'ok' };
    }

    case 'design_get_tokens':
      return { tokens: TOKEN_REFERENCE, status: 'ok' };

    case 'design_search': {
      const q = (args.query || '').toLowerCase();
      const results = COMPONENTS.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.tokens.some(t => t.includes(q))
      );
      return {
        query: args.query,
        results: results.map(c => ({ name: c.name, description: c.description, tokens: c.tokens })),
        total: results.length,
        status: 'ok',
      };
    }

    case 'design_spoon_guide':
      return {
        spoonGuide: {
          0: 'CRISIS: No UI chrome. Only breathing overlay + exit button. No interactive elements.',
          1: 'LOW: Minimal UI. Single-action buttons only. Large touch targets. No multi-step flows.',
          2: 'RECOVERING: Simple cards. One action per view. Generous spacing. No time pressure.',
          3: 'BASELINE: Standard glass panels. Balanced density. Normal interaction patterns.',
          4: 'ENERGIZED: Dense layouts welcome. Multi-step workflows. Detailed information display.',
          5: 'HIGH ENERGY: Full complexity. Parallel workflows. Dense data, many actions.',
        },
        cssAttribute: 'data-spoons="{0-5}" on <html>',
        motionScaling: '0-1: disabled, 2: slowed (1.5x duration), 3: baseline, 4-5: accelerated (0.75x duration)',
        status: 'ok',
      };

    default:
      return { error: `Unknown tool: ${name}`, status: 'error' };
  }
}

// ─── JSON-RPC over stdio ─────────────────────────────────────────────────────

let buffer = '';

process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  buffer += chunk;
  const lines = buffer.split('\n');
  buffer = lines.pop();

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const req = JSON.parse(trimmed);
      handleRequest(req);
    } catch (e) { /* ignore malformed */ }
  }
});

function handleRequest(req) {
  const { id, method, params } = req;

  switch (method) {
    case 'initialize':
      respond(id, {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: 'p31-component-registry', version: '1.0.0' },
      });
      break;

    case 'notifications/initialized':
      break;

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
        const result = executeTool(toolName, toolArgs);
        respond(id, { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] });
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

process.stderr.write('[p31-component-registry] Server started. Listening on stdin (JSON-RPC).\n');
