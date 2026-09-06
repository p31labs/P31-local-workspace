/**
 * HTML page renderer for edge-render Worker.
 * Generates tokenized HTML with WebMCP annotations.
 */

export interface RenderOptions {
  spoons: number;
  brand: string;
  component?: string;
  title?: string;
  tokenCSS: string;
}

export function renderPage(opts: RenderOptions): string {
  const s = clampSpoons(opts.spoons);
  const crisisMode = s <= 1;
  const fullMode = s >= 4;

  return `<!DOCTYPE html>
<html lang="en" data-brand="${escapeHtml(opts.brand)}" data-spoons="${s}" data-theme="quantum">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(opts.title || `P31 · ${opts.brand}`)}</title>
  <meta name="description" content="Edge-rendered, tokenized, agent-controllable — generated at ${new Date().toISOString()}">
  <meta name="generator" content="p31-edge-render/1.0">
  <meta name="agent:version" content="mcp-2026-07-28">
  <style>
    :root {
${opts.tokenCSS}
      /* Spoon-level overrides */
      --p31-motion-duration: ${crisisMode ? '0ms' : fullMode ? '300ms' : '200ms'};
      --p31-glass-opacity: ${crisisMode ? '0.95' : fullMode ? '0.04' : '0.06'};
      --p31-glass-blur: ${crisisMode ? '0px' : '12px'};
    }
    *, *::before, *::after { box-sizing: border-box; }
    body {
      margin: 0;
      padding: clamp(16px, 4vw, 48px);
      background: var(--p31-bg, oklch(10% 0.01 240));
      color: var(--p31-text-primary, oklch(96% 0.005 240));
      font-family: var(--p31-font-sans, system-ui, -apple-system, sans-serif);
      min-height: 100vh;
      transition: background var(--p31-motion-duration, 200ms) ease;
    }
    .app {
      max-width: 800px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: clamp(16px, 2.5vw, 32px);
    }
    .glass-card {
      background: var(--p31-glass-panel-background, oklch(100% 0.01 240 / var(--p31-glass-opacity, 0.04)));
      backdrop-filter: blur(var(--p31-glass-blur, 12px));
      -webkit-backdrop-filter: blur(var(--p31-glass-blur, 12px));
      border: 1px solid var(--p31-glass-panel-border, oklch(100% 0.01 240 / 0.08));
      border-radius: var(--p31-radius-lg, 24px);
      padding: clamp(16px, 2.5vw, 32px);
      box-shadow: var(--p31-shadow-glass, 0 8px 32px rgba(0,0,0,0.15));
      transition: all var(--p31-motion-duration, 200ms) ease;
    }
    .glass-card h1 {
      margin: 0 0 8px 0;
      font-size: clamp(24px, 4vw, 36px);
      font-weight: 700;
      background: linear-gradient(135deg,
        var(--p31-accent, #00F0FF),
        var(--p31-accent-violet, #A78BFA));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .glass-card p {
      margin: 0;
      color: var(--p31-text-secondary, oklch(75% 0.01 240));
      font-size: clamp(13px, 1.5vw, 15px);
      line-height: 1.6;
    }
    .meta-footer {
      margin-top: 32px;
      padding: 16px;
      background: oklch(100% 0.01 240 / 0.02);
      border: 1px solid oklch(100% 0.01 240 / 0.06);
      border-radius: var(--p31-radius-md, 16px);
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      color: var(--p31-text-tertiary, oklch(55% 0.01 240));
      flex-wrap: wrap;
      gap: 8px;
    }
    .meta-footer code {
      font-family: var(--p31-font-mono, ui-monospace, monospace);
      font-size: 10px;
      background: oklch(100% 0.01 240 / 0.05);
      padding: 2px 6px;
      border-radius: 4px;
    }
    .spoon-indicator {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .spoon-dot {
      width: 14px; height: 14px;
      border-radius: 50%;
      transition: all var(--p31-motion-duration, 200ms) ease;
    }
    .spoon-dot.filled.crisis { background: var(--p31-accent-red, #FB7185); box-shadow: 0 0 8px rgba(251,113,133,0.5); }
    .spoon-dot.filled.standard { background: var(--p31-accent-cyan, #00F0FF); box-shadow: 0 0 6px rgba(0,240,255,0.5); }
    .spoon-dot.filled.full { background: var(--p31-accent-violet, #A78BFA); box-shadow: 0 0 6px rgba(167,139,250,0.5); }
    .spoon-dot.empty { background: oklch(100% 0.01 240 / 0.12); }
  </style>
</head>
<body>
  <div class="app" data-mcp-tool="sovereignSurface" data-mcp-state="${s}" data-mcp-target="sovereign-root">
    <div class="glass-card">
      <h1>${escapeHtml(opts.brand)}</h1>
      <p>Edge-rendered sovereign surface · <strong>${s}/5 spoons</strong></p>
    </div>

    <div class="glass-card" data-mcp-tool="spoonDisplay" data-mcp-type="control" data-mcp-range="0,5" data-mcp-current="${s}" data-mcp-target="spoon-display">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <span style="font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:var(--p31-text-secondary);">Spoons</span>
        <span style="font-size:13px;color:var(--p31-text-secondary);">${s}/5</span>
      </div>
      <div class="spoon-indicator" data-mcp-tool="spoonIndicator" data-mcp-target="spoon-indicator">
        ${renderSpoonDots(s)}
      </div>
    </div>

    <div class="glass-card" data-mcp-tool="crownDisplay" data-mcp-state="active" data-mcp-target="crown-card">
      <div style="display:flex;align-items:center;gap:12px;">
        <span style="font-size:24px;">👑</span>
        <div>
          <div style="font-weight:600;color:var(--p31-accent-violet, #A78BFA);">Sovereign</div>
          <div style="font-size:12px;color:var(--p31-text-secondary);">Role: ${escapeHtml(opts.brand)}</div>
        </div>
      </div>
    </div>

    <div class="glass-card" data-mcp-tool="metaPanel" data-mcp-target="meta-panel">
      <div style="display:flex;flex-direction:column;gap:6px;">
        ${renderMetaRow('Brand', opts.brand)}
        ${renderMetaRow('Spoons', String(s))}
        ${renderMetaRow('Generated', new Date().toISOString())}
        ${renderMetaRow('Protocol', 'MCP 2026-07-28')}
        ${renderMetaRow('Tokens', `${countTokens(opts.tokenCSS)} CSS variables`)}
      </div>
    </div>

    <div class="meta-footer">
      <span><b>P31 Edge Render</b> · sovereign · tokenized</span>
      <span>
        <code>data-mcp-*</code> annotated · stateless MCP · ${opts.brand}
      </span>
    </div>
  </div>
</body>
</html>`;
}

function renderSpoonDots(level: number): string {
  const dots: string[] = [];
  for (let i = 0; i <= 5; i++) {
    const filled = i <= level;
    let tier = 'standard';
    if (level <= 1) tier = 'crisis';
    else if (level >= 4) tier = 'full';
    dots.push(`<div class="spoon-dot ${filled ? 'filled ' + tier : 'empty'}" data-mcp-tool="spoonDot" data-mcp-target="dot-${i}" data-mcp-state="${filled ? 'filled' : 'empty'}" style="cursor:pointer;"></div>`);
  }
  return dots.join('\n        ');
}

function renderMetaRow(label: string, value: string): string {
  return `<div style="display:flex;justify-content:space-between;font-size:12px;"><span style="color:var(--p31-text-tertiary);">${escapeHtml(label)}</span><span style="color:var(--p31-text-primary);font-family:var(--p31-font-mono, monospace);font-size:11px;">${escapeHtml(value)}</span></div>`;
}

function countTokens(css: string): number {
  return css.split(';').filter(l => l.trim().startsWith('--p31-')).length;
}

function clampSpoons(n: number): number {
  return Math.max(0, Math.min(5, Math.round(n)));
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
