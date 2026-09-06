# Sovereign AI-Native Web: The P31 Stack

**How we built a zero-build, edge-rendered, agent-controllable web stack — and how you can too.**

*July 2026*

---

## The Problem

The web was built for humans. AI agents navigate it like a foreign country — parsing DOM trees, guessing at form fields, struggling with SPAs that require multi-step interactions before content is accessible.

Meanwhile, the standards exist to fix this:

- **WebMCP** (Chrome origin trial since May 2026) lets sites expose structured tools to browser agents
- **MCP** (Model Context Protocol) gives desktop agents tool access
- **A2UI** (Agent-to-User Interface, Google v0.9) lets agents describe UI declaratively
- **Edge Workers** (Cloudflare Workers) render HTML at the edge with zero build step

But no one had connected them into a single sovereign stack.

Until now.

Meet **P31 Labs** — a Georgia 501(c)(3) building open-source assistive technology for neurodivergent families. We needed our entire ecosystem to be agent-controllable, design-token-consistent, and accessible from any agent — Claude, Gemini, or custom.

Here's how we built it.

---

## The Stack

### Layer 1: Design Tokens → Single Source of Truth

**`design-system.json`** — 124 CSS custom properties across 12 groups, 15 components, 12 icon assets.

Every visual decision flows from one root: `16px × (4/3)^n`, timed to the 863 Hz Larmor frequency of phosphorus-31 (yes, that's where our name comes from).

```json
{
  "root": { "base_unit": "16px", "tetrahedral_ratio": 1.3333 },
  "scale": { "xs": "12px", "sm": "16px", "md": "21px", ... },
  "primitive": { "color": { "cyan": "oklch(65% 0.18 195)", ... } },
  "components": [ "GlassCard", "Button", "SpoonMeter", ... ]
}
```

Published at `/.well-known/design-system.json` on every app.

### Layer 2: Edge Rendering → Tokenized HTML

**`render.p31ca.org`** — A Cloudflare Worker that reads `design-system.json` and generates per-user HTML on the fly.

```
GET /?spoons=4&brand=phos
```

Returns a complete HTML page with:
- 124 CSS variables from the design system
- Spoon-level-aware styling (crisis at 0-1, standard at 2-3, full at 4-5)
- 12+ `data-mcp-*` annotations
- Cache-control: 300s browser, 600s edge
- 20 KB gzipped, 5ms worker startup

No build step. No runtime JS. Just tokenized, cached HTML at the edge.

### Layer 3: A2UI Renderer → Declarative UI

**`POST /a2ui/render`** — Accepts A2UI v0.9 component JSON and returns tokenized, annotated HTML.

```json
POST /a2ui/render
Content-Type: application/json

{
  "components": [
    {"id":"c1","component":"GlassCard","props":{"color":"violet"}},
    {"id":"c2","component":"SpoonMeter","props":{"current":4},"parentId":"c1"},
    {"id":"c3","component":"StatusBadge","props":{"status":"beta"},"parentId":"c1"}
  ]
}
```

Returns complete HTML with nested components, design tokens, and WebMCP annotations — without running any JavaScript.

### Layer 4: WebMCP Annotations → Agent-Readable

**686 annotations across 75+ files.** Every button, input, range slider, and status indicator has `data-mcp-tool`, `data-mcp-type`, `data-mcp-state`, and `data-mcp-target`. The AI Governor enforces this automatically — any PR missing annotations gets flagged in CI.

When Chrome 149+ loads any P31 page, `navigator.modelContext.registerTool()` exposes browser tools for:

- `setSpoonLevel(level)` — updates the UI and fires events
- `setStatus(status)` — changes status badge appearance
- `navigate(href)` — navigates to a URL
- `toggleDrawer(state)` — opens/closes navigation drawers
- `clickElement(selector)` — clicks any element
- `setInputValue(selector, value)` — fills in form fields

### Layer 5: Browser Dispatcher → DOM Mutations

**`window.__p31MCPTools`** — A 2 KB inline script loaded on every P31 page that bridges MCP tool calls to DOM mutations.

The dispatcher handles the critical gap: MCP servers return JSON, but they can't update the browser's DOM. The dispatcher runs in the browser, registers tools via `navigator.modelContext` when available, and mutates the DOM directly.

Three integration paths:
- **WebMCP**: `navigator.modelContext.registerTool()` in Chrome 149+
- **Direct JS**: `window.__p31MCPExec('setSpoonLevel', { level: 4 })`
- **MCP + Bridge**: Claude calls MCP server → server sends event → dispatcher updates DOM

---

## The Full Flow

```
Agent (Claude/Gemini/Opal)
        ↓
User: "Set spoon level to 4"
        ↓
Browser Dispatcher (window.__p31MCPTools)
  → navigator.modelContext.registerTool (WebMCP)
  → OR window.__p31MCPExec('setSpoonLevel', { level: 4 })
        ↓
DOM Mutation:
  - document.documentElement.dataset.spoons = "4"
  - <z-range id="spoon-dial"> value → 4
  - 6 dot indicators → crisis/standard/full colors
  - spoons:changed event fires
        ↓
Agent receives { success: true, level: 4 }
```

Or, for generating new UI:

```
Agent → A2UI JSON → POST /a2ui/render → Tokenized HTML → Display
```

---

## What 568 Annotations Gets You

| App | Annotations | Coverage |
|-----|-------------|----------|
| PHOS (34 surfaces) | ~180 | Every CRUD surface, input, button, toggle |
| tetra-ops (18 panels) | ~130 | Every campaign, donor, grant, ledger entry |
| BONDING | 13 | Molecule builder, atom grid, widget layout |
| Willow CompanionChat | 11 | Quick replies, textarea, send button |
| Agent demo | 45 | Crown, SpoonDial, StatusBadge, meta panel |

Total: **686 annotations, 0 warnings** across the entire monorepo, enforced by automated CI governance.

---

## Performance Impact

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| phosphorus31.org page size | 53 KB | 13 KB | **75% smaller** |
| JS bundles per page | 3 (Astro hydration) | 0 | **Zero runtime JS** |
| WebMCP annotations | 10 | 45 | **4.5x more** |
| Edge cache | None | 300s/600s | **Cached at edge** |
| Worker startup | N/A | 5ms | **Instant cold start** |

---

## How to Sovereign-Enable Your Stack

### 1. Start with annotations

Add `data-mcp-tool`, `data-mcp-type`, `data-mcp-target` to every interactive element:

```html
<button data-mcp-tool="submitForm" data-mcp-type="action" data-mcp-target="form-submit">
  Submit
</button>
<input data-mcp-tool="emailInput" data-mcp-type="input" data-mcp-target="email-field" />
<select data-mcp-tool="roleSelect" data-mcp-type="input" data-mcp-target="role-select">
```

### 2. Publish your design system

Export your tokens as a JSON file at `/.well-known/design-system.json`. Agreed-upon schema is emerging from the WebMCP W3C community group.

### 3. Publish an A2UI catalog

Export your component catalog at `/.well-known/a2ui-catalog.json` following the A2UI v0.9 flat schema. Agents will discover it automatically.

### 4. Add the browser dispatcher

Include the 2 KB inline dispatcher script on every page. Register tools via `navigator.modelContext` when available.

### 5. Register for WebMCP origin trial

Register your domains at [developer.chrome.com/origintrials](https://developer.chrome.com/origintrials). Inject the token via `<meta>` tag or HTTP header.

### 6. (Optional) Build an edge renderer

Use Cloudflare Workers (or any edge runtime) to serve tokenized, per-user HTML. Cache at the edge for <200ms response times.

---

## Results

The P31 sovereign stack is **production-ready and fully deployed**:

- `render.p31ca.org` — Edge HTML renderer with per-user personalization
- `agent.p31ca.org` — Agent demo with Zephyr components, A2UI preview, browser dispatcher
- `p31-design-mcp.workers.dev` — Stateless MCP server with 23 tools
- `storybook.p31ca.org` — Live component library with spoon-aware controls
- `builder.p31ca.org` — AI website builder
- `app.p31ca.org` — AI app builder
- `game.p31ca.org` — AI game builder
- `schemas/tokens.dense.json` — 122 tokens at 10.5 KB (86.5% reduction from source)
- `/.well-known/a2ui-catalog.json` — A2UI component catalog on all 5 apps
- `/.well-known/design-system.json` — Design token source on all 5 apps

The entire stack speaks open protocols, not vendor APIs. It works with Claude Desktop, Gemini in Chrome, or custom agents. It costs nothing beyond existing Cloudflare Workers usage.

---

## What's Next

- **MCP stateless core** — July 28, 2026. The largest revision to MCP ever. We're already migrated.
- **WebMCP stable Chrome** — Estimated Q1 2027. Origin trial runs through Chrome 156 (~October 2026).
- **A2UI ecosystem** — Google, CopilotKit, and Vercel are building on it. Our catalog is published.
- **Edge-generated UI** — `lit-ssr-edge`, `@cf-wasm/satori`, `@ahtmljs/hono` — all production-ready.

**The window is the next 90 days.** Register for the WebMCP origin trial. Annotate your surfaces. Publish your catalog. When WebMCP defaults, you'll already be agent-native.

---

*P31 Labs, Inc. — Georgia 501(c)(3) · EIN 42-1888158 · 863 Hz · β₂=1*

*Built by a late-diagnosed AuDHD parent, for families like ours. Open source, always.*
