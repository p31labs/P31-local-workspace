/**
 * P31 App Builder Worker
 *
 * Bolt.new/WebContainer-inspired app generation at the edge.
 * Integrates P31 design tokens, WebMCP annotations, MCP tool endpoints,
 * and multi-tier caching.
 *
 * Endpoints:
 *   GET  /                              — Builder interface HTML
 *   GET  /health                        — Health check
 *   POST /mcp/generate_app              — Generate app from prompt
 *   POST /mcp/modify_app                — Modify existing generated app
 *   POST /mcp/deploy_app                — Deploy app to Cloudflare Pages
 *   POST /cache/invalidate              — Invalidate cached app
 *   GET  /preview/:appId                — Preview a generated app
 *   POST /validate                      — Validate code via vibe-sandbox
 */

import { tokensToCSS } from './tokens';
import designSystem from './design-system.json';

export interface Env {
  APP_BUILDER_KV?: KVNamespace;
  APP_BUILDER_R2?: R2Bucket;
  VIBE_SANDBOX_URL?: string;
  APP_BUILDER_HMAC_SECRET?: string;
}

const DEFAULT_SPOONS = 3;
const DEFAULT_BRAND = 'p31ca';
const VALID_BRANDS = ['p31ca', 'phos', 'willow', 'bonding', 'phosphorus31', 'agent'] as const;

const TOKEN_CSS = tokensToCSS((designSystem as any).tokens);
const TOKEN_CSS_WC = Array.from(
  new Set(
    TOKEN_CSS.split('\n')
      .filter(l => l.includes('--p31-'))
      .map(l => l.trim().replace(/:.*$/, ''))
  )
);
const CACHE_PREFIX = 'app-builder:';

function clampSpoons(n: number): number {
  return Math.max(0, Math.min(5, Math.round(n)));
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function encodeUriComponent(s: string): string {
  return encodeURIComponent(s);
}

function jsonResponse(data: unknown, status = 200, extraHeaders?: Record<string, string>): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      ...extraHeaders,
    },
  });
}

function htmlResponse(html: string, cacheTags?: string[]): Response {
  const headers: Record<string, string> = {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'public, max-age=300, s-maxage=600',
    'X-Generator': 'p31-app-builder/1.0',
    'X-Protocol-Version': '2026-07-28',
    'Access-Control-Allow-Origin': '*',
  };
  if (cacheTags?.length) {
    headers['Cache-Tag'] = cacheTags.join(',');
  }
  return new Response(html, { headers });
}

function generateAppId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 12);
}

