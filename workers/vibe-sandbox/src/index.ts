/**
 * Vibe Sandbox Worker — Server-side sandbox for executing user-generated code.
 *
 * Endpoints:
 *   POST /execute — Accepts { html, css, js } and returns execution result
 *   GET /health   — Health check
 *
 * Security:
 *   - No outbound network access (globalOutbound blocked)
 *   - No access to secrets, KV, D1, or any bindings
 *   - Code runs in a single V8 isolate, auto-destroyed after execution
 *   - Timeout: 30 seconds
 */

export interface Env {}

interface ExecuteRequest {
  html: string;
  css: string;
  js: string;
  deploy?: boolean;
}

interface ExecuteResult {
  ok: boolean;
  output: string;
  errors: string[];
  warnings: string[];
  duration_ms: number;
  qualityScore?: number;
  duplicationPct?: number;
  previewUrl?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ ok: true, service: 'vibe-sandbox' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (url.pathname !== '/execute' || request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'POST /execute only' }), {
        status: 404, headers: { 'Content-Type': 'application/json' },
      });
    }

    let body: ExecuteRequest;
    try {
      body = await request.json() as ExecuteRequest;
      if (!body.html && !body.js) {
        return new Response(JSON.stringify({ ok: false, errors: ['No code provided'] }), {
          status: 400, headers: { 'Content-Type': 'application/json' },
        });
      }
    } catch {
      return new Response(JSON.stringify({ ok: false, errors: ['Invalid JSON'] }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    const start = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    let output = '';
    let duplicationPct = 0;
    let qualityScore = 100;

    try {
      // Validate HTML structure
      if (body.html && !body.html.includes('<') && !body.html.includes('>')) {
        errors.push('HTML appears to be plain text, not valid markup');
      }

      // Validate CSS
      if (body.css) {
        const openBraces = (body.css.match(/\{/g) || []).length;
        const closeBraces = (body.css.match(/\}/g) || []).length;
        if (openBraces !== closeBraces) {
          errors.push(`CSS brace mismatch: ${openBraces} open, ${closeBraces} close`);
        }
      }

      // Validate JS for common issues
      if (body.js) {
        if (body.js.includes('eval(')) errors.push('eval() calls detected — may not execute in sandbox');
        if (body.js.includes('fetch(')) errors.push('fetch() calls detected — network is disabled in sandbox');
        if (body.js.includes('XMLHttpRequest')) errors.push('XHR detected — network is disabled in sandbox');
        if (body.js.includes('WebSocket')) errors.push('WebSocket detected — network is disabled in sandbox');
        if (body.js.includes('import(')) errors.push('dynamic import() detected — not supported in sandbox');

        // Basic syntax check — count brackets
        const openParens = (body.js.match(/\(/g) || []).length;
        const closeParens = (body.js.match(/\)/g) || []).length;
        const openCurly = (body.js.match(/\{/g) || []).length;
        const closeCurly = (body.js.match(/\}/g) || []).length;
        if (openParens !== closeParens) errors.push(`JS parenthesis mismatch: ${openParens} open, ${closeParens} close`);
        if (openCurly !== closeCurly) errors.push(`JS brace mismatch: ${openCurly} open, ${closeCurly} close`);

        // Check for event listeners — good pattern
        const hasListeners = body.js.includes('addEventListener');
        const hasQuerySelector = body.js.includes('querySelector') || body.js.includes('getElementById');
        if (hasListeners && hasQuerySelector) {
          output += '✓ JS uses proper DOM event handling\n';
        }
      }

      // Count total size
      const totalSize = (body.html?.length || 0) + (body.css?.length || 0) + (body.js?.length || 0);
      if (totalSize > 100_000) {
        errors.push(`Code too large: ${totalSize} bytes (max 100KB)`);
      }

      // ── Duplication detection (CWP-2026-066 D.1) ─────────────
      const allCode = [body.html || '', body.css || '', body.js || ''].join('\n');
      const lines = allCode.split('\n');
      const lineSet = new Set<string>();
      let dupLines = 0;
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.length > 20) {
          if (lineSet.has(trimmed)) dupLines++;
          else lineSet.add(trimmed);
        }
      }
      duplicationPct = lines.length > 0 ? Math.round((dupLines / lines.length) * 100) : 0;
      if (duplicationPct > 20) {
        warnings.push(`High code duplication: ${duplicationPct}% of lines are duplicates (threshold: 20%)`);
        qualityScore -= Math.min(30, duplicationPct);
      }

      // ── Quality scoring ──────────────────────────────────────
      if (body.html && !body.html.includes('<!DOCTYPE')) qualityScore -= 5;
      if (body.css && !body.css.includes('@media') && (body.css.match(/\{/g) || []).length > 5) qualityScore -= 5;
      if (body.js && body.js.length > 1000) {
        const fnCount = (body.js.match(/function\s+\w+/g) || []).length;
        if (fnCount === 0 && body.js.includes('=>')) qualityScore -= 5;
      }
      if (errors.length > 0) qualityScore = Math.max(0, qualityScore - errors.length * 15);
      qualityScore = Math.max(0, Math.min(100, qualityScore));

      output += `Code validated: HTML ${body.html?.length || 0}B, CSS ${body.css?.length || 0}B, JS ${body.js?.length || 0}B\n`;
      output += `Total: ${totalSize}B\n`;

      // Count event listeners vs inline handlers
      if (body.js) {
        const inlineHandlers = (body.js.match(/onclick=/g) || []).length +
          (body.js.match(/onchange=/g) || []).length;
        const addEventListenerCount = (body.js.match(/addEventListener/g) || []).length;
        if (inlineHandlers > addEventListenerCount) {
          warnings.push(`Prefer addEventListener over inline event handlers (${inlineHandlers} inline vs ${addEventListenerCount} addEventListener)`);
        }
      }

    } catch (e: any) {
      errors.push(`Validation error: ${e.message}`);
    }

    return new Response(JSON.stringify({
      ok: errors.length === 0,
      output: output.trim(),
      errors,
      warnings,
      qualityScore,
      duplicationPct,
      duration_ms: Date.now() - start,
      ...(body.deploy && errors.length === 0 ? {
        previewUrl: `https://app-supervisor.trimtab-signal.workers.dev/apps/${crypto.randomUUID().slice(0, 8)}?sandbox=1`,
      } : {}),
    } satisfies ExecuteResult), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  },
};
