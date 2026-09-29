import { readFileSync, existsSync, appendFileSync } from 'fs';

const SPOON_STATE_PATH = '/home/p31/P31-local-workspace/spoon-state.json';
const COG_PATH = '/tmp/phos-cognitive-state.json';
const EVENTS_PATH = '/tmp/phos-forge/events.jsonl';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_KEY = process.env.GROQ_API_KEY;
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
const GEMINI_KEY = process.env.GEMINI_API_KEY;

// Direct provider model mapping (bypasses LiteLLM entirely).
// Tier aliases map to exact OpenRouter model IDs (no openrouter/ prefix needed — default route is OpenRouter).
const TIER_MODELS = {
  scavenger: [
    'gemini/gemini-2.0-flash',
    'qwen/qwen3-coder:free',
    'nousresearch/hermes-3-llama-3.1-405b:free',
    'nvidia/nemotron-3-ultra-550b-a55b:free',
    'google/gemma-4-26b-a4b-it:free',
    'meta-llama/llama-3.3-70b-instruct:free',
    'deepseek/deepseek-v4-flash',
    'groq/llama-3.1-8b-instant',
    'openrouter/free',
  ],
  flash: [
    'anthropic/claude-3.5-haiku',
    'deepseek/deepseek-chat',
    'openrouter/free',
  ],
  premium: [
    'anthropic/claude-sonnet-4',
    'deepseek/deepseek-r1',
    'google/gemini-2.5-pro',
    'meta-llama/llama-3.3-70b-instruct:free',
    'openrouter/free',
  ],
};

function getBioState() {
  let spoons = 4;
  try {
    if (existsSync(SPOON_STATE_PATH)) {
      const s = JSON.parse(readFileSync(SPOON_STATE_PATH, 'utf-8'));
      if (typeof s.level === 'number') spoons = s.level;
    } else if (existsSync(COG_PATH)) {
      const c = JSON.parse(readFileSync(COG_PATH, 'utf-8'));
      if (typeof c.spoons === 'number') spoons = c.spoons;
      else if (typeof c.level === 'number') spoons = c.level;
    }
  } catch { /* fallback to default */ }
  return { spoons };
}

function emitTelemetry(intent, targetModel, fallbackUsed, sovereign, r = {}) {
  try {
    appendFileSync(
      EVENTS_PATH,
      JSON.stringify({
        type: 'router.decision',
        payload: {
          intent: intent.task,
          model: targetModel,
          sovereign,
          fallback_used: fallbackUsed,
          spoons: getBioState().spoons,
          ttft_ms: r.ttftMs ?? null,
          tps: r.tps ?? null,
          total_ms: r.totalMs ?? null,
          prompt_tokens: r.promptTokens ?? null,
          completion_tokens: r.completionTokens ?? null,
          cached_prompt_tokens: r.cachedPromptTokens ?? null,
          timestamp: new Date().toISOString(),
        },
      }) + '\n',
    );
  } catch { /* silent */ }
}

function modelToProvider(model) {
  if (model.startsWith('groq/')) return { url: GROQ_URL, key: GROQ_KEY, stripPrefix: 'groq/' };
  if (model.startsWith('gemini/')) return { url: GEMINI_URL, key: GEMINI_KEY, stripPrefix: 'gemini/' };
  return { url: OPENROUTER_URL, key: OPENROUTER_KEY, stripPrefix: 'openrouter/' };
}

async function callProvider(model, messages, maxTokens, temperature, timeoutMs) {
  const { url, key, stripPrefix } = modelToProvider(model);
  if (!key) throw new Error(`No API key configured for provider of model ${model}`);

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: model.replace(stripPrefix, ''),
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!resp.ok) throw new Error(`${model.split('/')[0]} HTTP ${resp.status}: ${await resp.text().catch(() => '')}`);
  const data = await resp.json();
  return data.choices?.[0]?.message?.content || '';
}

async function routeToLocalOllama(system, user, maxTokens, temperature) {
  const payload = {
    model: 'qwen2.5:1.5b',
    messages: [
      { role: 'system', content: `${system}\n\nYou are a sovereign agent. Output concise results.` },
      { role: 'user', content: user },
    ],
    stream: false,
    options: { num_predict: Math.min(maxTokens, 512), temperature },
  };
  const resp = await fetch('http://localhost:11434/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(180000),
  });
  if (!resp.ok) throw new Error(`Ollama HTTP ${resp.status}`);
  const data = await resp.json();
  return data.message?.content || '';
}

