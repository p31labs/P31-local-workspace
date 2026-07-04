# Contributing to Spaceship Earth

P31 internal development guide. Operator: Will Johnson.

## Prerequisites

- Node.js 22+
- npm 10+

## Setup

```bash
# From the monorepo root
cd software

# Install shared packages first (spaceship-earth aliases these)
cd packages/shared && npm install && cd ../..

# Install and start Spaceship Earth
cd spaceship-earth
npm install
npm run dev
# → http://localhost:5180
```

## Dev Server Flags

| URL param | Effect |
|-----------|--------|
| `?demo=true` | Bypass ship lock + onboarding; show demo kiosk banner |
| `?stats=1` | Mount stats.js FPS overlay (requires `npm i -D stats.js`) |

## Environment Variables

Copy `.env.example` to `.env.local` and fill in values.

```
VITE_RELAY_URL=wss://bonding-relay.trimtab-signal.workers.dev
```

The relay is optional — all relay features are graceful no-ops when `VITE_RELAY_URL` is absent.

## Stack Notes

| Concern | Implementation |
|---------|----------------|
| 3D scene | Vanilla Three.js + raw RAF (`ImmersiveCockpit.tsx`) — NOT R3F |
| State | Zustand v5 curried form — **no middleware** (breaks type inference) |
| Styles | Tailwind v4 — `@import "tailwindcss"`, not v3 directives |
| TypeScript | strict + `verbatimModuleSyntax` + `erasableSyntaxOnly` — use `import type` |
| Zustand selectors | `useShallow` for multi-field objects; atomic `s => s.field` for single values |

## TypeScript Rules

- `import type` for all type-only imports (verbatimModuleSyntax enforcement)
- No `any` — use `unknown` + type narrowing
- Zustand store: `create<T>()((set, get) => ...)` curried form, no middleware

## Testing

```bash
npm test            # Vitest unit tests (watch mode)
npm test -- --run   # Single pass (CI mode)
```

Tests live at `src/**/*.test.ts`. Environment: Node (no DOM required for pure unit tests).

## Build

```bash
npm run build       # tsc --noEmit + vite build
```

Build output in `dist/`. Bundle analyser report at `dist/stats.html` (open in browser).

Current gzip sizes (baseline):
- `vendor-react`: ~43 kB
- `vendor-three`: ~116 kB
- `index`: ~111 kB
- Total initial load: **~276 kB gzipped**

## Code Style

- No emojis in source code
- No `console.log` in production paths (use `console.warn`/`console.error` with `[P31]` prefix)
- Module-scope scratch objects for Three.js hot paths (zero GC per frame)
- Direct `Float32Array` writes for buffer updates (no spread, no `.toArray()`)
- Error boundaries wrap every overlay — catch render crashes per-overlay without killing the app

## AI Tag-Out System

| Agent | Domain |
|-------|--------|
| CC (Sonnet/Opus) | UI, React, WCD execution, debugging |
| KwaiPilot | Isolated modules (relay, quests, sounds, logger) |
| Opus | QA, architecture verification, WCD authoring |
| Gemini | Grants, narrative, research synthesis |
| DeepSeek | ESP32 firmware only |

## Branch / PR

```
main      — production
develop   — integration branch
feat/*    — feature branches
fix/*     — bug fixes
```

PRs require: tsc clean + all tests green + build clean.