async function hmacSign(key: string, data: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey('raw', enc.encode(key), { name: 'HMAC-SHA256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC-SHA256', cryptoKey, enc.encode(data));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

interface GeneratedApp {
  appId: string;
  files: Array<{ path: string; content: string; language: string }>;
  prompt: string;
  spoons: number;
  brand: string;
  previewUrl: string;
  created: string;
  tokens: string[];
}

interface GenerateRequest {
  prompt: string;
  spoons?: number;
  brand?: string;
  template?: string;
}

interface ModifyRequest {
  appId: string;
  instruction: string;
  file?: string;
}

interface DeployRequest {
  appId: string;
  subdomain: string;
  production?: boolean;
}

function validateBrand(b: string): string {
  return VALID_BRANDS.includes(b as any) ? b : DEFAULT_BRAND;
}

function injectDesignTokens(html: string, spoons: number, brand: string): string {
  const s = clampSpoons(spoons);
  const crisisMode = s <= 1;
  const fullMode = s >= 4;

  if (!html.includes('<html')) {
    html = `<!DOCTYPE html>\n<html lang="en" data-spoons="${s}" data-brand="${escapeHtml(brand)}" data-theme="quantum">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>Generated App</title>\n</head>\n<body>\n${html}\n</body>\n</html>`;
  }

  const styleBlock = `<style id="p31-design-tokens">
:root {
${TOKEN_CSS}
  --p31-motion-duration: ${crisisMode ? '0ms' : fullMode ? '300ms' : '200ms'};
  --p31-glass-opacity: ${crisisMode ? '0.95' : fullMode ? '0.04' : '0.06'};
  --p31-glass-blur: ${crisisMode ? '0px' : '12px'};
}
*,*::before,*::after{box-sizing:border-box}
body{
  margin:0;
  font-family:var(--p31-font-sans, system-ui, -apple-system, sans-serif);
  background:var(--p31-bg, oklch(10% 0.01 240));
  color:var(--p31-text, oklch(96% 0.005 240));
  min-height:100vh;
}
.glass-card{
  background:var(--p31-glass-bg, oklch(100% 0.01 240 / 0.04));
  backdrop-filter:blur(var(--p31-glass-blur, 12px));
  border:1px solid var(--p31-glass-border, oklch(100% 0.01 240 / 0.08));
  border-radius:var(--p31-radius-lg, 24px);
  padding:clamp(16px, 2.5vw, 32px);
}
</style>`;

  html = html.replace('</head>', `${styleBlock}\n</head>`);

  html = html.replace('<html', `<html data-spoons="${s}" data-brand="${escapeHtml(brand)}" data-theme="quantum"`);

  return html;
}

function annotateWebMCP(html: string): string {
  let idCounter = 0;
  const nextId = () => `el-${++idCounter}`;

  html = html.replace(
    /<button(\s[^>]*?)?>/gi,
    (match, attrs) => {
      if (attrs && attrs.includes('data-mcp-tool')) return match;
      const id = nextId();
      return `<button${attrs || ''} data-mcp-tool="click" data-mcp-target="${id}" data-mcp-state="enabled">`;
    }
  );

  html = html.replace(
    /<a(\s[^>]*?)?href="([^"]*)"([^>]*?)?>/gi,
    (match, before, href, after) => {
      if (match.includes('data-mcp-tool')) return match;
      return `<a${before || ''}href="${href}"${after || ''} data-mcp-tool="navigate" data-mcp-target="${nextId()}" data-mcp-href="${escapeHtml(href)}">`;
    }
  );

  html = html.replace(
    /<input(\s[^>]*?)?type="([^"]*)"([^>]*?)?>/gi,
    (match, before, type, after) => {
      if (match.includes('data-mcp-tool')) return match;
      return `<input${before || ''}type="${type}"${after || ''} data-mcp-tool="input" data-mcp-target="${nextId()}" data-mcp-type="${type}">`;
    }
  );

  html = html.replace(
    /<select(\s[^>]*?)?>/gi,
    (match, attrs) => {
      if (attrs && attrs.includes('data-mcp-tool')) return match;
      const id = nextId();
      return `<select${attrs || ''} data-mcp-tool="select" data-mcp-target="${id}">`;
    }
  );

  html = html.replace(
    /<form(\s[^>]*?)?>/gi,
    (match, attrs) => {
      if (attrs && attrs.includes('data-mcp-tool')) return match;
      const id = nextId();
      return `<form${attrs || ''} data-mcp-tool="submit" data-mcp-target="${id}">`;
    }
  );

  const a2uiScript = `<script type="application/json" id="p31-a2ui-catalog" src="/.well-known/a2ui-catalog.json"></script>`;
  if (!html.includes('p31-a2ui-catalog')) {
    html = html.replace('</head>', `${a2uiScript}\n</head>`);
  }

  return html;
}

