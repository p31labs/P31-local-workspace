# P31 App Builder — Bolt.new / WebContainer Integration Pattern

## 1. How Bolt.new Works

Bolt.new (StackBlitz) uses **WebContainer** — a WebAssembly-based Node.js runtime that executes entirely in the browser. Architecture:

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Runtime | WASM Node.js (WebContainer) | npm, filesystem, process execution in-browser |
| Terminal | xterm.js + Service Worker relay | Interactive shell I/O |
| Code gen | LLM → file diffs → filesystem | AI generates files directly into the WebContainer FS |
| Preview | iframe + Service Worker proxy | Live preview of served app (Vite dev server) |
| Filesystem | MemFS (in-memory) + OPFS persistence | Read/write of project files |

**Flow:**
1. LLM receives prompt → generates file operations (create/update/delete)
2. Files are written to WebContainer's virtual filesystem (MemFS)
3. Dev server (e.g. `npm run dev`) is started inside WebContainer
4. Preview iframe loads via Service Worker that proxies WebContainer's HTTP server
5. User iterates: LLM edits files → hot reload updates preview

## 2. P31 Sandbox Wrapping (@arrow-js/sandbox)

P31 wraps the WebContainer pattern with **`@arrow-js/sandbox`** (already in monorepo at root `package.json` v1.0.6).

```typescript
import { Sandbox } from '@arrow-js/sandbox';

const sandbox = new Sandbox({
  allow: ['fetch'],     // selective capability grants
  timeout: 30_000,      // execution timeout
  memory: 64 * 1024 * 1024, // 64MB limit
});
```

**P31 sandbox invariants:**
- No `eval()` / `Function()` — blocked at sandbox level
- No `fetch()` to unknown origins — only P31 design token CDN + user's own API
- No `document.cookie` access — prevents credential exfiltration
- No `localStorage` shared with parent — generated apps get an isolated origin
- `postMessage` bridge only — generated app ↔ parent communication via structured clone
- Spoon-aware timeout: spoons 0-1 → 60s, 2-3 → 30s, 4-5 → 15s

**Sandbox integration in the Cloudflare Worker chain:**
```
User Prompt → LLM → File Operations → Sandbox Execution → Preview URL
                              ↓
                    P31 Token Injection
                    WebMCP Annotation
                    Edge Cache
```

## 3. MCP Tools for App Generation

Three MCP tools exposed via the P31 MCP server:

### `generate_app`

| Property | Value |
|----------|-------|
| **Name** | `generate_app` |
| **Description** | Generate a full app from a natural language prompt |
| **Input** | `{ prompt: string, spoons?: number, brand?: string, template?: string }` |
| **Output** | `{ appId: string, files: File[], previewUrl: string, designTokens: string[] }` |

The tool:
1. Takes prompt + optional spoon level / brand
2. Calls LLM for code generation (uses vibe-sandbox for safety checks)
3. Injects P31 design tokens into every generated HTML file
4. Adds `data-mcp-*` annotations to all interactive elements
5. Deploys to ephemeral preview URL
6. Returns `appId` for iteration

### `modify_app`

| Property | Value |
|----------|-------|
| **Name** | `modify_app` |
| **Description** | Modify an existing generated app |
| **Input** | `{ appId: string, instruction: string, file?: string }` |
| **Output** | `{ files: File[], previewUrl: string, changes: string[] }` |

### `deploy_app`

| Property | Value |
|----------|-------|
| **Name** | `deploy_app` |
| **Description** | Deploy a generated app to Cloudflare Pages |
| **Input** | `{ appId: string, subdomain: string, production?: boolean }` |
| **Output** | `{ url: string, deployId: string, status: string }` |

## 4. P31 Design Token Injection

Every generated app has design tokens injected at generation time:

```html
<!DOCTYPE html>
<html lang="en" data-spoons="3" data-theme="quantum">
<head>
  <style>
    :root {
      /* P31 Quantum Design System — injected by app-builder */
      --p31-bg: oklch(10% 0.01 240);
      --p31-surface: oklch(15% 0.015 240);
      --p31-accent: oklch(65% 0.18 195);
      --p31-text: oklch(96% 0.005 240);
      --p31-glass-bg: oklch(100% 0.01 240 / 0.04);
      /* … 124 tokens total … */
    }
  </style>
</head>
```

**Token source of truth:** `@p31/design-core/src/css/tokens.css` (canonical) or the edge-render worker's `tokensToCSS()` from `design-system.json`.

