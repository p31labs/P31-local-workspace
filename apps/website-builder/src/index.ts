/// <reference types="@cloudflare/workers-types" />

interface Env {
  DB: D1Database;
  ASSETS: R2Bucket;
  MCP_SERVER_URL: string;
  A2UI_CATALOG_URL: string;
  DESIGN_TOKEN_URL: string;
  WEBMCP_ENABLED: string;
}

interface GenerationRequest {
  prompt: string;
  spoons?: number;
  brand?: string;
  theme?: 'light' | 'dark';
}

interface MCPResponse {
  jsonrpc: '2.0';
  id: number | string;
  result?: unknown;
  error?: { code: number; message: string };
}

const DESIGN_TOKENS_CSS = `
:root {
  --p31-bg: oklch(10% 0.01 240);
  --p31-surface: oklch(15% 0.015 240);
  --p31-surface2: oklch(22% 0.02 240);
  --p31-accent: oklch(65% 0.18 195);
  --p31-accent-violet: oklch(65% 0.18 285);
  --p31-accent-gold: oklch(65% 0.18 15);
  --p31-accent-green: oklch(65% 0.18 105);
  --p31-accent-red: oklch(65% 0.18 20);
  --p31-accent-iris: oklch(65% 0.18 270);
  --p31-text: oklch(96% 0.005 240);
  --p31-text-secondary: oklch(75% 0.01 240);
  --p31-text-tertiary: oklch(55% 0.01 240);
  --p31-glass-bg: oklch(100% 0.01 240 / 0.04);
  --p31-glass-border: oklch(100% 0.01 240 / 0.08);
  --p31-glass-border-hover: oklch(100% 0.01 240 / 0.15);
  --p31-glass-shadow: 0 8px 32px rgba(0,0,0,0.15);
  --p31-glow-cyan: 0 0 20px rgba(0,240,255,0.25);
  --p31-blur-subtle: 8px;
  --p31-blur-standard: 12px;
  --p31-blur-strong: 24px;
  --p31-radius-sm: 6px;
  --p31-radius-md: 12px;
  --p31-radius-lg: 24px;
  --p31-radius-xl: 48px;
  --p31-radius-full: 9999px;
  --p31-font-sans: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --p31-font-mono: ui-monospace, SFMono-Regular, 'Fira Code', 'Fira Mono', monospace;
}

[data-theme="light"] {
  --p31-bg: #F8FAFC;
  --p31-surface: #FFFFFF;
  --p31-surface2: #F1F5F9;
  --p31-text: #0F172A;
  --p31-text-secondary: rgba(15,23,42,0.6);
  --p31-text-tertiary: rgba(15,23,42,0.3);
  --p31-glass-bg: rgba(0,0,0,0.03);
  --p31-glass-border: rgba(0,0,0,0.08);
  --p31-glass-border-hover: rgba(0,0,0,0.15);
}
`;

function injectWebMCPAnnotations(html: string, spoons: number): string {
  const tools = ['setSpoonLevel', 'navigate', 'toggleDrawer', 'setStatus'];
  const mcpAttr = `data-mcp-tools="${tools.join(',')}"`;

  html = html.replace('<html', `<html ${mcpAttr} data-spoons="${spoons}"`);
  html = html.replace('<body', '<body data-mcp-surface="main"');

  const script = `
<script>
(function() {
  if (typeof window.__p31MCPTools !== 'undefined') return;
  window.__p31MCPTools = ${JSON.stringify(tools)};
  window.__p31MCPExec = function(name, args) {
    const event = new CustomEvent('mcp:tool', { detail: { name, args } });
    document.dispatchEvent(event);
  };
  if (typeof ((document.modelContext||navigator.modelContext)||{}).registerTool==='function') {
    ${tools.map(t => `
    _ctx.registerTool('${t}', async (args) => {
      window.__p31MCPExec('${t}', args);
      return { success: true };
    });`).join('\n    ')}
  }
  document.documentElement.addEventListener('spoons:changed', ((e) => {
    document.documentElement.setAttribute('data-spoons', e.detail.level);
  }));
})();
</script>`;

  return html.replace('</body>', `${script}</body>`);
}