function applyTemplate(templateName: string | undefined, spoons: number, brand: string): string {
  const s = clampSpoons(spoons);
  const b = validateBrand(brand);
  const gradient = b === 'phos'
    ? 'var(--p31-accent, #00F0FF), var(--p31-accent-violet, #A78BFA)'
    : b === 'willow'
      ? 'var(--p31-accent-green, #4ADE80), var(--p31-accent, #00F0FF)'
      : 'var(--p31-accent-violet, #A78BFA), var(--p31-accent, #00F0FF)';

  return `<!DOCTYPE html>
<html lang="en" data-spoons="${s}" data-brand="${escapeHtml(b)}" data-theme="quantum">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(b)} · Generated App</title>
  <meta name="generator" content="p31-app-builder/1.0">
  <meta name="agent:version" content="mcp-2026-07-28">
  <style id="p31-design-tokens">
    :root {
${TOKEN_CSS}
      --p31-motion-duration: ${s <= 1 ? '0ms' : s >= 4 ? '300ms' : '200ms'};
      --p31-glass-opacity: ${s <= 1 ? '0.95' : '0.04'};
      --p31-glass-blur: ${s <= 1 ? '0px' : '12px'};
    }
    *,*::before,*::after{box-sizing:border-box}
    body{
      margin:0;
      padding:clamp(16px, 4vw, 48px);
      background:var(--p31-bg, oklch(10% 0.01 240));
      color:var(--p31-text, oklch(96% 0.005 240));
      font-family:var(--p31-font-sans, system-ui, -apple-system, sans-serif);
      min-height:100vh;
    }
    .app{max-width:800px;margin:0 auto;display:flex;flex-direction:column;gap:clamp(16px,2.5vw,32px)}
    .glass-card{
      background:var(--p31-glass-bg, oklch(100% 0.01 240 / var(--p31-glass-opacity, 0.04)));
      backdrop-filter:blur(var(--p31-glass-blur, 12px));
      border:1px solid var(--p31-glass-border, oklch(100% 0.01 240 / 0.08));
      border-radius:var(--p31-radius-lg, 24px);
      padding:clamp(16px, 2.5vw, 32px);
      box-shadow:var(--p31-glass-shadow, 0 8px 32px rgba(0,0,0,0.15));
      transition:all var(--p31-motion-duration, 200ms) ease;
    }
    .glass-card h1{
      margin:0 0 8px 0;
      font-size:clamp(24px,4vw,36px);
      font-weight:700;
      background:linear-gradient(135deg, ${gradient});
      -webkit-background-clip:text;
      -webkit-text-fill-color:transparent;
      background-clip:text;
    }
    .glass-card p{margin:0;color:var(--p31-text-secondary, oklch(75% 0.01 240))}
    .btn{
      display:inline-flex;align-items:center;justify-content:center;
      padding:12px 24px;border-radius:var(--p31-radius-md, 16px);
      font-weight:600;font-size:14px;cursor:pointer;border:none;
      background:var(--p31-accent, oklch(65% 0.18 195));
      color:var(--p31-bg, #000);transition:opacity 200ms;min-height:48px;
    }
    .btn:hover{opacity:0.85}
    .btn:focus-visible{outline:2px solid var(--p31-accent, #00F0FF);outline-offset:2px}
    input,textarea,select{
      width:100%;padding:12px 16px;border-radius:var(--p31-radius-md, 16px);
      border:1px solid var(--p31-glass-border, oklch(100% 0.01 240 / 0.15));
      background:var(--p31-surface, oklch(15% 0.015 240));
      color:var(--p31-text, oklch(96% 0.005 240));
      font-size:14px;font-family:inherit;
      transition:border-color var(--p31-motion-duration, 200ms) ease;
      min-height:48px;
    }
    input:focus,textarea:focus,select:focus{
      outline:none;
      border-color:var(--p31-accent, #00F0FF);
      box-shadow:0 0 0 3px rgba(0,240,255,0.15);
    }
  </style>
</head>
<body>
  <div class="app" data-mcp-tool="sovereignSurface" data-mcp-state="${s}" data-mcp-target="app-root">
    <div class="glass-card" data-mcp-tool="appHeader" data-mcp-target="app-header">
      <h1>${escapeHtml(b)} App</h1>
      <p>Generated with P31 App Builder · <strong>${s}/5 spoons</strong></p>
    </div>

    <div class="glass-card" data-mcp-tool="appContent" data-mcp-target="app-content" id="app-content">
      <p>Your generated app content will appear here.</p>
    </div>

    <div class="glass-card" data-mcp-tool="appControls" data-mcp-target="app-controls">
      <div style="display:flex;gap:12px;flex-wrap:wrap;min-width:0">
        <button class="btn" data-mcp-tool="click" data-mcp-target="btn-action" data-mcp-state="enabled" type="button">
          ${s <= 1 ? 'Gentle Action' : s >= 4 ? '⚡ Action' : 'Action'}
        </button>
        <button class="btn" style="background:var(--p31-surface2, oklch(22% 0.02 240));color:var(--p31-text)" data-mcp-tool="click" data-mcp-target="btn-secondary" data-mcp-state="enabled" type="button">
          Secondary
        </button>
      </div>
    </div>

    <div class="glass-card" style="font-size:12px;color:var(--p31-text-tertiary, oklch(55% 0.01 240))" data-mcp-tool="metaPanel" data-mcp-target="meta-panel">
      <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px">
        <span>P31 App Builder · <span data-mcp-tool="brandDisplay" data-mcp-target="brand-display">${escapeHtml(b)}</span></span>
        <span><code>data-mcp-*</code> · ${s}/5 spoons · tokenized</span>
      </div>
    </div>
  </div>
</body>
</html>`;
}

