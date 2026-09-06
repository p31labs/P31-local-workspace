/**
 * A2UI v0.9 renderer — maps declarative component JSON to tokenized,
 * WebMCP-annotated P31 HTML.
 *
 * Usage:
 *   import { renderA2UI, type A2UIComponent } from './a2ui-renderer';
 *   const html = renderA2UI(payload, { spoonLevel: 3 });
 */

export interface A2UIComponent {
  id: string;
  component: string;
  props?: Record<string, unknown>;
  parentId?: string;
}

export interface A2UIPayload {
  components?: A2UIComponent[];
  surface?: {
    id: string;
    components: A2UIComponent[];
  };
}

export interface RenderContext {
  spoonLevel: number;
  brand: string;
  tokenCSS: string;
}

type ComponentRenderer = (props: Record<string, unknown>, ctx: RenderContext) => string;

const RENDERERS: Record<string, ComponentRenderer> = {
  GlassPanel: (p, ctx) =>
    `<div class="glass-panel" data-mcp-tool="glassPanel" data-mcp-target="glass-panel" style="padding:var(--p31-space-${p.padding || 'md'});">
      <slot></slot>
    </div>`,

  GlassCard: (p, ctx) => {
    const color = p.color as string || 'accent';
    const interactive = p.interactive !== false;
    return `<div class="glass-card${interactive ? ' glass-card--interactive' : ''}" data-mcp-tool="glassCard" data-mcp-type="container" data-mcp-target="glass-card" data-mcp-state="${color}" tabindex="${interactive ? '0' : '-1'}" style="padding:var(--p31-space-${p.padding || 'lg'});border-color:var(--p31-accent-${color}, var(--p31-accent, #00F0FF));">
      <slot></slot>
    </div>`;
  },

  GlassStrong: () =>
    `<div class="glass-card glass-strong" data-mcp-tool="glassStrong" data-mcp-target="glass-strong">
      <slot></slot>
    </div>`,

  GlassSubtle: () =>
    `<div class="glass-card glass-subtle" data-mcp-tool="glassSubtle" data-mcp-target="glass-subtle">
      <slot></slot>
    </div>`,

  Button: (p, ctx) => {
    const variant = p.variant as string || 'primary';
    const size = p.size as string || 'md';
    const sizeMap: Record<string, string> = { sm: '8px 16px', md: '12px 24px', lg: '16px 32px' };
    return `<button class="btn btn-${variant}" data-mcp-tool="button" data-mcp-type="action" data-mcp-target="btn" data-mcp-state="${variant}" style="padding:${sizeMap[size] || sizeMap.md};background:${variant === 'primary' ? 'var(--p31-accent-cyan, #00F0FF)' : 'transparent'};color:${variant === 'primary' ? 'var(--p31-bg, #0A0A0F)' : 'var(--p31-accent-cyan, #00F0FF)'};border:${variant === 'ghost' ? 'none' : '1px solid var(--p31-glass-border, rgba(255,255,255,0.1))'};border-radius:var(--p31-radius-sm, 8px);cursor:pointer;font-family:var(--p31-font-sans, system-ui);font-size:${size === 'lg' ? '15px' : '13px'};" onclick="this.dispatchEvent(new CustomEvent('a2ui:action',{bubbles:true,detail:{action:'click',id:'btn'}}))">
      <slot></slot>
    </button>`;
  },

  SpoonMeter: (p, ctx) => {
    const current = Number(p.current ?? ctx.spoonLevel);
    const clamped = Math.max(0, Math.min(5, current));
    let tier = 'standard';
    if (clamped <= 1) tier = 'crisis';
    else if (clamped >= 4) tier = 'full';
    const dots = Array.from({ length: 6 }, (_, i) =>
      `<div class="spoon-meter-dot ${i <= clamped ? 'filled ' + tier : 'empty'}" data-mcp-tool="spoonDot" data-mcp-target="dot-${i}" data-mcp-state="${i <= clamped ? 'filled' : 'empty'}"></div>`
    ).join('\n      ');
    return `<div class="spoon-meter" data-mcp-tool="spoonMeter" data-mcp-type="control" data-mcp-range="0,5" data-mcp-current="${clamped}" data-mcp-target="spoon-meter">
      <div style="display:flex;gap:8px;align-items:center;">
        ${dots}
      </div>
      <span style="font-size:12px;color:var(--p31-text-secondary);text-align:center;display:block;margin-top:8px;">${clamped}/5</span>
    </div>`;
  },

  SpoonDial: (p, ctx) => SpoonMeter(p, ctx),

  StatusBadge: (p) => {
    const status = p.status as string || 'live';
    const colorMap: Record<string, string> = {
      live: 'var(--p31-accent-green, #34d399)',
      beta: 'var(--p31-accent-gold, #fbbf24)',
      research: 'var(--p31-accent-violet, #A78BFA)',
    };
    return `<span class="status-badge" data-mcp-tool="statusBadge" data-mcp-type="status" data-mcp-target="status-badge" data-mcp-state="${status}" style="display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:var(--p31-radius-full, 9999px);background:var(--p31-glass-bg, rgba(255,255,255,0.06));border:1px solid var(--p31-glass-border, rgba(255,255,255,0.1));">
      <span style="width:8px;height:8px;border-radius:50%;background:${colorMap[status] || colorMap.live};flex-shrink:0;"></span>
      <span style="font-size:12px;color:var(--p31-text-primary);">${status}</span>
    </span>`;
  },

  Crown: (p, ctx) => {
    const size = p.size as string || 'md';
    const sizeMap: Record<string, string> = { xs: '16px', sm: '20px', md: '24px', lg: '32px' };
    const px = sizeMap[size] || sizeMap.md;
    return `<div class="crown" data-mcp-tool="crownDisplay" data-mcp-state="active" data-mcp-target="crown" style="display:inline-flex;align-items:center;gap:8px;">
      <span style="display:inline-flex;align-items:center;justify-content:center;width:${px};height:${px};flex-shrink:0;overflow:hidden;font-size:${px};">👑</span>
      <span style="font-size:13px;font-weight:600;color:var(--p31-accent-violet, #A78BFA);">${p.brand || ctx.brand}</span>
    </div>`;
  },

  CrisisOverlay: (p) =>
    `<div class="crisis-overlay" data-mcp-tool="crisisOverlay" data-mcp-type="surface" data-mcp-state="active" data-mcp-target="crisis-overlay" style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:var(--p31-bg, oklch(10% 0.01 240));z-index:9999;">
      <div style="text-align:center;max-width:400px;padding:32px;">
        <p style="font-size:24px;font-weight:300;color:var(--p31-text-secondary);margin:0 0 24px 0;">${p.message || 'Rest. Breathe. The mesh holds.'}</p>
        <button onclick="this.closest('.crisis-overlay').remove()" style="padding:12px 32px;border-radius:var(--p31-radius-sm, 8px);border:1px solid var(--p31-accent, #00F0FF);background:transparent;color:var(--p31-accent, #00F0FF);cursor:pointer;font-size:14px;">${p.buttonLabel || "I'm Ready"}</button>
      </div>
    </div>`,

  CandyHeader: (p) =>
    `<header class="candy-header" data-mcp-tool="candyHeader" data-mcp-type="navigation" data-mcp-target="candy-header" style="padding:12px 24px;background:var(--p31-glass-bg, rgba(255,255,255,0.06));backdrop-filter:blur(var(--p31-blur-standard, 12px));-webkit-backdrop-filter:blur(var(--p31-blur-standard, 12px));border-bottom:1px solid var(--p31-glass-border, rgba(255,255,255,0.08));display:flex;align-items:center;gap:12px;">
      <span style="font-weight:700;color:var(--p31-text-primary);">${p.brand || 'P31'}</span>
    </header>`,

  ThemeToggle: () =>
    `<button class="theme-toggle" data-mcp-tool="themeToggle" data-mcp-type="action" data-mcp-target="theme-toggle" data-mcp-state="dark" onclick="document.documentElement.toggleAttribute('data-theme')" style="padding:8px;border-radius:var(--p31-radius-sm, 8px);border:1px solid var(--p31-glass-border, rgba(255,255,255,0.1));background:var(--p31-glass-bg, rgba(255,255,255,0.06));color:var(--p31-text-primary);cursor:pointer;">🌓</button>`,

  Starfield: (p) =>
    `<div class="starfield" data-mcp-tool="starfield" data-mcp-type="visual" data-mcp-target="starfield" data-mcp-state="playing" style="width:100%;height:300px;position:relative;overflow:hidden;border-radius:var(--p31-radius-md, 16px);background:var(--p31-bg, oklch(10% 0.01 240));">
      <canvas style="width:100%;height:100%;" data-count="${p.count || 200}" data-speed="${p.speed || 0.08}"></canvas>
    </div>`,

  TetraGrid: () =>
    `<div class="tetra-grid" data-mcp-tool="tetraGrid" data-mcp-type="visual" data-mcp-target="tetra-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px;">
      <slot></slot>
    </div>`,

  HonestLabel: () =>
    `<span class="honest-label" data-mcp-tool="honestLabel" data-mcp-type="label" data-mcp-target="honest-label" style="display:inline-block;padding:2px 8px;border-radius:var(--p31-radius-sm, 8px);background:var(--p31-accent-gold, #fbbf24);color:var(--p31-bg, #0A0A0F);font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">
      <slot></slot>
    </span>`,

  ThemeToggle: () =>
    `<button class="theme-toggle" data-mcp-tool="themeToggle" data-mcp-type="action" data-mcp-target="theme-toggle" data-mcp-state="dark" onclick="this.dataset.mcpState=this.dataset.mcpState==='dark'?'light':'dark';document.documentElement.toggleAttribute('data-theme')" style="padding:8px;border-radius:var(--p31-radius-sm, 8px);border:1px solid var(--p31-glass-border, rgba(255,255,255,0.1));background:var(--p31-glass-bg, rgba(255,255,255,0.06));color:var(--p31-text-primary);cursor:pointer;">🌓</button>`,
};

