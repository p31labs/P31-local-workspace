/**
 * PHOS AI Proxy — zero-retention edge gateway
 *
 * Routes:
 *   POST /              — Chat completion via Workers AI (existing)
 *   POST /transcribe    — Audio transcription via Whisper (existing)
 *   POST /ai/*          — Edge AI backend proxy with auth injection (CVE-2026-29779)
 *   POST /jitterbug/*   — Jitterbug API proxy with PSK injection (CVE-2026-29779)
 *   GET  /health        — Health check
 *
 * Secrets: EDGE_AI_TOKEN, JITTERBUG_PSK (set via wrangler secret)
 */

const ALLOWED_ORIGINS = [
  'https://phos.p31ca.org',
  'https://phos-btn.pages.dev',
  'http://localhost:4321',
];

interface ChatMessage {
  role: string;
  content: string;
}

interface RequestBody {
  messages: ChatMessage[];
  model?: string;
  max_tokens?: number;
  temperature?: number;
}

const DEFAULT_MODEL = '@cf/meta/llama-3.1-8b-instruct-fast';

function jsonResponse(data: any, status = 200, origin: string): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': origin,
      'Cache-Control': 'no-store',
    },
  });
}

function corsHeaders(origin: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

async function proxyRequest(
  targetUrl: URL,
  request: Request,
  extraHeaders: Record<string, string>,
): Promise<Response> {
  const headers = new Headers(request.headers);
  for (const [key, value] of Object.entries(extraHeaders)) {
    headers.set(key, value);
  }
  headers.delete('Host');

  const forwarded = new Request(targetUrl.toString(), {
    method: request.method,
    headers,
    body: request.body,
  });

  return fetch(forwarded);
}

export interface Env {
  AI: any;
  EDGE_AI_TOKEN: string;
  JITTERBUG_PSK=***REDACTED***
  EDGE_AI_URL?: string;
  JITTERBUG_API_URL?: string;
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    const origin = req.headers.get('Origin') || '';
    const cors = ALLOWED_ORIGINS.includes(origin) ? origin : '';

    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(cors) });
    }

    // ── Health Check ─────────────────────────────────────────────────────
    if (url.pathname === '/health') {
      return jsonResponse({ status: 'ok', service: 'phos-ai-proxy' }, 200, cors);
    }

    // ── Whisper Transcription ─────────────────────────────────────────────
    if (req.method === 'POST' && url.pathname === '/transcribe') {
      try {
        const formData = await req.formData();
        const audio = formData.get('audio');
        if (!audio || !(audio instanceof File)) {
          return jsonResponse({ error: 'Missing audio file' }, 400, cors);
        }
        const arrayBuffer = await audio.arrayBuffer();
        const audioData = new Uint8Array(arrayBuffer);
        const result = await env.AI.run(
          '@cf/openai/whisper-large-v3-turbo',
          { audio: audioData }
        );
        return jsonResponse({ text: (result as any).text || '' }, 200, cors);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Transcription failed';
        return jsonResponse({ error: message }, 502, cors);
      }
    }

    // ── AI Chat (Workers AI — existing) ──────────────────────────────────
    if (url.pathname === '/' || url.pathname === '/chat') {
      const body: RequestBody = await req.json();
      if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
        return new Response('Missing or invalid messages', { status: 400 });
      }
      try {
        const result = await env.AI.run(body.model || DEFAULT_MODEL, {
          messages: body.messages,
          max_tokens: body.max_tokens ?? 512,
          temperature: body.temperature ?? 0.7,
          stream: false,
        });
        const response = (result as any).response || '';
        return jsonResponse({ result: { response } }, 200, cors);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Inference failed';
        return jsonResponse({ error: message }, 502, cors);
      }
    }

    // ── Edge AI Proxy (CVE-2026-29779) ───────────────────────────────────
    if (req.method === 'POST' && url.pathname.startsWith('/ai/')) {
      const edgeAiUrl = env.EDGE_AI_URL || 'https://phos-ai-backend.trimtab-signal.workers.dev';
      const target = new URL(edgeAiUrl + url.pathname);
      for (const [key, value] of url.searchParams) {
        target.searchParams.set(key, value);
      }
      return proxyRequest(target, req, {
        Authorization: `Bearer ${env.EDGE_AI_TOKEN}`,
      });
    }

    // ── Jitterbug Proxy (CVE-2026-29779) ─────────────────────────────────
    if (url.pathname.startsWith('/jitterbug/')) {
      const jitterbugUrl = env.JITTERBUG_API_URL || 'https://jitterbug-api.trimtab-signal.workers.dev';
      const target = new URL(jitterbugUrl + url.pathname);
      for (const [key, value] of url.searchParams) {
        target.searchParams.set(key, value);
      }
      if (env.JITTERBUG_PSK) {
        target.searchParams.set('psk', env.JITTERBUG_PSK);
      }
      return proxyRequest(target, req, {
        Authorization: `Bearer ${env.JITTERBUG_PSK}`,
      });
    }

    return jsonResponse({ error: 'Not found' }, 404, cors);
  },
};
