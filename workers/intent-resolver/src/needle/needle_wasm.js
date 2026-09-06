// needle_wasm.js — Workers CompiledWasm-compatible shim for the wasm-pack
// 0.15 "bundler" output (which dropped the public `initSync` in favour of
// bundler-driven instantiation). We replicate the legacy `initSync(module)`
// contract that needle-engine.ts relies on: the caller passes a pre-compiled
// `WebAssembly.Module` (wrangler [[rules]] type = "CompiledWasm") and we
// instantiate it against the import handlers exported by needle_wasm_bg.js.
//
// ROOT CAUSE OF PRIOR EDGE FAILURE: wasm-pack emits `"sideEffects": false`.
// When the glue's import handlers are only reached via dynamic property
// access (`Object.keys(bg)[i]`), esbuild/wrangler tree-shakes them out of the
// deployed bundle, so `new WebAssembly.Instance` throws a LinkError (missing
// imports) that the caller swallows as a silent heuristic fallback.
//
// FIX: `export * from "./needle_wasm_bg.js"` forces esbuild to retain every
// named export (incl. the dynamically-used `__wbg_*` handlers), and we build
// the import object by *introspecting* the compiled module so it can never
// drift from what the wasm actually imports.

import * as bg from "./needle_wasm_bg.js";

// CRITICAL: defeat esbuild tree-shaking — keep all glue exports in the bundle.
export * from "./needle_wasm_bg.js";

/**
 * Instantiate a pre-compiled WebAssembly.Module against the glue's import
 * handlers, then publish its exports to the glue. Matches the legacy
 * wasm-pack `initSync(module)` contract.
 *
 * @param {WebAssembly.Module | WebAssembly.Instance | ModuleNamespace} moduleNamespace
 * @returns {WebAssembly.Exports}
 */
export function initSync(moduleNamespace) {
  // CompiledWasm yields the Module on `.default`; tolerate a raw Module too.
  let wasmModule = moduleNamespace?.default ?? moduleNamespace;

  // Already instantiated (e.g. some bundler/runtime shapes) — wire & reuse.
  if (wasmModule instanceof WebAssembly.Instance) {
    bg.__wbg_set_wasm(wasmModule.exports);
    return wasmModule.exports;
  }

  if (!(wasmModule instanceof WebAssembly.Module)) {
    // Fallback: caller passed raw bytes (shouldn't happen under CompiledWasm).
    wasmModule = new WebAssembly.Module(wasmModule);
  }

  // Build the EXACT import object the module requests — robust to name drift.
  const imports = {};
  for (const imp of WebAssembly.Module.imports(wasmModule)) {
    imports[imp.module] = imports[imp.module] || {};
    if (imp.module === "./needle_wasm_bg.js") {
      imports[imp.module][imp.name] = bg[imp.name];
    } else if (imp.module === "env" && imp.kind === "memory") {
      // Future-proofing: newer wasm-bindgen may import its own memory.
      imports.env[imp.name] = new WebAssembly.Memory({ initial: 17 });
    }
  }

  const instance = new WebAssembly.Instance(wasmModule, imports);
  bg.__wbg_set_wasm(instance.exports);
  return instance.exports;
}

export default initSync;
