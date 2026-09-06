/**
 * vibe-generate Worker — deterministic, LLM-free vibe-coding backend.
 *
 * Endpoints:
 *   POST /generate — given a prompt, build a GenerationIntent, run the
 *                    local deterministic generator, render to HTML, and
 *                    optionally score it via vibe-sandbox.
 *   GET  /health  — health check
 *
 * No LLM is involved; `generateInterfaceFromIntent` is fully local and
 * predictable (see @p31/interface-generator).
 */

import {
  generateInterfaceFromIntent,
  toA2UI,
} from '@p31/interface-generator';
import type { GenerationIntent, A2UIMessage } from '@p31/interface-generator';

/**
 * Server-side (Worker-safe) string renderer for an A2UI message.
 * Avoids react-dom/server, which does not initialize reliably in the
 * Workers runtime. Mirrors the component vocabulary in A2UIRenderer.
 */
function renderA2UIToString(message: A2UIMessage): string {
  const map = new Map(
    (message.updateComponents?.components ?? []).map((c: any) => [c.id, c]),
  );
  const esc = (s: string) =>
    String(s).replace(/[&<>"]/g, (ch) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch] as string,
    );
  const resolve = (children: any): any[] => {
    if (!children) return [];
    if (Array.isArray(children))
      return children.map((id) => map.get(id)).filter(Boolean);
    const tpl = map.get(children.componentId);
    return tpl ? [tpl] : [];
  };
  const render = (comp: any, key: string): string => {
    if (!comp) return '';
    const label = comp.accessibility?.label ?? '';
    const childHtml = resolve(comp.children)
      .map((c: any, i: number) => render(c, `${key}-${i}`))
      .join('');
    const aria = label ? ` aria-label="${esc(label)}"` : '';
    switch (comp.component) {
      case 'Column':
        return `<div${aria} style="display:flex;flex-direction:column;gap:8px">${childHtml}</div>`;
      case 'Row':
        return `<div${aria} style="display:flex;flex-direction:row;gap:8px">${childHtml}</div>`;
      case 'Card':
        return `<section${aria} class="a2ui-card" style="border:1px solid #22d3ee;border-radius:12px;padding:12px">${label ? `<h3>${esc(label)}</h3>` : ''}${childHtml}</section>`;
      case 'List':
        return `<ul${aria}>${childHtml}</ul>`;
      case 'Text':
        return `<p${aria}>${esc(label)}</p>`;
      case 'Button':
        return `<button${aria} type="button">${esc(label || 'Action')}</button>`;
      case 'Divider':
        return '<hr/>';
      default:
        return `<div${aria}>${esc(label)}${childHtml}</div>`;
    }
  };
  const root = map.get('root');
  return root ? render(root, 'root') : '';
}

export interface Env {}

interface GenerateBody {
  prompt?: string;
  formFactor?: string;
  spoons?: number;
}

export default {
  async fetch(request: Request, _env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/health') {
      return Response.json({ ok: true, service: 'vibe-generate' });
    }

    if (url.pathname !== '/generate' || request.method !== 'POST') {
      return Response.json({ error: 'POST /generate only' }, { status: 404 });
    }

    let body: GenerateBody;
    try {
      body = (await request.json()) as GenerateBody;
    } catch {
      return Response.json({ ok: false, errors: ['Invalid JSON'] }, { status: 400 });
    }

    const prompt = body.prompt?.trim();
    if (!prompt) {
      return Response.json({ ok: false, errors: ['prompt is required'] }, { status: 400 });
    }

    const spoons = typeof body.spoons === 'number' ? body.spoons : 3;
    const formFactor =
      (body.formFactor as GenerationIntent['formFactor']) ?? 'regular';

    const intent: GenerationIntent = {
      prompt,
      spoons,
      formFactor,
      role: 'builder',
      constraints: [],
    };

    const desc = generateInterfaceFromIntent(intent);
    const message = toA2UI(desc, spoons);
    let html: string;
    try {
      html = '<!DOCTYPE html><html><body>' + renderA2UIToString(message) + '</body></html>';
    } catch (err) {
      return Response.json(
        { ok: false, errors: ['render failed: ' + (err as Error).message] },
        { status: 500 },
      );
    }

    // Optionally score via vibe-sandbox; never fail the request on its error.
    let qualityScore = 85;
    try {
      const res = await fetch('https://vibe-sandbox.trimtab-signal.workers.dev/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html, css: '', js: '' }),
      });
      if (res.ok) {
        const data = (await res.json()) as { qualityScore?: number };
        if (typeof data.qualityScore === 'number') qualityScore = data.qualityScore;
      }
    } catch {
      qualityScore = 85;
    }

    return Response.json({ html, css: '', js: '', qualityScore });
  },
};