function validateResponse(text, maxTokens) {
  if (!text || typeof text !== 'string') return { ok: false, reason: 'empty-response' };
  const minQuality = Math.max(100, Math.floor(maxTokens * 0.1));
  if (maxTokens > 300 && text.trim().length < minQuality) {
    return { ok: false, reason: `output-too-short:${text.trim().length}<${minQuality}` };
  }
  return { ok: true, text };
}

// G3 — Cloudflare AI Gateway intent routing (Workers-AI-only).
// The gateway's p31-intent dynamic route owns model selection by
// `metadata.task`; the caller only tags intent. This keeps the model table
// in exactly one place (the gateway route), not duplicated in the Worker.
// Reads cf-aig-model / cf-aig-provider response headers for observability.
const GATEWAY_ID = process.env.GATEWAY_ID || 'p31-model-router';

// Direct Workers AI path — used when only a Workers AI API token (cfut_*)
// is available and no gateway token exists. Model selection is CATALOG-DRIVEN:
// intent → capability requirements → live probe of the Workers AI model
// catalog (models-catalog.json, refreshed by scripts/probe-models.mjs) →
// qualification → pick. No hardcoded model names. When Cloudflare adds or
// deprecates a model, the probe picks it up; the router never breaks on a
// stale hardcode.
const REQUIREMENTS_BY_INTENT = {
  // Frontier synthesis: long context, reasoning, function calling, highest price (quality proxy).
  synthesis: { reasoning: true, contextMin: 200_000, functionCalling: true, rank: 'highest-price' },
  // Coding: function calling + long context + "code" in the description, highest price.
  coding: { functionCalling: true, contextMin: 100_000, nameMatch: /code|coder/i, rank: 'highest-price' },
  // Reasoning: reasoning flag + solid context, highest price.
  reasoning: { reasoning: true, contextMin: 60_000, rank: 'highest-price' },
  // Fast throughput: function calling + LONG context, lowest price ABOVE a
  // quality floor (price >= 0.10/M input) so we never pick a micro model.
  fast: { functionCalling: true, contextMin: 256_000, priceFloorUsdPerM: 0.10, rank: 'lowest-price' },
  // General default: function calling + reasonable context, median price.
  general: { functionCalling: true, contextMin: 60_000, rank: 'median-price' },
}

let _catalog = null
function loadCatalog() {
  if (_catalog) return _catalog
  try {
    const path = '/home/p31/P31-local-workspace/tools/phos-forge/models-catalog.json'
    _catalog = JSON.parse(readFileSync(path, 'utf8')).models ?? []
  } catch {
    _catalog = []
  }
  return _catalog
}

function selectModel(tag) {
  const req = REQUIREMENTS_BY_INTENT[tag] || REQUIREMENTS_BY_INTENT.general
  const catalog = loadCatalog()
  if (catalog.length === 0) {
    throw new Error('[router] no model catalog — run: node tools/phos-forge/scripts/probe-models.mjs')
  }

  let candidates = catalog.filter((m) => m.contextWindow > 0)
  if (req.functionCalling) candidates = candidates.filter((m) => m.functionCalling)
  if (req.reasoning) candidates = candidates.filter((m) => m.reasoning)
  if (req.contextMin) candidates = candidates.filter((m) => m.contextWindow >= req.contextMin)
  if (req.priceFloorUsdPerM) {
    candidates = candidates.filter((m) => (m.priceInUsdPerM ?? 0) >= req.priceFloorUsdPerM)
  }
  if (req.nameMatch) {
    const scored = candidates.filter((m) => req.nameMatch.test(m.name + ' ' + m.description))
    if (scored.length > 0) candidates = scored
  }

  if (candidates.length === 0) {
    // Fall back to the general tier, loudly.
    candidates = catalog.filter((m) => m.functionCalling && m.contextWindow >= 60_000)
    console.error(`[router] no qualified model for intent "${tag}" — falling back to general`)
  }

  const price = (m) => m.priceInUsdPerM ?? m.priceOutUsdPerM ?? 0
  if (req.rank === 'lowest-price') {
    candidates.sort((a, b) => price(a) - price(b))
  } else if (req.rank === 'highest-price') {
    candidates.sort((a, b) => price(b) - price(a))
  } else {
    // median-price
    candidates.sort((a, b) => price(a) - price(b))
    const mid = Math.floor(candidates.length / 2)
    candidates = [candidates[mid]]
  }

  return candidates[0]?.name ?? null
}

