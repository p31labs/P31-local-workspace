import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { parseIntent } from './intent-parser';
import { generateCapabilityPlan } from './capability-planner';
import { createQuote } from './quote-generator';
import { needleReady, needleMetrics } from './needle-engine';

type Passport = { baselineSpoons?: number; [key: string]: unknown };

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
}

type Env = {
  PASSPORT_KV: KVNamespace;
  INTENT_CACHE_TTL?: string;
  LOVE_LEDGER: D1Database;
  NEEDLE_WEIGHTS: R2Bucket;
};

const app = new Hono<{ Bindings: Env }>();

// POST /intent — parse intent and return a Creation Quote (NO execution).
const intentSchema = z.object({
  prompt: z.string().min(1),
  did: z.string().optional(),
  settlement_preference: z.enum(['love', 'usdc', 'auto']).default('auto'),
  spoons: z.number().min(0).max(5).optional(),
});

app.post('/intent', zValidator('json', intentSchema), async (c) => {
  const { prompt, did, settlement_preference, spoons: spoonOverride } = c.req.valid('json');

  // Axis-7: edge-cache identical intents via Cloudflare Cache API
  const cacheKey = new Request(`https://intent-resolver.cache/${await sha256Hex(JSON.stringify({ prompt, did, settlement_preference, spoonOverride }))}`);
  const cache = caches.default;
  const cached = await cache.match(cacheKey);
  if (cached) {
    return new Response(cached.body, { headers: cached.headers, status: 200 });
  }

  // Resolve identity from Passport KV (or DID).
  const passport = did ? await c.env.PASSPORT_KV.get<Passport>(`passport:${did}`, { type: 'json' }) : null;
  if (!passport && did) {
    return c.json({ error: 'Cognitive Passport registry entry missing' }, 404);
  }

  const spoons = spoonOverride ?? passport?.baselineSpoons ?? 3;

  const intent = await parseIntent(prompt, passport, spoons, c.env);
  const plan = generateCapabilityPlan(intent);
  const quote = await createQuote(plan, passport, spoons, settlement_preference);

  // Axis-4 (telemetry): record intent -> quote for heuristic tuning.
  const intentHash = await sha256Hex(JSON.stringify({ prompt, did, spoons }));
  c.executionCtx?.waitUntil(
    c.env.LOVE_LEDGER.prepare(`
      INSERT INTO quote_signals (intent_hash, raw_intent, generated_quote, settlement_unit, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      intentHash,
      JSON.stringify({ prompt, did, spoons }),
      JSON.stringify(quote),
      quote.recommended_unit,
      Date.now(),
    ).run()
  );

  const resp = c.json({
    intent: intent.summary,
    plan: {
      tools: plan.tools,
      needle_used: plan.needle_used,
      ...(intent.fallback_reason ? { fallback_reason: intent.fallback_reason } : {}),
    },
    quote: {
      spoons_saved: quote.spoons_saved,
      care_value: quote.care_value,
      time_returned_minutes: quote.time_returned_minutes,
      settlement: {
        love: quote.love_amount,
        usdc: quote.usdc_amount,
        recommended: quote.recommended_unit,
      },
    },
    surface: plan.a2ui_surface,
  });
  const ttl = Number(c.env.INTENT_CACHE_TTL ?? 3600);
  resp.headers.set('Cache-Control', `max-age=${ttl}, stale-while-revalidate=60`);
  c.executionCtx?.waitUntil(cache.put(cacheKey, resp.clone()));
  return resp;
});

app.get('/health', (c) => c.json({
  status: 'ok',
  service: 'intent-resolver',
  needle: {
    ready: needleReady(),
    ...needleMetrics(),
  },
}));

export default app;
