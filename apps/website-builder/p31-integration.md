# P31 × Claudable Integration

## How Claudable Works

Claudable is an open-source Next.js 15 web app builder that combines CLI-based AI coding agents with a live preview loop:

1. **User describes an app** — natural language prompt on the landing page (`app/page.tsx`)
2. **Project created** — `/api/projects` POST provisions a directory under `data/projects/`
3. **CLI agent executes** — `lib/services/cli/claude.ts` (or codex/cursor/qwen/glm) calls the respective agent SDK (e.g. `@anthropic-ai/claude-agent-sdk`'s `query()`), streaming tool calls and results back via SSE/WebSocket
4. **Code generated** — agent writes files into the project directory (Next.js App Router, TypeScript, Tailwind)
5. **Live preview** — `lib/services/preview.ts` manages a `next dev` subprocess per project, port-forwarded to the browser
6. **Deploy** — Vercel integration pushes to production

Key architectural layers:
- **Frontend UI** (`app/`, `components/`): React 19, Tailwind, framer-motion
- **API layer** (`pages/api/`): WebSocket upgrade + SSE endpoints for streaming
- **CLI adapters** (`lib/services/cli/*.ts`): one per supported agent (Claude, Codex, Cursor, Qwen, GLM)
- **Stream manager** (`lib/services/stream.ts`): SSE + WebSocket fan-out per project
- **Prisma/SQLite**: project metadata, chat messages, sessions, service integrations

## Integration Architecture

Replace the CLI-agent-in-subprocess pattern with P31's edge-native MCP tool calls:

```
┌─────────────────────────────┐     ┌──────────────────────────────┐
│   Claudable UI (Next.js)    │     │    P31 Cloudflare Worker     │
│                             │     │                              │
│  User prompt → POST /api/   │────→│  p31-website-builder.workers.dev  │
│                             │     │                              │
│  SSE stream ← response      │←────│  • MCP client → p31-mcp-server│
│                             │     │  • A2UI catalog injection     │
│                             │     │  • Design token wrapping      │
│                             │     │  • WebMCP annotation layer    │
└─────────────────────────────┘     └──────────────────────────────┘
```

### Layer 1: MCP Proxy (replaces CLI agent subprocess)

Instead of spawning `claude` or `codex` locally, the P31 integration proxies generation requests to the P31 MCP server at `p31-mcp-server.trimtab-signal.workers.dev`.

**Claudable's `executeClaude()`** (line 563 of `lib/services/cli/claude.ts`) calls `@anthropic-ai/claude-agent-sdk`'s `query()` with a system prompt and working directory.

**P31 replacement:** POST generation instructions to the Cloudflare Worker, which:
1. Calls `p31-mcp-server` tools/tools/call with `name: "generate_ui"` 
2. Wraps the returned HTML with P31 design tokens
3. Injects A2UI component schemas
4. Returns tokenized, annotated result

### Layer 2: Design Token Injection

Every generated site gets the full P31 design token layer:

```css
:root {
  --p31-bg: oklch(10% 0.01 240);
  --p31-accent: oklch(65% 0.18 195);
  --p31-text: oklch(96% 0.005 240);
  /* ... 124 tokens from packages/design-core/src/css/tokens.css */
}
```

Token source of truth: `packages/design-core/src/css/tokens.css`

### Layer 3: A2UI Catalog Injection

Generated components are annotated with A2UI v0.9 catalog references so any A2UI-capable renderer can re-render them:

```html
<div data-a2ui-component="GlassCard" data-a2ui-catalog="p31ca.org:a2ui">
```

A2UI catalog served at `/.well-known/a2ui-catalog.json` listing 15 component schemas (GlassCard, Button, SpoonMeter, etc.)

### Layer 4: WebMCP Annotations

Every generated page includes `data-mcp-*` annotations for browser-based agent control:

```html
<html data-mcp-tools="setSpoonLevel,navigate,toggleDrawer,setStatus">
<body data-mcp-surface="main">
```

The WebMCP protocol exposes `navigator.modelContext.registerTool()` for Chrome 149+.

## Migration Path

| Claudable Component | P31 Replacement |
|---|---|
| `lib/services/cli/claude.ts` → `query()` | POST to `/api/generate` on the Worker |
| `lib/services/preview.ts` | Eliminated — Worker returns static HTML |
| `lib/services/stream.ts` | SSE from Worker instead of local process |
| `lib/db/` (Prisma/SQLite) | D1 database on the Worker |
| Vercel deploy | Cloudflare Workers + Pages deploy |

## File Map

```
apps/website-builder/
├── p31-integration.md      ← this file
├── wrangler.toml           ← Cloudflare Worker config
└── src/
    └── index.ts            ← Worker entry point
```
