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
// Tier aliases map to verified available OpenRouter + Groq + Gemini models.
const TIER_MODELS = {
  scavenger: [
    'gemini/gemini-2.0-flash',
    'openrouter/qwen/qwen3-coder:free',
    'openrouter/nousresearch/hermes-3-llama-3.1-405b:free',
    'openrouter/nvidia/nemotron-3-ultra-550b-a55b:free',
    'openrouter/google/gemma-4-26b-a4b-it:free',
    'meta-llama/llama-3.3-70b-instruct:free',
    'deepseek/deepseek-v4-flash',
    'groq/llama-3.1-8b-instant',
    'openrouter/free',
  ],
  flash: [
    'openrouter/anthropic/claude-3.5-haiku-20241022',
    'openrouter/deepseek/deepseek-chat',
    'openrouter/free',
  ],
  premium: [
    'openrouter/anthropic/claude-sonnet-4-20250514',
    'openrouter/deepseek/deepseek-r1',
    'openrouter/google/gemini-2.5-pro',
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

function emitTelemetry(intent, targetModel, fallbackUsed, sovereign) {
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