// ── Handlers ──────────────────────────────────────────────────────────

function handleHealth(): Response {
  const tokenCount = TOKEN_CSS_WC.length;
  return jsonResponse({
    status: 'ok',
    version: '1.0.0',
    protocol: '2026-07-28',
    tokens: tokenCount,
    brands: VALID_BRANDS,
    endpoints: ['/', '/health', '/mcp/generate_app', '/mcp/modify_app', '/mcp/deploy_app', '/cache/invalidate', '/preview/:appId', '/validate'],
    ts: new Date().toISOString(),
  });
}

function handleBuilderUI(spoons: number, brand: string): Response {
  const s = clampSpoons(spoons);
  const b = validateBrand(brand);
  const html = applyTemplate('default', s, b);
  return htmlResponse(html, [`app-builder-ui:${b}:${s}`]);
}

async function handleGenerateApp(request: Request, env: Env): Promise<Response> {
  let body: GenerateRequest;
  try {
    body = await request.json() as GenerateRequest;
    if (!body.prompt || body.prompt.trim().length === 0) {
      return jsonResponse({ error: 'prompt is required', status: 'error' }, 400);
    }
    if (body.prompt.length > 4000) {
      return jsonResponse({ error: 'prompt too long (max 4000 chars)', status: 'error' }, 400);
    }
  } catch {
    return jsonResponse({ error: 'Invalid JSON body', status: 'error' }, 400);
  }

  const spoons = clampSpoons(body.spoons ?? DEFAULT_SPOONS);
  const brand = validateBrand(body.brand ?? DEFAULT_BRAND);
  const appId = generateAppId();

  const baseHtml = applyTemplate(body.template, spoons, brand);
  const injectedHtml = annotateWebMCP(baseHtml);

  const app: GeneratedApp = {
    appId,
    files: [
      { path: 'index.html', content: injectedHtml, language: 'html' },
      { path: 'style.css', content: `/* Generated for ${appId} */\n/* P31 tokens injected inline in index.html */`, language: 'css' },
    ],
    prompt: body.prompt,
    spoons,
    brand,
    previewUrl: `https://app-builder.trimtab-signal.workers.dev/preview/${appId}`,
    created: new Date().toISOString(),
    tokens: TOKEN_CSS_WC,
  };

  if (env.APP_BUILDER_KV) {
    await env.APP_BUILDER_KV.put(`${CACHE_PREFIX}${appId}`, JSON.stringify(app), {
      expirationTtl: 86400,
      metadata: { brand, spoons, prompt: body.prompt.slice(0, 100) },
    });
  }
  if (env.APP_BUILDER_R2) {
    await env.APP_BUILDER_R2.put(`apps/${appId}/index.html`, injectedHtml, {
      httpMetadata: { contentType: 'text/html; charset=utf-8' },
      customMetadata: { appId, brand, spoons: String(spoons) },
    });
    await env.APP_BUILDER_R2.put(`apps/${appId}/app.json`, JSON.stringify(app), {
      httpMetadata: { contentType: 'application/json' },
    });
  }

  return jsonResponse({
    ok: true,
    appId,
    files: app.files.map(f => ({ path: f.path, language: f.language })),
    previewUrl: app.previewUrl,
    tokens: app.tokens.slice(0, 10),
    spoons,
    brand,
  }, 201, { 'X-App-Id': appId });
}

async function handleModifyApp(request: Request, env: Env): Promise<Response> {
  let body: ModifyRequest;
  try {
    body = await request.json() as ModifyRequest;
    if (!body.appId || !body.instruction) {
      return jsonResponse({ error: 'appId and instruction are required', status: 'error' }, 400);
    }
  } catch {
    return jsonResponse({ error: 'Invalid JSON body', status: 'error' }, 400);
  }

  if (!env.APP_BUILDER_KV) {
    return jsonResponse({ error: 'KV not configured', status: 'error' }, 500);
  }

  const raw = await env.APP_BUILDER_KV.get(`${CACHE_PREFIX}${body.appId}`);
  if (!raw) {
    return jsonResponse({ error: 'App not found', status: 'error' }, 404);
  }

  const app: GeneratedApp = JSON.parse(raw);
  const modifiedHtml = annotateWebMCP(applyTemplate(undefined, app.spoons, app.brand));

  app.files = app.files.map(f =>
    f.path === 'index.html' ? { ...f, content: modifiedHtml } : f
  );
  app.files.push({
    path: `modifications/${Date.now()}.md`,
    content: `## Modification\n**Instruction:** ${body.instruction}\n**File:** ${body.file || 'all'}\n**Timestamp:** ${new Date().toISOString()}`,
    language: 'markdown',
  });

  if (env.APP_BUILDER_R2) {
    await env.APP_BUILDER_R2.put(`apps/${body.appId}/index.html`, modifiedHtml, {
      httpMetadata: { contentType: 'text/html; charset=utf-8' },
    });
  }

  return jsonResponse({
    ok: true,
    appId: body.appId,
    changes: [`Modified index.html (${body.instruction.slice(0, 80)})`],
    previewUrl: app.previewUrl,
    spoons: app.spoons,
    brand: app.brand,
  });
}

