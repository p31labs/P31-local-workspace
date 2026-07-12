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

let engine: any = null;
let initAttempted = false;

async function ensureEngine(env: { NEEDLE_WEIGHTS: R2Bucket }): Promise<any> {
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

    // 3. Load model weights from R2.
    const modelResp = await env.NEEDLE_WEIGHTS.get('needle.safetensors');
    if (!modelResp) throw new Error('needle.safetensors not in R2');
    const modelBytes = new Uint8Array(await modelResp.arrayBuffer());
    console.log('[needle-engine] weights:', modelBytes.length, 'bytes');

    // 4. Load vocabulary from R2.
    const vocabResp = await env.NEEDLE_WEIGHTS.get('vocab.txt');
    if (!vocabResp) throw new Error('vocab.txt not in R2');
    const vocabText = await vocabResp.text();
    console.log('[needle-engine] vocab:', vocabText.length, 'chars');

    // 5. Load model into engine.
    const loaded = glue.NeedleWasm.load(modelBytes, vocabText);
    if (!loaded) throw new Error('NeedleWasm.load returned undefined');
    engine = loaded;
    console.log('[needle-engine] engine loaded');
    return engine;
  } catch (e: any) {
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
  env: { NEEDLE_WEIGHTS: R2Bucket },
): Promise<NeedleResult | null> {
  const eng = await ensureEngine(env);
  if (!eng) return null;

  try {
    const toolsJson = JSON.stringify(tools);
    const raw = eng.run(prompt, toolsJson);
    const parsed = JSON.parse(raw);

    // Needle returns a single object {name, arguments} or an array.
    const call = Array.isArray(parsed) ? parsed[0] : parsed;
    if (!call?.name) return null;

    return {
      tool: call.name,
      arguments: call.arguments ?? {},
      needle_used: true,
    };
  } catch (e: any) {
    console.error('[needle-engine] inference failed:', e.message);
    return null;
  }
}

/** Check if the engine is initialized (for health checks). */
export function needleReady(): boolean {
  return engine !== null;
}