**Injection rules:**
- All CSS `var(--p31-*)` references MUST have fallbacks (guardrail #1)
- Never inject `--p31-ref-*` tokens — component tier only (guardrail #5)
- The `data-spoons` attribute on `<html>` controls motion, density, and chrome
- Glass components get the `.glass-card` / `.glass-panel` token set
- SVGs get `overflow-hidden` bounding containers (guardrail #2)

## 5. WebMCP Annotations

Generated interactive elements receive `data-mcp-*` attributes:

```html
<button data-mcp-tool="click" data-mcp-target="btn-submit" data-mcp-state="enabled">
  Submit
</button>
<input data-mcp-tool="input" data-mcp-target="field-email" data-mcp-type="email" />

<div data-mcp-tool="navigate" data-mcp-target="nav-main" data-mcp-href="/dashboard">
  Dashboard
</div>
```

**Annotation scheme:**

| Element | Attributes | Purpose |
|---------|-----------|---------|
| `<button>` | `data-mcp-tool="click"`, `data-mcp-target`, `data-mcp-state` | Agent can click |
| `<a>` | `data-mcp-tool="navigate"`, `data-mcp-href` | Agent can navigate |
| `<input>` | `data-mcp-tool="input"`, `data-mcp-target`, `data-mcp-type` | Agent can fill |
| `<select>` | `data-mcp-tool="select"`, `data-mcp-target`, `data-mcp-options` | Agent can choose |
| `<form>` | `data-mcp-tool="submit"`, `data-mcp-target` | Agent can submit |
| `[data-mcp-tool="spoonDisplay"]` | `data-mcp-range`, `data-mcp-current` | Agent can read spoon level |
| `[data-mcp-tool="component"]` | `data-mcp-component`, `data-mcp-props` | Agent can identify A2UI component |

The browser MCP client (Chrome 149+ `navigator.modelContext.registerTool()`) or the `window.__p31MCPTools` fallback can then control these elements.

## 6. A2UI Catalog Injection

Generated apps can reference the A2UI component catalog at `/.well-known/a2ui-catalog.json`:

```html
<script type="application/json" id="p31-a2ui-catalog" src="/.well-known/a2ui-catalog.json"></script>
```

**Available A2UI components injected into generated apps:**
- GlassPanel, GlassCard, GlassStrong, GlassSubtle — container components
- Button — with `data-mcp-tool="click"`
- SpoonMeter, SpoonDial — spoon level visualization
- StatusBadge — status indicators (beta, live, crisis)
- Crown — sovereign indicator
- CrisisOverlay — crisis mode overlay
- CandyHeader — gradient header
- ThemeToggle — dark/light
- Starfield — ambient background
- TetraGrid — tetrahedral mesh visualization
- HonestLabel — QF-1 contested science labeler

## 7. Edge Caching Strategy

The Cloudflare Worker caches generated apps at two tiers:

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│  Browser     │────▶│  Cloudflare   │────▶│  App Builder  │
│  Cache 300s  │     │  Edge Cache   │     │  Worker       │
│              │◀────│  s-maxage 600 │◀────│  (origin)     │
└─────────────┘     └──────────────┘     └──────┬───────┘
                                                │
                                          ┌─────▼──────┐
                                          │  KV / R2    │
                                          │  (persist)  │
                                          └────────────┘
```

- **Browser cache:** 300s (`max-age=300`)
- **Edge cache (shared):** 600s (`s-maxage=600`)
- **KV persistence:** Generated app HTML stored in KV with key `app:{appId}` for re-deploy
- **Cache invalidation:** `POST /cache/invalidate?appId=<id>` clears edge KV + purges cache tag
- **Cache tags:** Each app gets `Cache-Tag: app-{appId}` for targeted purging

## 8. Architecture Summary

```
┌───────────────────────────────────────────────────────────┐
│                     User's Browser                         │
│  ┌─────────────┐  ┌──────────┐  ┌───────────────────┐    │
│  │ Bolt-like UI │  │ Terminal │  │ Preview iframe     │    │
│  │ (Code Editor)│  │ (xterm)  │  │ (Service Worker    │    │
│  │              │  │          │  │  proxied WebCont.) │    │
│  └──────┬───────┘  └────┬─────┘  └────────┬──────────┘    │
│         │               │                 │               │
└─────────┼───────────────┼─────────────────┼───────────────┘
          │               │                 │
          ▼               ▼                 ▼
┌───────────────────────────────────────────────────────────┐
│                  Cloudflare Workers Edge                   │
│                                                           │
│  ┌──────────────┐  ┌────────────┐  ┌─────────────────┐   │
│  │ app-builder   │  │ vibe-      │  │ edge-render      │   │
│  │ (MCP + Cache) │  │ sandbox    │  │ (token injection)│   │
│  │               │  │ (sandbox)  │  │                  │   │
│  └──────┬───────┘  └─────┬──────┘  └─────────────────┘   │
│         │                │                                │
│         ▼                ▼                                │
│  ┌──────────────────────────────────────────────────┐    │
│  │   design-core / design-system.json (tokens)      │    │
│  └──────────────────────────────────────────────────┘    │
│                                                           │
│  ┌──────────────────────────────────────────────────┐    │
│  │   KV (app cache)  │  R2 (build artifacts)        │    │
│  └──────────────────────────────────────────────────┘    │
└───────────────────────────────────────────────────────────┘
          │
          ▼
┌───────────────────────────────────────────────────────────┐
│              Generated App (ephemeral)                     │
│  - P31 tokens injected   - WebMCP annotated               │
│  - Spoon-aware           - A2UI catalog linked             │
│  - Glass components      - Crisis mode ready               │
└───────────────────────────────────────────────────────────┘
```

## 9. Security Model

| Threat | Mitigation |
|--------|-----------|
| Malicious code generation | `@arrow-js/sandbox` validation; vibe-sandbox server-side checks |
| Network exfiltration | Cloudflare egress controls per-worker; outbound block for sandbox |
| Token theft | No secrets in generated HTML; design tokens are public CSS |
| XSS via generated HTML | CSP headers injected; sandbox isolates iframe origin |
| Infinite loops | V8 isolate timeout (30s default, spoon-aware) |
| Resource exhaustion | Memory limit (64MB), file size cap (100KB per file) |
| Cache poisoning | Cache key includes `appId` + brand + spoons; tag-based invalidation |
