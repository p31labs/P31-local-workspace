# P31 Game Builder — Plinth Integration

## Plinth Overview

Plinth is an AI-first, code-first 3D game engine built on **Bevy** (Rust ECS). It is designed for agent-mediated game development and playtesting. Key architecture:

| Layer | Technology | Role |
|-------|-----------|------|
| Engine | Bevy + Rust ECS | Real-time 3D simulation, physics, rendering |
| Scripting | Rhai / Lua | Hot-reloadable game logic |
| MCP Server | JSON-RPC over stdio/WebSocket | Agent control — screenshots, entity queries, input injection, simulation stepping |
| Asset Pipeline | GLTF + custom `.mesh` | 3D assets compiled at build time |

Plinth exposes an **MCP-native control surface**: any MCP-capable agent (Claude Desktop, Kilo, andromeda CLI) can connect to a running Plinth instance and drive the game loop.

### Plinth MCP Tool Surface

| Tool | Purpose |
|------|---------|
| `scene/screenshot` | Capture current render as PNG |
| `scene/list-entities` | Query all entities with components |
| `scene/get-entity` | Get component data for a single entity |
| `scene/spawn` | Spawn a new entity with components |
| `scene/remove` | Despawn an entity |
| `physics/raycast` | Ray intersection against colliders |
| `input/inject` | Inject keyboard/mouse/gamepad events |
| `simulation/step` | Advance simulation by N frames |
| `simulation/pause` | Pause/unpause the game loop |

## P31 Integration Points

### 1. Game Logic Generation via P31 MCP Server

The `@p31/game-generator` package produces `GameDefinition` objects that specify game type, spoon-gating, LOVE rewards, and UI theme. The game-builder Worker bridges:

```
Agent Prompt → P31 MCP Server (vibe-generate) → GameDefinition → Plinth MCP Server → Rust runtime
```

Flow:
1. Agent sends `vibe-generate` with a game description
2. P31 MCP returns a `GameDefinition` with P31 design tokens and spoon-gating
3. Game builder translates definition into Plinth entity components (Rhai scripts + GLTF asset references)
4. Resulting game is deployed as a Plinth scene + P31-wrapped HTML UI

### 2. WebMCP Annotations for Game UI Overlays

Game surfaces served by this builder include `data-mcp-*` annotations so browser-based agents can interact:

| Attribute | Purpose |
|-----------|---------|
| `data-mcp-game-id` | Unique game instance identifier |
| `data-mcp-game-state` | `playing`, `paused`, `complete` |
| `data-mcp-spoons` | Current spoon level (0-5) |
| `data-mcp-score` | Current score |
| `data-mcp-love` | LOVE earned in this session |
| `data-mcp-action` | Action buttons (`start`, `pause`, `reset`) |

These are registered as browser MCP tools via `navigator.modelContext.registerTool()` when Chrome 149+ loads the page.

### 3. Game Loop + Edge-Rendered HTML UI

The architecture uses a dual-layer rendering model:

```
┌─────────────────────────────────────────────────────┐
│                  Browser (User)                      │
│  ┌──────────────────────────────────────────────┐   │
│  │  P31 Tokenized HTML (edge-rendered)           │   │
│  │  - Glass panels, spoon meter, score display   │   │
│  │  - WebMCP annotations                         │   │
│  │  - data-spoons="3"                            │   │
│  └──────────────┬───────────────────────────────┘   │
│                 │ iframe / side-channel               │
│  ┌──────────────▼───────────────────────────────┐   │
│  │  Plinth 3D Canvas (WebGL/WebGPU)             │   │
│  │  - Bevy renderer (wasm build)                │   │
│  │  - Physics, entities, input handling         │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

- The **HTML overlay** is rendered at the edge by `render.p31ca.org` with P31 design tokens
- The **3D canvas** runs Plinth compiled to WASM in an isolated frame
- Communication happens via `postMessage` channel:
  - UI → Plinth: spoon level changes, button actions
  - Plinth → UI: score updates, challenge completions, LOVE milestones

## Directory Structure

```
apps/game-builder/
├── p31-integration.md       # This file
├── src/
│   └── index.ts             # Cloudflare Worker (router, proxy, annotation injection)
├── wrangler.toml            # Cloudflare Pages deployment config
├── package.json
└── tsconfig.json
```

## Dependencies

- `@p31ca/game-engine` — Geodesic building engine, jitterbug geometry, spoon-gating
- `@p31/game-generator` — Game definition schema + builder
- `@p31ca/design-core` — P31 design tokens (CSS variables)
- `@p31ca/ui` — P31 React components (GlassPanel, SpoonMeter, etc.)

## Spoon-Gating in Games

All games served by this builder respect `data-spoons` (0-5):

| Level | Motion | Primitives | Max Pieces | XP Multiplier |
|-------|--------|-----------|------------|---------------|
| 0 (crisis) | Disabled | hub only | 1 | 3.0x |
| 1 | Minimal | hub, strut | 3 | 2.0x |
| 2 | Subtle | + tetrahedron | 10 | 1.5x |
| 3 | Normal | + octahedron | 25 | 1.0x |
| 4 | Energetic | + icosahedron | 50 | 1.0x |
| 5 | Full | all | 100 | 1.0x |

## Security

- Plinth MCP server runs **isolated** (separate process / container)
- All MCP calls from the builder to Plinth are localhost-only
- Game definitions from P31 MCP are validated against `GameDefinition` schema before proxy
- CORS is restricted to P31 origins