function wrapWithP31Shell(html: string, req: GenerationRequest): string {
  const theme = req.theme ?? 'dark';
  const spoons = req.spoons ?? 3;
  const brand = req.brand ?? 'quantum';

  return `<!DOCTYPE html>
<html lang="en" data-theme="${theme}" data-brand="${brand}" data-spoons="${spoons}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="generator" content="p31-website-builder">
  <style>${DESIGN_TOKENS_CSS}</style>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: var(--p31-font-sans, system-ui, sans-serif);
      background: var(--p31-bg, oklch(10% 0.01 240));
      color: var(--p31-text, oklch(96% 0.005 240));
      min-height: 100dvh;
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
    }
    [data-spoons="0"] *, [data-spoons="1"] * {
      animation: none !important;
      transition: none !important;
    }
    .glass-panel {
      background: var(--p31-glass-bg, oklch(100% 0.01 240 / 0.04));
      backdrop-filter: blur(var(--p31-blur-standard, 12px));
      -webkit-backdrop-filter: blur(var(--p31-blur-standard, 12px));
      border: 1px solid var(--p31-glass-border, oklch(100% 0.01 240 / 0.08));
      border-radius: var(--p31-radius-lg, 24px);
    }
    .glass-card {
      background: var(--p31-glass-bg, oklch(100% 0.01 240 / 0.04));
      backdrop-filter: blur(var(--p31-blur-standard, 12px));
      -webkit-backdrop-filter: blur(var(--p31-blur-standard, 12px));
      border: 1px solid var(--p31-glass-border, oklch(100% 0.01 240 / 0.08));
      border-radius: var(--p31-radius-lg, 24px);
      padding: clamp(16px, 2.5vw, 24px);
    }
    .btn-primary {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 48px;
      padding: 8px 24px;
      background: var(--p31-accent, oklch(65% 0.18 195));
      color: var(--p31-bg, oklch(10% 0.01 240));
      border: none;
      border-radius: var(--p31-radius-md, 12px);
      font-family: inherit;
      font-size: 1rem;
      cursor: pointer;
      text-decoration: none;
    }
    .btn-primary:hover { opacity: 0.8; transform: translateY(-2px); }
    .btn-secondary {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 48px;
      padding: 8px 24px;
      background: rgba(167,139,250,0.1);
      color: var(--p31-accent-violet, #A78BFA);
      border: 1px solid rgba(167,139,250,0.3);
      border-radius: var(--p31-radius-md, 12px);
      font-family: inherit;
      font-size: 1rem;
      cursor: pointer;
      text-decoration: none;
    }
  </style>
</head>
<body>
${html}
</body>
</html>`;
}

