# ArrowJS WASM Sandbox — Evaluation for P31 Sovereign Stack

## 1. Overview

**ArrowJS** (`@arrow-js/core`) is "the first UI framework for the agentic era" — a tiny (~7 KB), blazing-fast reactive UI runtime by Justin Schroeder (FormKit) and Standard Agents. Its two key differentiators:

- **Agent-native API:** `html` tagged template literals and `reactive()` state — patterns AI coding agents generate reliably.
- **WASM sandbox:** `@arrow-js/sandbox` wraps user-authored code in a QuickJS/WASM VM, preventing XSS, DOM access, and network abuse while rendering through trusted host code.

For P31, where agents generate UI components at runtime, ArrowJS offers a compelling path to **safe agent-generated UI** without losing reactivity.

## 2. WASM Sandbox

`@arrow-js/sandbox` (v1.0.6) provides an **async QuickJS/WASM runtime** for executing untrusted Arrow code off the host `window` realm.

**Architecture:**

```
User code (TS/JS) ──► acorn AST preprocessor ──► QuickJS/WASM VM ──► host DOM renderer
                                  │                          │
                                  ├─ auto-inject html,       ├─ no window/document access
                                  │   reactive, component    ├─ no storage, no raw fetch
                                  ├─ extract templates       ├─ delegated event bridge
                                  └─ strip raw expressions   └─ serialized event snapshots
```

**Key facts:**
- **Dependencies:** `quickjs-emscripten` (WASM), `acorn` (AST parsing), `acorn-walk`, `magic-string`, `typescript` (transpile-only)
- **Bundle:** 244 KB unpacked (WASM binary dominates)
- **API surface:**
  - `sandbox({ source: { 'main.ts': '...' } })` → returns an `ArrowTemplate`
  - Support for `shadowDOM` (default: true), `onError`, `debug`
  - `hostBridge` — expose host-owned functions as importable sandbox modules
  - `events.output` — receive values emitted from inside QuickJS via `output(payload)`
- **Multi-file modules:** relative imports between virtual files, `@arrow-js/core` shim resolution

## 3. Integration with P31 Stack

### 3.1 Agent-generated UI Pipeline

```
Agent ──► generates ArrowJS component code ──► WASM sandbox validates + executes ──► renders into P31 surface
```

Example flow:
1. Agent emits an ArrowJS component string (e.g., a SpoonMeter with dynamic fill)
2. P31's MCP server receives the code, passes it to `@arrow-js/sandbox`
3. Sandbox compiles in QuickJS, extracts templates, returns a renderable `ArrowTemplate`
4. P31 mounts the template into a `glass-card` container with `data-spoons` context

### 3.2 Reactive state for agent actions

```js
import { sandbox } from '@arrow-js/sandbox'

const view = sandbox({
  source: {
    'main.ts': `
      const state = reactive({ spoons: 4, status: 'active' })

      export default html\`
        <div class="glass-card">
          <p>Spoon level: \${() => state.spoons}</p>
          <button @click="\${() => state.spoons--}">Decrease</button>
        </div>
      \`
    `,
  },
})

view(document.getElementById('agent-surface'))
```

`reactive()` updates propagate through the sandbox bridge into the real DOM — no manual reconciliation needed.

### 3.3 Zero-build rendering

ArrowJS `html` tagged template literals require no build step. They can be loaded directly via ESM:

```html
<script type="module">
  import { html, reactive } from 'https://esm.sh/@arrow-js/core'
  // or via npm importmap