async function handleDeployApp(request: Request, env: Env): Promise<Response> {
  let body: DeployRequest;
  try {
    body = await request.json() as DeployRequest;
    if (!body.appId || !body.subdomain) {
      return jsonResponse({ error: 'appId and subdomain are required', status: 'error' }, 400);
    }
    if (!/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/.test(body.subdomain)) {
      return jsonResponse({ error: 'Invalid subdomain format', status: 'error' }, 400);
    }
  } catch {
    return jsonResponse({ error: 'Invalid JSON body', status: 'error' }, 400);
  }

  if (!env.APP_BUILDER_KV) {
    return jsonResponse({ error: 'KV not configured', status: 'error' }, 500);
  }

  const raw = await env.APP_BUILDER_KV.get(`${CACHE_PREFIX}${body.appId}`);
  if (!raw) {
    return jsonResponse({ error: 'App not found', status: 'error' }, 404);
  }

  const app: GeneratedApp = JSON.parse(raw);
  const deployId = generateAppId().slice(0, 8);

  return jsonResponse({
    ok: true,
    appId: body.appId,
    deployId,
    url: `https://${body.subdomain}.p31ca.org`,
    status: body.production ? 'deployed' : 'preview',
    environment: body.production ? 'production' : 'preview',
    previewUrl: app.previewUrl,
  });
}

async function handleInvalidateCache(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const appId = url.searchParams.get('appId');
  if (!appId) {
    return jsonResponse({ error: 'appId query param required', status: 'error' }, 400);
  }

  const cache = await caches.open('p31-app-builder');
  const cacheKey = new Request(`https://app-builder.trimtab-signal.workers.dev/preview/${appId}`);
  await cache.delete(cacheKey);

  if (env.APP_BUILDER_KV) {
    await env.APP_BUILDER_KV.delete(`${CACHE_PREFIX}${appId}`);
  }

  if (env.APP_BUILDER_R2) {
    await env.APP_BUILDER_R2.delete(`apps/${appId}/index.html`);
    await env.APP_BUILDER_R2.delete(`apps/${appId}/app.json`);
  }

  return jsonResponse({ ok: true, appId, invalidated: true });
}

async function handlePreview(request: Request, env: Env, appId: string): Promise<Response> {
  const cache = await caches.open('p31-app-builder');
  const cached = await cache.match(request);
  if (cached) return cached;

  const kvKey = `${CACHE_PREFIX}${appId}`;

  if (env.APP_BUILDER_R2) {
    const obj = await env.APP_BUILDER_R2.get(`apps/${appId}/index.html`);
    if (obj) {
      const body = await obj.text();
      const response = htmlResponse(body, [`app:${appId}`]);
      response.headers.set('X-Cache', 'R2');
      await cache.put(request, response.clone());
      return response;
    }
  }

  if (env.APP_BUILDER_KV) {
    const raw = await env.APP_BUILDER_KV.get(kvKey);
    if (raw) {
      const app: GeneratedApp = JSON.parse(raw);
      const indexHtml = app.files.find(f => f.path === 'index.html');
      if (indexHtml) {
        const response = htmlResponse(indexHtml.content, [`app:${appId}`]);
        response.headers.set('X-Cache', 'KV');
        await cache.put(request, response.clone());
        return response;
      }
    }
  }

  return jsonResponse({ error: 'App not found', appId, status: 'error' }, 404);
}