function injectA2UIAnnotations(html: string): string {
  return html
    .replace(/<div class="glass-card/g, '<div data-a2ui-component="GlassCard" data-a2ui-catalog="p31ca.org:a2ui" class="glass-card')
    .replace(/<div class="glass-panel/g, '<div data-a2ui-component="GlassPanel" data-a2ui-catalog="p31ca.org:a2ui" class="glass-panel')
    .replace(/class="btn-primary/g, 'data-a2ui-component="Button" data-a2ui-catalog="p31ca.org:a2ui" data-a2ui-props=\'{"variant":"primary"}\' class="btn-primary')
    .replace(/class="btn-secondary/g, 'data-a2ui-component="Button" data-a2ui-catalog="p31ca.org:a2ui" data-a2ui-props=\'{"variant":"secondary"}\' class="btn-secondary');
}

async function callMCP(env: Env, method: string, params: unknown): Promise<MCPResponse> {
  const resp = await fetch(env.MCP_SERVER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: crypto.randomUUID(),
      method: 'tools/call',
      params: { name: method, arguments: params },
      _meta: { protocolVersion: '2026-07-28' },
    }),
  });

  if (!resp.ok) {
    throw new Error(`MCP server returned ${resp.status}: ${await resp.text()}`);
  }

  return resp.json<MCPResponse>();
}

function renderLandingPage(env: Env): Response {
  const html = `<!DOCTYPE html>
<html lang="en" data-theme="dark" data-brand="quantum" data-spoons="3" data-mcp-tools="setSpoonLevel,navigate">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>P31 Website Builder</title>
  <style>${DESIGN_TOKENS_CSS}
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: var(--p31-font-sans);
      background: var(--p31-bg);
      color: var(--p31-text);
      min-height: 100dvh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .container { max-width: 640px; width: 100%; }
    h1 {
      font-size: clamp(32px, 5vw, 64px);
      font-weight: 800;
      letter-spacing: -0.04em;
      text-align: center;
      margin-bottom: 8px;
      background: linear-gradient(135deg, var(--p31-accent), var(--p31-accent-violet));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .subtitle {
      text-align: center;
      color: var(--p31-text-secondary);
      font-size: 1.125rem;
      margin-bottom: 32px;
    }
    form { display: flex; flex-direction: column; gap: 16px; }
    textarea {
      width: 100%;
      min-height: 120px;
      padding: 16px 20px;
      background: var(--p31-glass-bg);
      border: 1px solid var(--p31-glass-border);
      border-radius: var(--p31-radius-lg);
      color: var(--p31-text);
      font-family: inherit;
      font-size: 1rem;
      resize: vertical;
      outline: none;
      transition: border-color 0.2s;
    }
    textarea:focus { border-color: var(--p31-accent); }
    textarea::placeholder { color: var(--p31-text-tertiary); }
    .controls { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
    .controls label { font-size: 0.875rem; color: var(--p31-text-secondary); display: flex; align-items: center; gap: 8px; }
    .controls select {
      padding: 8px 12px;
      background: var(--p31-surface);
      border: 1px solid var(--p31-glass-border);
      border-radius: var(--p31-radius-md);
      color: var(--p31-text);
      font-family: inherit;
      font-size: 0.875rem;
      outline: none;
    }
    .generate-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      min-height: 48px;
      padding: 12px 32px;
      background: var(--p31-accent);
      color: var(--p31-bg);
      border: none;
      border-radius: var(--p31-radius-md);
      font-family: inherit;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s, transform 0.2s;
    }
    .generate-btn:hover { opacity: 0.85; transform: translateY(-2px); }
    .generate-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
    #output {
      margin-top: 24px;
      border-radius: var(--p31-radius-lg);
      background: var(--p31-surface);
      border: 1px solid var(--p31-glass-border);
      overflow: hidden;
      display: none;
    }
    #output iframe {
      width: 100%;
      height: 480px;
      border: none;
      display: block;
    }
    .loading { display: none; align-items: center; gap: 8px; color: var(--p31-text-secondary); font-size: 0.875rem; }
    .loading.active { display: flex; }
    .spinner { width: 16px; height: 16px; border: 2px solid var(--p31-glass-border); border-top-color: var(--p31-accent); border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body data-mcp-surface="landing">
  <div class="container">
    <h1>P31 Builder</h1>
    <p class="subtitle">Describe a site — get tokenized, WebMCP-annotated P31 HTML</p>
    <form id="builder-form">
      <textarea id="prompt" placeholder="A landing page for a neurodivergent-friendly SaaS product with glass cards, a hero section, and a spoon-level toggle..." required></textarea>
      <div class="controls">
        <label>Spoons <select id="spoons"><option value="5">5 — Full</option><option value="4">4 — High</option><option value="3" selected>3 — Medium</option><option value="2">2 — Low</option><option value="1">1 — Minimal</option><option value="0">0 — Crisis</option></select></label>
        <label>Theme <select id="theme"><option value="dark" selected>Dark</option><option value="light">Light</option></select></label>
        <button type="submit" class="generate-btn">Generate</button>
      </div>
    </form>
    <div class="loading" id="loading"><div class="spinner"></div> Generating...</div>
    <div id="output"><iframe id="preview" sandbox="allow-scripts allow-same-origin"></iframe></div>
  </div>
  <script>
    const form = document.getElementById('builder-form');
    const prompt = document.getElementById('prompt');
    const spoons = document.getElementById('spoons');
    const theme = document.getElementById('theme');
    const loading = document.getElementById('loading');
    const output = document.getElementById('output');
    const preview = document.getElementById('preview');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!prompt.value.trim()) return;

      loading.classList.add('active');
      output.style.display = 'none';

      try {
        const resp = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: prompt.value.trim(),
            spoons: parseInt(spoons.value, 10),
            theme: theme.value,
          }),
        });

        if (!resp.ok) {
          const err = await resp.text();
          alert('Generation failed: ' + err);
          return;
        }

        const html = await resp.text();
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        preview.src = url;
        output.style.display = 'block';
      } catch (err) {
        alert('Request failed: ' + err.message);
      } finally {
        loading.classList.remove('active');
      }
    });
  </script>
</body>
</html>`;

  return new Response(html, {
    headers: {
      'content-type': 'text/html;charset=UTF-8',
      'cache-control': 'public, s-maxage=300, max-age=300',
    },
  });
}

async function handleGenerate(request: Request, env: Env): Promise<Response> {
  let body: GenerationRequest;
  try {
    body = await request.json<GenerationRequest>();
  } catch {
    return new Response('Invalid JSON body', { status: 400 });
  }

  if (!body.prompt || typeof body.prompt !== 'string') {
    return new Response('Missing or invalid "prompt" field', { status: 400 });
  }

  const spoons = typeof body.spoons === 'number' ? Math.max(0, Math.min(5, body.spoons)) : 3;
  const theme = body.theme === 'light' ? 'light' : 'dark';

  try {
    const mcpResult = await callMCP(env, 'generate_ui', {
      prompt: body.prompt,
      style: 'p31-tokenized',
      theme,
      spoons,
    });

    if (mcpResult.error) {
      return new Response(JSON.stringify({ error: mcpResult.error.message }), {
        status: 500,
        headers: { 'content-type': 'application/json' },
      });
    }

    const generatedHtml = String(mcpResult.result ?? '');

    let html = wrapWithP31Shell(generatedHtml, { prompt: body.prompt, spoons, theme });

    html = injectA2UIAnnotations(html);

    if (env.WEBMCP_ENABLED === 'true') {
      html = injectWebMCPAnnotations(html, spoons);
    }

    const pageId = crypto.randomUUID();
    try {
      await env.DB.prepare(
        'INSERT INTO pages (id, prompt, spoons, theme, created_at) VALUES (?, ?, ?, ?, ?)'
      ).bind(pageId, body.prompt, spoons, theme, Date.now()).run();
      await env.ASSETS.put(`pages/${pageId}.html`, html, {
        httpMetadata: { contentType: 'text/html;charset=UTF-8' },
      });
    } catch {
      // Non-fatal: log silently
    }

    return new Response(html, {
      headers: {
        'content-type': 'text/html;charset=UTF-8',
        'x-page-id': pageId,
        'cache-control': 'no-cache',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;

    if (url.pathname === '/' || url.pathname === '') {
      return renderLandingPage(env);
    }

    if (url.pathname === '/api/generate' && method === 'POST') {
      return handleGenerate(request, env);
    }

    if (url.pathname === '/api/health') {
      return new Response(JSON.stringify({ status: 'ok', builder: 'p31-website-builder' }), {
        headers: { 'content-type': 'application/json' },
      });
    }

    // Serve generated pages from R2
    if (url.pathname.startsWith('/p/')) {
      const pageId = url.pathname.slice(3);
      if (!pageId || pageId.includes('..')) {
        return new Response('Not found', { status: 404 });
      }
      const obj = await env.ASSETS.get(`pages/${pageId}.html`);
      if (!obj) {
        return new Response('Page not found', { status: 404 });
      }
      return new Response(obj.body, {
        headers: {
          'content-type': 'text/html;charset=UTF-8',
          'cache-control': 'public, max-age=3600',
          'x-page-id': pageId,
        },
      });
    }

    return new Response('Not found', { status: 404 });
  },

  async scheduled(_event: ScheduledEvent, env: Env): Promise<void> {
    const sixHoursAgo = Date.now() - 6 * 60 * 60 * 1000;
    try {
      const stale = await env.DB.prepare(
        'SELECT id FROM pages WHERE created_at < ?'
      ).bind(sixHoursAgo).all();

      if (stale.results && stale.results.length > 0) {
        const ids = stale.results.map((r: Record<string, unknown>) => String(r.id));
        const deletePromises = ids.map(id =>
          env.ASSETS.delete(`pages/${id}.html`).catch(() => {})
        );
        await Promise.all(deletePromises);
        await env.DB.prepare(
          `DELETE FROM pages WHERE created_at < ?`
        ).bind(sixHoursAgo).run();
      }
    } catch {
      // Non-fatal cleanup
    }
  },
};