const MODEL_BY_INTENT = {} // removed — selection is catalog-driven via selectModel()

const WORKERS_AI_BASE = (accountId) =>
  `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/v1/chat/completions`;

async function routeToWorkersAI(system, user, intentTag, maxTokens, temperature, timeoutMs = 120000, opts = {}) {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CF_API_TOKEN;
  if (!accountId || !token) {
    throw new Error('[router] Workers AI not configured: CLOUDFLARE_ACCOUNT_ID / CF_API_TOKEN unset');
  }
  // Explicit model override for fallback chains (convergence Layer 4). When
  // absent, the catalog-driven selectModel picks by intent capability.
  const model = opts.model ?? selectModel(intentTag);
  if (!model) throw new Error(`[router] no model selected for intent "${intentTag}" (catalog empty?)`);

  // Reasoning models (GLM, Kimi, DeepSeek-R, QwQ) burn the output token budget
  // on chain-of-thought first, emitting NO visible content when the reasoning
  // exhausts the completion cap. The documented fix (cloudflare/ai
  // workers-ai-provider@3.1.12) is to forward `reasoning_effort` so the model
  // does not starve the response. Default to 'low' for synthesis-like work;
  // callers may override. This is the ROOT-CAUSE fix for convergence stalling.
  const reasoningEffort = opts.reasoningEffort ?? 'low';

  // Transient empty-content / 5xx retries. Workers AI can return an empty
  // `content` under burst (reasoning models especially). A single empty
  // response should NOT kill an entire jitterbug run — retry with backoff.
  // 4xx (auth/validation) is fatal and NOT retried; 5xx + empty are retried.
  const MAX_ATTEMPTS = 4;
  let lastRetryable = null;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const callStart = performance.now();
    try {
      const resp = await fetch(WORKERS_AI_BASE(accountId), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          // x-session-affinity routes requests to the model instance holding
          // the cached prefix tensors, maximizing Workers AI prompt-cache hits.
          ...(opts.sessionId ? { 'x-session-affinity': opts.sessionId } : {}),
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
          max_tokens: maxTokens,
          temperature,
          reasoning_effort: reasoningEffort,
        }),
        signal: AbortSignal.timeout(timeoutMs),
      });
      const timeToFirstByte = performance.now() - callStart; // time to response headers
      if (!resp.ok) {
        const body = await resp.text().catch(() => '');
        const err = new Error(`[router] Workers AI ${resp.status} (${model}): ${body.slice(0, 200)}`);
        err.fatal = resp.status >= 400 && resp.status < 500;
        lastRetryable = err;
        if (err.fatal) throw err; // fatal: unwind directly
        throw err; // retryable: caught below, loop continues
      }
      const data = await resp.json();
      const msg = data.choices?.[0]?.message ?? {};
      const content = msg.content ?? msg.reasoning_content ?? '';
      if (content) {
        const usage = data.usage ?? {};
        const promptTokens = usage.prompt_tokens ?? 0;
        const completionTokens = usage.completion_tokens ?? 0;
        const totalMs = performance.now() - callStart;
        // Non-streaming Workers AI returns the full body at once; headers
        // arrive at ~completion, so timeToFirstByte ~= total time. The honest
        // throughput metric is completion_tokens / total time (includes prefill).
        const effectiveTps = totalMs > 0 && completionTokens > 0
          ? (completionTokens / totalMs) * 1000 : 0;
        return {
          content,
          modelUsed: model,
          ttftMs: Math.round(timeToFirstByte),
          tps: Math.round(effectiveTps * 10) / 10,
          totalMs: Math.round(totalMs),
          promptTokens,
          completionTokens,
          cachedPromptTokens: usage.prompt_tokens_details?.cached_tokens
            ?? (typeof usage.cached_tokens === 'number' ? usage.cached_tokens : 0),
        };
      }
      lastRetryable = new Error(`[router] Workers AI returned empty content (${model})`);
      throw lastRetryable;
    } catch (e) {
      if (e.fatal) throw e; // 4xx — do NOT retry
      // retryable + transport errors: loop continues to backoff
    }
    if (attempt < MAX_ATTEMPTS) {
      // Exponential backoff: 1s, 4s, 9s — Workers AI throttles big models
      // under burst; a too-short retry just hits the same empty window.
      await new Promise((r) => setTimeout(r, attempt * attempt * 1000));
    }
  }
  throw lastRetryable ?? new Error(`[router] Workers AI failed (${model})`);
}