</script>
```

### 3.4 Host bridge for P31 tokens

P31 design tokens can be exposed to sandbox code via the `hostBridge`:

```ts
const view = sandbox(
  { source: { 'main.ts': code } },
  undefined,
  {
    'host-bridge:p31': {
      getToken(name: string): string {
        return getComputedStyle(document.documentElement)
          .getPropertyValue(`--p31-${name}`)
          .trim()
      },
      getSpoonLevel(): number {
        return parseInt(document.documentElement.dataset.spoons || '5')
      },
    },
  }
)
```

Sandbox code then imports: `import { getToken } from 'host-bridge:p31'`

## 4. Security Model

| Threat | ArrowJS Mitigation |
|--------|-------------------|
| XSS (script injection) | Code runs in QuickJS/WASM — no `window`, no `document`, no DOM |
| DOM access | Only host renderer touches the real DOM; event snapshots are plain objects |
| Network requests | Bridged `fetch()` — HTTPS-only, forced `no-referrer`, credentials `omit`, 15s timeout, 1MB cap |
| Arbitrary imports | Only virtual files and `@arrow-js/core` shim; unknown imports fail fast |
| CPU/memory exhaustion | QuickJS runtime memory limits (hard isolation still in development) |
| Raw event callback injection | DOM listeners forward sanitized payloads, never raw user code |
| Token/credential theft | No ambient auth headers forwarded; `authorization`, `cookie`, `origin`, `referer` blocked from fetch |

**Current gaps:**
- No hard CPU isolation (sandbox shares the main thread's WASM runtime)
- Memory limits are applied but DoS hardening is still "in development" per the package docs
- TypeScript support uses `ts.transpileModule` without full semantic type-checking

## 5. Comparison

| Feature | ArrowJS (`@arrow-js/sandbox`) | Zephyr | A2UI (P31's current approach) |
|---------|------|--------|------|
| **Execution model** | QuickJS/WASM VM | Template-based, no sandbox | Renderer API, no sandbox |
| **Reactivity** | `reactive()` + auto-track | Custom element lifecycle | Static HTML |
| **Security boundary** | VM isolation (strong) | Trusted code (none) | Trusted code (none) |
| **Agent-native** | Yes — designed for AI gen | Yes — MCP-annotated | Yes — JSON schema |
| **Build step required** | No | No (Zephyr via CDN) | No |
| **Bundle size** | ~244 KB (sandbox) + ~7 KB core | ~15 KB (Zephyr core) | N/A (edge renderer) |
| **DOM access** | None (inside sandbox) | Full | Full (renderer side) |
| **Network access** | Restricted fetch bridge | Full | Full |
| **TypeScript** | `transpileModule` only | Native | N/A |
| **P31 token awareness** | Via host bridge | Built-in (Zephyr style) | Built-in (CSS vars) |
| **Maturity** | v1.0.6, active dev | v1.x, stable | Production at render.p31ca.org |

### Summary

- **Zephyr** is best for trusted, curated custom elements with P31 token styling
- **A2UI** is best for server-rendered, static agent-generated HTML with token injection
- **ArrowJS** fills the gap: **safe, reactive, agent-generated UI** where the agent's code cannot be fully trusted

## 6. Recommendation

### Verdict: **Strong Adopt** — for sandboxed agent-generated UI surfaces

ArrowJS provides exactly the missing piece in P31's sovereign stack: **safe execution of untrusted agent code in the browser**. QuickJS/WASM isolation is a fundamentally stronger security model than template-based rendering or sandboxed iframes.

### Where to adopt

| Surface | Priority | Rationale |
|---------|----------|-----------|
| PHOS agent chat widget output | High | Agents generate inline UI; sandbox prevents XSS |
| Bonding community dashlets | High | Community-contributed widgets need isolation |
| p31ca embedded agent surfaces | Medium | Agent playground needs safe code execution |
| Willow chat cards | Medium | Dynamic agent-generated cards |

### Effort estimate

| Phase | Effort | Description |
|-------|--------|-------------|
| **Phase 1** | 2-3 days | Integrate `@arrow-js/sandbox` into `@p31ca/ui`, create `P31SandboxSurface` wrapper component |
| **Phase 2** | 3-5 days | Build P31 host bridge (token access, spoon-level, crisis mode); write MCP tools for sandbox code injection |
| **Phase 3** | 2 days | Wire into PHOS / Willow chat surfaces; add Playwright visual tests |
| **Phase 4** | Ongoing | SIMD-optimized WASM, CPU budget enforcement, deeper QuickJS hardening |

**Total: ~7-10 days** to production-grade integration.

### Risk

- **Main thread:** QuickJS runs on the main thread; heavy computation could block rendering. Mitigation: keep sandbox workloads small; use `SAB` + worker in future.
- **Bundle size:** 244 KB for the sandbox WASM. Acceptable for P31 apps (already heavy on D3/Three.js). Could be lazy-loaded.
- **Maintenance:** ArrowJS is actively maintained (v1.0.6, March 2026). Standard Agents has funding and momentum.

### Next step

Prototype in this directory: `sandbox-test.html` demonstrates basic sandbox usage, and `P31CounterExample.html` shows a P31-themed GlassCard counter using ArrowJS reactive state.
