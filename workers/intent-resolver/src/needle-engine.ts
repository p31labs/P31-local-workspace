// needle-engine.ts — Lazy-loaded Needle WASM inference engine.
//
// Cloudflare Workers BLOCKS runtime WASM code-gen from raw bytes. The
// supported path is a pre-compiled module: wrangler's [[rules]] type =
// "CompiledWasm" compiles needle_wasm_bg.wasm at deploy time into a
// WebAssembly.Module, which we import here. We then call initSync() with
// that pre-compiled module (allowed — only compiling from raw bytes is
// blocked) and cache the engine singleton.
//
// Model weights (22 MB INT4 SafeTensors) + vocab are fetched from R2 on
// first request and cached in module-level state (survives across requests
// within the same isolate).

export type NeedleResult = {
  tool: string;
  arguments: Record<string, unknown>;
  needle_used: true;
};

export type NeedleError = {
  needle_used: false;
  fallback_reason: string;
};

// ── Structured metrics ──────────────────────────────────────────────
export type NeedleMetrics = {
  requests: number;
  successes: number;
  fallbacks: number;
  initFailures: number;
  inferenceTimeouts: number;
  avgInferenceMs: number;
};

const metrics: NeedleMetrics = {
  requests: 0,
  successes: 0,
  fallbacks: 0,
  initFailures: 0,
  inferenceTimeouts: 0,
  avgInferenceMs: 0,
};

let engine: any = null;
let initAttempted = false;

const R2_FETCH_TIMEOUT_MS = 10_000;
const INFERENCE_TIMEOUT_MS = 5_000;
const DEFAULT_MODEL_KEY = 'needle-v1.safetensors';
const VOCAB_KEY = 'vocab.txt';

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ]);
}

async function ensureEngine(env: { NEEDLE_WEIGHTS: R2Bucket; NEEDLE_MODEL_KEY?: string }): Promise<any> {
  if (engine) return engine;
  if (initAttempted) return null;
  initAttempted = true;

  try {
    // 1. Dynamic imports to avoid static bundling issues.
    const [wasmNs, glue] = await Promise.all([
      import('./needle/needle_wasm_bg.wasm'),
      import('./needle/needle_wasm.js'),
    ]);

    const input: any = (wasmNs as any)?.default ?? wasmNs;
    console.log('[needle-engine] WASM module:', input instanceof WebAssembly.Module ? 'valid' : typeof input);

    // 2. Initialize WASM runtime.
    glue.initSync(input);
    console.log('[needle-engine] initSync done');

    // 3. Load model weights from R2 (with timeout).
    const modelResp = await withTimeout(
      env.NEEDLE_WEIGHTS.get(env.NEEDLE_MODEL_KEY || DEFAULT_MODEL_KEY),
      R2_FETCH_TIMEOUT_MS,
      'R2 model fetch',
    );
    if (!modelResp) throw new Error(`${env.NEEDLE_MODEL_KEY || DEFAULT_MODEL_KEY} not in R2`);
    const modelBytes = new Uint8Array(await modelResp.arrayBuffer());
    console.log('[needle-engine] weights:', modelBytes.length, 'bytes');

    // 4. Load vocabulary from R2 (with timeout).
    const vocabResp = await withTimeout(
      env.NEEDLE_WEIGHTS.get(VOCAB_KEY),
      R2_FETCH_TIMEOUT_MS,
      'R2 vocab fetch',
    );
    if (!vocabResp) throw new Error(`${VOCAB_KEY} not in R2`);
    const vocabText = await vocabResp.text();
    console.log('[needle-engine] vocab:', vocabText.length, 'chars');

    // 5. Load model into engine.
    const loaded = glue.NeedleWasm.load(modelBytes, vocabText);
    if (!loaded) throw new Error('NeedleWasm.load returned undefined');
    engine = loaded;
    console.log('[needle-engine] engine loaded');
    return engine;
  } catch (e: any) {
    metrics.initFailures++;
    console.error('[needle-engine] init failed:', e.message);
    return null;
  }
}

export interface ToolDef {
  name: string;
  description: string;
  parameters?: Record<string, unknown>;
}

/**
 * Classify a user prompt into a P31 tool call using Needle's 26M-param
 * transformer. Returns the parsed tool call, or null if needle is unavailable.
 */
export async function classifyIntent(
  prompt: string,
  tools: ToolDef[],
  env: { NEEDLE_WEIGHTS: R2Bucket; NEEDLE_MODEL_KEY?: string },
): Promise<NeedleResult | null> {
  metrics.requests++;
  const eng = await ensureEngine(env);
  if (!eng) return null;

  try {
    const toolsJson = JSON.stringify(tools);
    const t0 = Date.now();
    const raw = await withTimeout(
      Promise.resolve(eng.run(prompt, toolsJson)),
      INFERENCE_TIMEOUT_MS,
      'needle inference',
    );
    const elapsed = Date.now() - t0;
    // Exponential moving average for inference latency.
    metrics.avgInferenceMs = metrics.avgInferenceMs
      ? metrics.avgInferenceMs * 0.8 + elapsed * 0.2
      : elapsed;

    const parsed = JSON.parse(raw);

    // Needle returns a single object {name, arguments} or an array.
    const call = Array.isArray(parsed) ? parsed[0] : parsed;
    if (!call?.name) {
      metrics.fallbacks++;
      return null;
    }

    metrics.successes++;
    return {
      tool: call.name,
      arguments: call.arguments ?? {},
      needle_used: true,
    };
  } catch (e: any) {
    if (e.message?.includes('timed out')) {
      metrics.inferenceTimeouts++;
      console.warn('[needle-engine] inference timeout');
    } else {
      console.error('[needle-engine] inference failed:', e.message);
    }
    metrics.fallbacks++;
    return null;
  }
}

/** Check if the engine is initialized (for health checks). */
export function needleReady(): boolean {
  return engine !== null;
}

/** Return a snapshot of runtime metrics. */
export function needleMetrics(): NeedleMetrics {
  return { ...metrics };
}
