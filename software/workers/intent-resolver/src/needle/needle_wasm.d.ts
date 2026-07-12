/* tslint:disable */
/* eslint-disable */

/**
 * WASM-exposed inference engine handle.
 */
export class NeedleWasm {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Return the contrastive embedding dimension (0 if no contrastive head loaded).
     */
    contrastive_dim(): number;
    /**
     * Encode text to a L2-normalized contrastive embedding.
     *
     * Returns a `Float32Array` of length `contrastive_dim()`, or `null` if the
     * model was loaded without a contrastive head.
     *
     * Cosine similarity between query and tool embeddings equals the dot product
     * (both vectors are already L2-normalized).
     */
    encode_contrastive(text: string): Float32Array | undefined;
    /**
     * Load the engine from raw bytes.
     *
     * `weights_bytes`: ArrayBuffer / Uint8Array containing the .safetensors file.
     * `vocab_text`:    String content of vocab.txt (one piece per line).
     */
    static load(weights_bytes: Uint8Array, vocab_text: string): NeedleWasm | undefined;
    /**
     * Rank tool descriptions by contrastive similarity to a query.
     *
     * `tool_descs_json`: JSON array of description strings, e.g.
     *   `'["Get current weather", "Search the web", "Send email"]'`
     *
     * Returns a JSON string `[{"index":0,"score":0.95},{"index":2,"score":0.71}]`
     * sorted by descending score, or `"[]"` if the model has no contrastive head.
     *
     * Mirrors Python `retrieve_tools(query, tools, top_k)` from `run.py`.
     */
    retrieve_tools(query: string, tool_descs_json: string, top_k: number): string;
    /**
     * Run inference and return the output JSON string.
     *
     * Returns e.g. `[{"name":"get_weather","arguments":{"location":"Paris"}}]`.
     */
    run(query: string, tools_json: string): string;
    /**
     * Run inference on multiple examples and return a JS Array of output strings.
     *
     * Input: JS Array of `{query: string, tools: string}` objects.
     * Output: JS Array of output strings, one per input.
     */
    run_batch(examples: Array<any>): Array<any>;
    /**
     * Run inference with a per-token streaming callback.
     *
     * `on_token(tokenId: number, piece: string)` fires for each generated token
     * in decode order. Returns the final post-processed output string.
     */
    run_stream(query: string, tools_json: string, on_token: Function): string;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_needlewasm_free: (a: number, b: number) => void;
    readonly needlewasm_contrastive_dim: (a: number) => number;
    readonly needlewasm_encode_contrastive: (a: number, b: number, c: number, d: number) => void;
    readonly needlewasm_load: (a: number, b: number, c: number, d: number) => number;
    readonly needlewasm_retrieve_tools: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
    readonly needlewasm_run: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
    readonly needlewasm_run_batch: (a: number, b: number) => number;
    readonly needlewasm_run_stream: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
    readonly __wbindgen_export: (a: number, b: number) => number;
    readonly __wbindgen_export2: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_export3: (a: number) => void;
    readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
    readonly __wbindgen_export4: (a: number, b: number, c: number) => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
