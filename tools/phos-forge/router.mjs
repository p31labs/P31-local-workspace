import { readFileSync, existsSync } from 'fs';

const COGNITIVE_STATE_PATH = '/tmp/phos-cognitive-state.json';
const SPOON_STATE_PATH = '/home/p31/P31-local-workspace/spoon-state.json';

function getBioState() {
  let spoons = 4;
  try {
    if (existsSync(SPOON_STATE_PATH)) {
      const s = JSON.parse(readFileSync(SPOON_STATE_PATH, 'utf-8'));
      if (typeof s.level === 'number') spoons = s.level;
    } else if (existsSync(COGNITIVE_STATE_PATH)) {
      const c = JSON.parse(readFileSync(COGNITIVE_STATE_PATH, 'utf-8'));
      if (typeof c.spoons === 'number') spoons = c.spoons;
      else if (typeof c.level === 'number') spoons = c.level;
    }
  } catch (e) { /* silent fail, use default */ }
  return { spoons };
}

const MODEL_MAP = {
  LiteLLM: {
    research: 'phos-fast-buffer',
    synthesis: 'reasoning',
    code: 'code',
    fast: 'phos-fast-buffer',
  },
  OpenRouter: {
    research: 'openrouter/anthropic/claude-3.5-haiku-20241022',
    synthesis: 'openrouter/anthropic/claude-sonnet-4-20250514',
    code: 'openrouter/deepseek/deepseek-coder',
    fast: 'openrouter/anthropic/claude-3.5-haiku-20241022',
  },
  local: {
    sovereign: 'qwen2.5:1.5b',
  },
};

function validateResponse(text, maxTokens, opts = {}) {
  if (!text || typeof text !== 'string') return { ok: false, reason: 'empty-response' };
  const minQuality = opts.minQualityChars ?? Math.max(100, Math.floor(maxTokens * 0.1));
  if (maxTokens > 300 && text.trim().length < minQuality) {
    return { ok: false, reason: `output-too-short:${text.trim().length}<${minQuality}` };
  }
  return { ok: true, text };
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const resp = await fetch(url, { ...options, signal: AbortSignal.timeout(timeoutMs) });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const data = await resp.json();
  return data.choices?.[0]?.message?.content || data.message?.content || '';
}

async function checkOllamaAvailable(modelName) {
  try {
    const resp = await fetch('http://localhost:11434/api/tags', { signal: AbortSignal.timeout(5000) });
    if (!resp.ok) return false;
    const data = await resp.json();
    return data.models?.some((m) => m.name === modelName) ?? false;
  } catch {
    return false;
  }
}

export async function dispatchLLM(system, user, intent = {}, opts = {}) {
  const bio = getBioState();
  const task = intent.task || 'research';
  const isSovereign = intent.privacy === 'sovereign';
  let targetModel;
  let provider;

  if (isSovereign) {
    targetModel = MODEL_MAP.local.sovereign;
    provider = 'local';
  } else if (task === 'code' || task === 'synthesis') {
    if (bio.spoons >= 4) {
      targetModel = MODEL_MAP.LiteLLM.synthesis;
      provider = 'litellm';
    } else {
      targetModel = MODEL_MAP.LiteLLM.fast;
      provider = 'litellm';
    }
  } else if (task === 'research') {
    targetModel = MODEL_MAP.LiteLLM.research;
    provider = 'litellm';
  } else {
    targetModel = MODEL_MAP.LiteLLM.fast;
    provider = 'litellm';
  }

  const maxTokens = opts.maxTokens || 4096;
  const temperature = opts.temperature ?? 0.7;
  const messages = [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];

  // Sovereign / Local Execution
  if (isSovereign) {
    const available = await checkOllamaAvailable(targetModel);
    if (!available) {
      throw new Error(`Sovereign model ${targetModel} not available locally. Run: ollama pull ${targetModel}`);
    }
    const localPayload = {
      model: targetModel,
      messages: messages.map((m) => ({
        ...m,
        content: m.role === 'system' ? `${m.content}\n\nYou are a sovereign agent. Output concise results.` : m.content,
      })),
      stream: false,
      options: { num_predict: Math.min(maxTokens, 512), temperature },
    };
    try {
      const content = await fetchWithTimeout('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(localPayload),
      }, 180000);
      const val = validateResponse(content, maxTokens, opts);
      if (val.ok) return val.text;
    } catch (e) {
      throw new Error(`Sovereign local execution failed: ${e.message}`);
    }
  }

  // API Execution (LiteLLM Proxy -> OpenRouter Fallback)
  const payload = { model: targetModel, messages, temperature, max_tokens: maxTokens };
  const litellmKey = process.env.LITELLM_KEY || 'sk-local-proxy-key';
  const openrouterKey = process.env.OPENROUTER_API_KEY;

  try {
    const content = await fetchWithTimeout('http://localhost:4000/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${litellmKey}`,
      },
      body: JSON.stringify(payload),
    }, 60000);
    const val = validateResponse(content, maxTokens, opts);
    if (val.ok) return val.text;
  } catch (e) {
    console.error(`[router] LiteLLM degraded for ${targetModel}. Failing over to OpenRouter.`);
  }

  if (openrouterKey) {
    try {
      const fallbackModel = MODEL_MAP.OpenRouter[task] || MODEL_MAP.OpenRouter.fast;
      const fallbackPayload = { ...payload, model: fallbackModel };
      const content = await fetchWithTimeout('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openrouterKey}`,
        },
        body: JSON.stringify(fallbackPayload),
      }, 120000);
      const val = validateResponse(content, maxTokens, opts);
      if (val.ok) return val.text;
    } catch (e) {
      console.error(`[router] OpenRouter failed for ${targetModel}: ${e.message}`);
    }
  }

  throw new Error(`[router] All availability avenues failed for intent: ${task}`);
}
