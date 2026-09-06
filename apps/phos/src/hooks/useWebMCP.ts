/**
 * useWebMCP — Registers browser-native WebMCP tools for PHOS surfaces.
 *
 * Called once at the app root (main.tsx). Registers tools with Chrome's
 * built-in browser agent via `document.modelContext.registerTool()`.
 * Falls back to `navigator.modelContext` for Chrome 149 compatibility.
 * Tools are tab-bound and ephemeral — they exist only while PHOS is open
 * in a visible browser tab.
 *
 * WebMCP Origin Trial: Chrome 149 → 156, expires Nov 16, 2026.
 * P31 holds tokens for p31ca.org and phosphorus31.org.
 */
import { useEffect } from 'react';

declare global {
  interface Document {
    modelContext?: {
      registerTool(config: {
        name: string;
        description: string;
        inputSchema?: Record<string, unknown>;
        handler: (params: Record<string, unknown>) => Promise<{ content: Array<{ type: string; text: string }> }>;
      }): Promise<void>;
    };
  }
  interface Navigator {
    modelContext?: Document['modelContext'];
  }
}

export function useWebMCP() {

  useEffect(() => {
    const ctx = (document as any).modelContext || (navigator as any).modelContext;
    if (!ctx?.registerTool) return;

    const register = (name: string, description: string, inputSchema: Record<string, unknown> | undefined, fn: (args: Record<string, unknown>) => Promise<string>) => {
      ctx.registerTool({
        name,
        description,
        ...(inputSchema ? { inputSchema } : {}),
        handler: async (params) => {
          const text = await fn(params);
          return { content: [{ type: 'text', text }] };
        },
      }).catch(() => { /* tool registration is best-effort */ });
    };

    register(
      'phos_set_spoons',
      'Adjust the spoon level (0-5) for neuroadaptive UI. 0 triggers crisis mode, 4-5 enables full motion effects.',
      {
        type: 'object',
        properties: { level: { type: 'number', description: 'Spoon level from 0 to 5', minimum: 0, maximum: 5 } },
        required: ['level'],
      },
      async ({ level }) => {
        const lv = Math.max(0, Math.min(5, Number(level ?? 4)));
        document.documentElement.setAttribute('data-spoons', String(lv));
        window.dispatchEvent(new CustomEvent('spoons:changed', { detail: { level: lv } }));
        return JSON.stringify({ ok: true, spoons: lv });
      },
    );

    register(
      'phos_navigate',
      'Navigate to a specific PHOS route (e.g. /hearth, /passport, /vault, /ledger).',
      {
        type: 'object',
        properties: { path: { type: 'string', description: 'Internal PHOS route path' } },
        required: ['path'],
      },
      async ({ path }) => {
        const p = String(path ?? '/');
        window.location.href = p.startsWith('/') ? p : `/${p}`;
        return JSON.stringify({ ok: true, navigated: p });
      },
    );

    register(
      'phos_get_care_score',
      'Retrieve the current care score from the PHOS dashboard (spoons, love, mesh, rituals weighted).',
      undefined,
      async () => {
        const el = document.querySelector('[data-care-score]');
        const score = el?.getAttribute('data-care-score') ?? 'unavailable';
        const spoons = document.documentElement.getAttribute('data-spoons') ?? '4';
        return JSON.stringify({ careScore: Number(score) || 0, spoons: Number(spoons), formula: 'spoons*0.40 + love*0.30 + mesh*0.20 + rituals*0.10' });
      },
    );

    register(
      'phos_toggle_drawer',
      'Open or close the PHOS Magic Drawer sidebar panel.',
      {
        type: 'object',
        properties: { open: { type: 'boolean', description: 'true to open, false to close' } },
        required: ['open'],
      },
      async ({ open }) => {
        const drawer = document.querySelector('[data-mcp-target="magic-drawer"]') as HTMLElement;
        if (drawer) {
          if (open) drawer.setAttribute('open', '');
          else drawer.removeAttribute('open');
          window.dispatchEvent(new CustomEvent(open ? 'open' : 'close', { detail: { target: 'magic-drawer' } }));
          return JSON.stringify({ ok: true, drawer: open ? 'opened' : 'closed' });
        }
        return JSON.stringify({ ok: false, error: 'Drawer element not found' });
      },
    );

    register(
      'phos_switch_theme',
      'Switch the PHOS biological theme (cyber-green, neural-violet, warm-amber, cool-ice).',
      {
        type: 'object',
        properties: { theme: { type: 'string', description: 'Theme name: cyber-green | neural-violet | warm-amber | cool-ice' } },
        required: ['theme'],
      },
      async ({ theme }) => {
        const valid = ['cyber-green', 'neural-violet', 'warm-amber', 'cool-ice'];
        const t = valid.includes(String(theme)) ? String(theme) : 'neural-violet';
        document.documentElement.setAttribute('data-theme', t);
        return JSON.stringify({ ok: true, theme: t });
      },
    );
  }, []);
}