export function renderA2UI(payload: A2UIPayload, ctx: RenderContext): string {
  const components = payload.components || payload.surface?.components || [];

  // Build tree from flat list (parentId references)
  const byParent = new Map<string, A2UIComponent[]>();
  const roots: A2UIComponent[] = [];

  for (const c of components) {
    const parentId = c.parentId || 'root';
    if (parentId === 'root' || parentId === '__root__') {
      roots.push(c);
    } else {
      if (!byParent.has(parentId)) byParent.set(parentId, []);
      byParent.get(parentId)!.push(c);
    }
  }

  // Render recursively
  function renderComponent(c: A2UIComponent): string {
    const renderer = RENDERERS[c.component];
    if (!renderer) {
      return `<div data-mcp-tool="unknown" style="padding:8px;border:1px dashed var(--p31-accent-red, #FB7185);border-radius:8px;color:var(--p31-text-tertiary);font-size:12px;">Unknown component: ${c.component}</div>`;
    }

    const children = byParent.get(c.id) || [];
    const rendered = renderer(c.props || {}, ctx);

    // Inject children into <slot> positions
    if (children.length > 0) {
      const childHTML = children.map(renderComponent).join('\n        ');
      return rendered.replace('<slot></slot>', childHTML);
    }

    return rendered;
  }

  const bodyHTML = roots.map(renderComponent).join('\n    ');
  const s = Math.max(0, Math.min(5, ctx.spoonLevel));

  return `<!DOCTYPE html>
<html lang="en" data-brand="${ctx.brand}" data-spoons="${s}" data-theme="quantum">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>A2UI · ${ctx.brand} · ${s}/5 spoons</title>
  <meta name="generator" content="p31-a2ui-renderer/1.0">
  <meta name="agent:version" content="mcp-2026-07-28">
  <style>
    :root {
${ctx.tokenCSS}
    }
    *, *::before, *::after { box-sizing: border-box; }
    body {
      margin: 0;
      padding: clamp(16px, 3vw, 40px);
      background: var(--p31-bg, oklch(10% 0.01 240));
      color: var(--p31-text-primary, oklch(96% 0.005 240));
      font-family: var(--p31-font-sans, system-ui, -apple-system, sans-serif);
      min-height: 100vh;
    }
    .app {
      max-width: 900px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: clamp(12px, 2vw, 24px);
    }
    .glass-panel, .glass-card {
      background: var(--p31-glass-panel-background, oklch(100% 0.01 240 / 0.04));
      backdrop-filter: blur(var(--p31-blur-standard, 12px));
      -webkit-backdrop-filter: blur(var(--p31-blur-standard, 12px));
      border: 1px solid var(--p31-glass-panel-border, oklch(100% 0.01 240 / 0.08));
      border-radius: var(--p31-radius-lg, 24px);
      box-shadow: var(--p31-shadow-glass, 0 8px 32px rgba(0,0,0,0.15));
      transition: all 200ms ease;
    }
    .glass-card--interactive { cursor: pointer; }
    .glass-card--interactive:hover { border-color: var(--p31-glass-border-hover, oklch(100% 0.01 240 / 0.15)); }
    .glass-strong { background: oklch(100% 0.01 240 / 0.08); backdrop-filter: blur(24px); }
    .glass-subtle { background: oklch(100% 0.01 240 / 0.02); backdrop-filter: blur(4px); }
    .spoon-meter-dot {
      width: 14px; height: 14px; border-radius: 50%;
      transition: all 200ms ease; flex-shrink: 0;
    }
    .spoon-meter-dot.filled.crisis { background: var(--p31-accent-red, #FB7185); box-shadow: 0 0 8px rgba(251,113,133,0.5); }
    .spoon-meter-dot.filled.standard { background: var(--p31-accent-cyan, #00F0FF); box-shadow: 0 0 6px rgba(0,240,255,0.5); }
    .spoon-meter-dot.filled.full { background: var(--p31-accent-violet, #A78BFA); box-shadow: 0 0 6px rgba(167,139,250,0.5); }
    .spoon-meter-dot.empty { background: oklch(100% 0.01 240 / 0.12); }
  </style>
</head>
<body>
  <div class="app" data-mcp-tool="a2uiSurface" data-mcp-state="${s}" data-mcp-target="a2ui-root">
    ${bodyHTML}
  </div>
</body>
</html>`;
}