async function routeToGateway(system, user, maxTokens, temperature, task) {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const aigToken = process.env.CF_AIG_TOKEN;
  if (!accountId || !aigToken) {
    throw new Error('[router] gateway not configured: CLOUDFLARE_ACCOUNT_ID / CF_AIG_TOKEN unset');
  }

  const res = await fetch(
    `https://gateway.ai.cloudflare.com/v1/${accountId}/${GATEWAY_ID}/compat/chat/completions`,
    {
      method: 'POST',
      headers: {
        'cf-aig-authorization': `Bearer ${aigToken}`,
        'cf-aig-metadata': JSON.stringify({ task }), // 1 flat entry, under the 5-entry limit
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dynamic/p31-intent',
        messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
        max_tokens: maxTokens,
        temperature,
      }),
      signal: AbortSignal.timeout(180000),
    },
  );
  if (!res.ok) throw new Error(`[router] gateway ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const json = await res.json();
  return {
    content: json.choices?.[0]?.message?.content ?? '',
    modelUsed: res.headers.get('cf-aig-model'),
    providerUsed: res.headers.get('cf-aig-provider'),
  };
}

export async function dispatchLLM(system, user, intent = {}, opts = {}) {
  const bio = getBioState();
  const isSovereign = intent.privacy === 'sovereign';
  const task = intent.task || 'research';
  const maxTokens = opts.maxTokens || 4096;
  const temperature = opts.temperature ?? 0.7;
  const messages = [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];

  // 1. Sovereign → local Ollama (bypass all cloud)
  if (isSovereign) {
    const content = await routeToLocalOllama(system, user, maxTokens, temperature);
    emitTelemetry(intent, 'ollama/qwen2.5:1.5b', false, true);
    return content;
  }

  // 1.5 Gateway → Cloudflare AI Gateway dynamic route (Workers-AI-only).
  // The route owns model selection by metadata.task; we only tag intent.
  if (intent.privacy === 'gateway') {
    const task = intent.task || 'general';
    const { content, modelUsed, providerUsed } = await routeToGateway(
      system, user, maxTokens, temperature, task,
    );
    emitTelemetry(intent, `${providerUsed}/${modelUsed}`, false, false);
    return content;
  }

  // 1.6 Workers AI direct — intent-tagged routing inside the router.
  // Used when only a Workers AI API token is available (no gateway token).
  // The intent→model table lives in this router (single source of truth).
  if (intent.privacy === 'workers-ai') {
    const tag = intent.tag || 'general';
    const r = await routeToWorkersAI(
      system, user, tag, maxTokens, temperature, opts.timeoutMs ?? 120000, opts,
    );
    emitTelemetry(intent, r.modelUsed, false, false, r);
    return opts.returnModel ? r : r.content;
  }

  // 2. Select tier based on spoons + task
  let tier;
  if (task === 'code' || task === 'synthesis') {
    tier = bio.spoons >= 4 ? 'premium' : 'flash';
  } else if (task === 'research') {
    tier = 'scavenger';
  } else {
    tier = 'flash';
  }

  const models = TIER_MODELS[tier];

  // 3. Try models in tier order (fallback within tier)
  let lastError;
  for (const model of models) {
    try {
      const content = await callProvider(model, messages, maxTokens, temperature, opts.timeoutMs ?? 60000);
      const val = validateResponse(content, maxTokens);
      if (val.ok) {
        emitTelemetry(intent, model, false, false);
        return val.text;
      }
      lastError = new Error(`Quality gate: ${val.reason}`);
    } catch (e) {
      lastError = e;
      // Try next model in tier
    }
  }

  throw new Error(
    `[router] All models in tier "${tier}" failed. Last error: ${lastError?.message || 'unknown'}`,
  );
}

// Exports for negative controls / programmatic use.
export { routeToWorkersAI, selectModel, loadCatalog, REQUIREMENTS_BY_INTENT, routeToGateway }





























