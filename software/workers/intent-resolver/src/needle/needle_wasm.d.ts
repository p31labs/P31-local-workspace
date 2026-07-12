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
