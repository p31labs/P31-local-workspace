# Contributing to Spaceship Earth

P31 internal development guide. Operator: Will Johnson.

## Prerequisites

- Node.js 22+
- pnpm 9+
- Git access to the monorepo

## Setup

```bash
# From the monorepo root (/home/p31/P31-local-workspace)
pnpm install

# Install workspace deps for spaceship-earth
pnpm --filter @p31/spaceship-earth install

# Start the dev server
pnpm --filter @p31/spaceship-earth dev
# → http://localhost:5180
```

## Dev Server Flags

| URL param | Effect |
|-----------|--------|
| `?demo=true` | Bypass ship lock + onboarding; show demo kiosk banner |
| `?stats=1` | Mount stats.js FPS overlay |

## Environment Variables

Copy `.env.example` to `.env.local` in `packages/spaceship-earth/` and fill in values.

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
| Dome geometry | `math/geometry.ts` — geodesic detail=2 → 480 edges, 320 faces (ports) |
| Dymaxion net | `engine/dymaxion.ts` + `cockpit/BuckyView.tsx` — 19 shared edges, 320 points, 20 cells |

## TypeScript Rules

- `import type` for all type-only imports (verbatimModuleSyntax enforcement)
- No `any` — use `unknown` + type narrowing
- Zustand store: `create<T>()((set, get) => ...)` curried form, no middleware

## Testing

```bash
pnpm test            # Vitest unit tests (watch mode)
pnpm test -- --run   # Single pass (CI mode) — 193 tests across 18 files
```

Tests live at `src/**/*.test.ts`. Environment: Node (no DOM required for pure unit tests).

## Build

```bash
pnpm build           # tsc --noEmit + vite build
```

Build output in `dist/`.

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

## Ship Release

1. Bump version in `package.json` and the docs version headers
   (MANUFACTURERS_MANUAL, API_REFERENCE, RUNBOOK).
2. `pnpm build` + `pnpm test -- --run` green.
3. Deploy Pages + Worker (see `DEPLOYMENT_GUIDE.md`).
4. Run `scripts/verify-ship.cjs` against the live deploy.
