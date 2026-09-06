/**
 * P31 Edge Render Worker
 *
 * Generates tokenized, WebMCP-annotated HTML pages at the edge.
 * Supports:
 *   GET  /?spoons=3&brand=phos       — Personalization page
 *   GET  /health                       — Health check
 *   POST /a2ui/render                  — A2UI v0.9 declarative UI render
 */

import { tokensToCSS } from './tokens';
import { renderPage } from './renderer';
import { renderA2UI, type A2UIPayload } from './a2ui-renderer';
import designSystem from './design-system.json';

export interface Env {
  EDGE_RENDER_KV?: KVNamespace;
}

const DEFAULT_SPOONS = 3;
const DEFAULT_BRAND = 'p31ca';
const VALID_BRANDS = ['p31ca', 'phos', 'willow', 'bonding', 'phosphorus31', 'agent'];

const TOKEN_CSS = tokensToCSS(designSystem.tokens);
const CACHE_KEY_PREFIX = 'p31-edge-render:';

function clampSpoons(n: number): number {
  return Math.max(0, Math.min(5, Math.round(n)));
}

function parseQuery(url: URL): { spoons: number; brand: string } {
  const spoonsRaw = url.searchParams.get('spoons');
  const spoons = spoonsRaw ? parseInt(spoonsRaw, 10) : DEFAULT_SPOONS;
  const brandRaw = url.searchParams.get('brand');
  const brand = brandRaw && VALID_BRANDS.includes(brandRaw) ? brandRaw : DEFAULT_BRAND;
  return { spoons, brand };
}

function buildCacheKey(spoons: number, brand: string): string {
  return `${CACHE_KEY_PREFIX}${brand}:${spoons}`;
}

async function tryServeFromCache(request: Request, env: Env, cacheKey: string): Promise<Response | null> {
  const cache = caches.default;
  const cached = await cache.match(request);
  if (cached) return cached;
  if (env.EDGE_RENDER_KV) {
    const kvCached = await env.EDGE_RENDER_KV.get(cacheKey);
    if (kvCached) {
      const response = new Response(kvCached, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=300, s-maxage=600',
          'X-Cache': 'KV',
          'Access-Control-Allow-Origin': '*',
        },
      });
      await cache.put(request, response.clone());
      return response;
    }
  }
  return null;
}

function buildHTMLResponse(html: string, cacheLabel: string): Response {
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=600',
      'X-Cache': cacheLabel,
      'X-Generator': 'p31-edge-render/1.0',
      'X-Protocol-Version': '2026-07-28',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

function handleHealth(): Response {
  const tokenCount = TOKEN_CSS.split(';').filter(l => l.trim().startsWith('--p31-')).length;
  return jsonResponse({
    status: 'ok',
    version: '1.0.0',
    protocol: '2026-07-28',
    tokens: tokenCount,
    brands: VALID_BRANDS,
    ts: new Date().toISOString(),
  });
}

async function handleA2UI(request: Request): Promise<Response> {
  let payload: A2UIPayload;
  try {
    payload = await request.json() as A2UIPayload;
  } catch {
    return jsonResponse({ error: 'Invalid JSON body', status: 'error' }, 400);
  }

  const components = payload.components || payload.surface?.components || [];
  if (components.length === 0) {
    return jsonResponse({ error: 'No components in payload', status: 'error' }, 400);
  }

  // Extract spoon level from component props if present
  let spoons = DEFAULT_SPOONS;
  const spoonComp = components.find(c => c.component === 'SpoonDial' || c.component === 'SpoonMeter');
  if (spoonComp && spoonComp.props && typeof spoonComp.props.spoons === 'number') {
    spoons = clampSpoons(spoonComp.props.spoons as number);
  }

  const html = renderA2UI(payload, {
    spoonLevel: spoons,
    brand: DEFAULT_BRAND,
    tokenCSS: TOKEN_CSS,
  });

  return buildHTMLResponse(html, 'A2UI');
}

async function handlePageRender(request: Request, env: Env): Promise<Response> {
  const { spoons, brand } = parseQuery(new URL(request.url));
  const cacheKey = buildCacheKey(spoons, brand);

  const cachedResponse = await tryServeFromCache(request, env, cacheKey);
  if (cachedResponse) return cachedResponse;

  const html = renderPage({
    spoons,
    brand,
    tokenCSS: TOKEN_CSS,
    title: `P31 · ${brand} · ${spoons}/5 spoons`,
  });

  const response = buildHTMLResponse(html, 'MISS');
  const cache = caches.default;
  await cache.put(request, response.clone());
  return response;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' },
      });
    }

    // Routes
    switch (url.pathname) {
      case '/health':
        return handleHealth();

      case '/a2ui/render':
        if (request.method !== 'POST') {
          return jsonResponse({ error: 'Use POST' }, 405);
        }
        return handleA2UI(request);

      case '/':
      case '/render':
        if (request.method !== 'GET') {
          return jsonResponse({ error: 'Use GET' }, 405);
        }
        return handlePageRender(request, env);

      default:
        return jsonResponse({ error: 'Not found', paths: ['/', '/render', '/a2ui/render', '/health'] }, 404);
    }
  },
};