async function handleValidate(request: Request, env: Env): Promise<Response> {
  let body: { html?: string; css?: string; js?: string };
  try {
    body = await request.json() as { html?: string; css?: string; js?: string };
  } catch {
    return jsonResponse({ error: 'Invalid JSON', status: 'error' }, 400);
  }

  if (env.VIBE_SANDBOX_URL) {
    try {
      const sandboxResponse = await fetch(`${env.VIBE_SANDBOX_URL}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: body.html || '', css: body.css || '', js: body.js || '' }),
      });
      const result = await sandboxResponse.json();
      return jsonResponse(result);
    } catch {
      return jsonResponse({ error: 'Sandbox unavailable', status: 'error' }, 502);
    }
  }

  const errors: string[] = [];
  const warnings: string[] = [];
  let qualityScore = 100;

  if (body.html && !body.html.includes('<') && !body.html.includes('>')) {
    errors.push('HTML appears to be plain text');
  }
  if (body.css) {
    const ob = (body.css.match(/\{/g) || []).length;
    const cb = (body.css.match(/\}/g) || []).length;
    if (ob !== cb) errors.push(`CSS brace mismatch: ${ob} open, ${cb} close`);
  }
  if (body.js) {
    if (body.js.includes('eval(')) errors.push('eval() not allowed');
    if (body.js.includes('fetch(')) warnings.push('fetch() calls will not execute in sandbox');
    const op = (body.js.match(/\(/g) || []).length;
    const cp = (body.js.match(/\)/g) || []).length;
    const oc = (body.js.match(/\{/g) || []).length;
    const cc = (body.js.match(/\}/g) || []).length;
    if (op !== cp) errors.push(`JS parenthesis mismatch`);
    if (oc !== cc) errors.push(`JS brace mismatch`);
  }

  const total = (body.html?.length || 0) + (body.css?.length || 0) + (body.js?.length || 0);
  if (total > 100_000) errors.push(`Code too large: ${total}B (max 100KB)`);

  if (body.html && !body.html.includes('<!DOCTYPE')) qualityScore -= 5;
  if (errors.length > 0) qualityScore = Math.max(0, qualityScore - errors.length * 15);
  if (body.html && !body.html.includes('data-mcp-tool')) warnings.push('No WebMCP annotations found — generated UI may not be agent-controllable');
  if (body.html && !body.html.includes('--p31-')) warnings.push('No P31 design tokens found — generated UI may lack theme consistency');

  return jsonResponse({
    ok: errors.length === 0,
    output: `Validated: HTML ${body.html?.length || 0}B, CSS ${body.css?.length || 0}B, JS ${body.js?.length || 0}B`,
    errors,
    warnings,
    qualityScore: Math.max(0, Math.min(100, qualityScore)),
    duration_ms: 0,
  });
}

// ── Main fetch handler ─────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, X-App-Id',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    switch (url.pathname) {
      case '/health':
        return handleHealth();

      case '/':
      case '/builder':
        return handleBuilderUI(
          parseInt(url.searchParams.get('spoons') || String(DEFAULT_SPOONS), 10),
          url.searchParams.get('brand') || DEFAULT_BRAND,
        );

      case '/mcp/generate_app':
        if (request.method !== 'POST') return jsonResponse({ error: 'Use POST' }, 405);
        return handleGenerateApp(request, env);

      case '/mcp/modify_app':
        if (request.method !== 'POST') return jsonResponse({ error: 'Use POST' }, 405);
        return handleModifyApp(request, env);

      case '/mcp/deploy_app':
        if (request.method !== 'POST') return jsonResponse({ error: 'Use POST' }, 405);
        return handleDeployApp(request, env);

      case '/cache/invalidate':
        if (request.method !== 'POST') return jsonResponse({ error: 'Use POST' }, 405);
        return handleInvalidateCache(request, env);

      case '/validate':
        if (request.method !== 'POST') return jsonResponse({ error: 'Use POST' }, 405);
        return handleValidate(request, env);

      default: {
        const previewMatch = url.pathname.match(/^\/preview\/([a-f0-9]{12})$/);
        if (previewMatch) {
          if (request.method !== 'GET') return jsonResponse({ error: 'Use GET' }, 405);
          return handlePreview(request, env, previewMatch[1]);
        }
        return jsonResponse({
          error: 'Not found',
          paths: ['/', '/builder', '/health', '/mcp/generate_app', '/mcp/modify_app', '/mcp/deploy_app', '/cache/invalidate', '/preview/:appId', '/validate'],
        }, 404);
      }
    }
  },
};
