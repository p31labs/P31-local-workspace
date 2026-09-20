# P31 Loom UI — Design System & Constraints

Ground truth for generating any component in `apps/loom/src/components/`.
Verified against `src/index.css`, `src/lib/tokens.ts`, `src/App.tsx`, and
`packages/canon/src/loom/gate.ts`. Read this before writing UI for the Loom.

## Design Tokens (CSS custom properties)

All colors resolve from `--p31-*` tokens. Reference as
`var(--p31-token, <literal-fallback>)`; the fallback is an explicit
permitted literal, never a standalone color. Zero bare `hex`/`rgb()` strings
in `.tsx` files (AGENTS.md design gate).

| Token | Fallback | Use |
|---|---|---|
| `--p31-accent` | `rgb(0, 240, 255)` | cyan — primary accent, human focus ring |
| `--p31-accent-green` | `rgb(52, 211, 153)` | approve / healthy survival |
| `--p31-accent-gold` | `rgb(251, 191, 36)` | component kind, survival-warn fill, gold glow (`--p31-glow-amber`) |
| `--p31-accent-red` | `rgb(251, 113, 133)` | reject / drifted survival |
| `--p31-accent-violet` | `rgb(167, 139, 250)` | agent cursor, trail |
| `--p31-text` | `rgb(226, 232, 240)` | primary text |
| `--p31-text-secondary` | `rgb(148, 163, 184)` | secondary text |
| `--p31-text-tertiary` | `rgb(100, 116, 139)` | tertiary text, keys |
| `--p31-surface` | `#12121a` | surface / control backgrounds |
| `--p31-bg` | `#0a0e14` | void background |
| `--p31-glass-border` | `rgba(255, 255, 255, 0.1)` | borders (opacity scales with elevation) |
| `--p31-glass-surface` | `rgba(255, 255, 255, 0.06)` | subtle fills |
| `--p31-glow-amber` | `rgba(251, 191, 36, 0.5)` | gold glow |
| `--p31-font-sans` / `--p31-font-mono` | `system-ui` / `monospace` | font families |

Canvas/WebGL layers must use `resolveToken(token)` / `resolveTokenRgb(token)`
from `src/lib/tokens.ts` — Canvas 2D and shader `vec3` uniforms cannot parse
`var()`. `watchTheme` re-resolves on `[data-theme]` change.

## Write Constraint — two writable channels, both behind middleware

Components are **read-only consumers**; writes go through callbacks that App
wires to the middleware. Never `fetch` a write from a component, never touch
files, `localStorage`, or DOM writes.

1. **Warp** (the canonical log): `POST /api/loom/event` → `commit()`. Wired in
   `App.tsx:33` as:
   ```ts
   async function postEvent(input: LoomEventInput, humanId: string | null): Promise<void>
   ```
   Human gate kinds: `focus` · `revise` · `approve` · `reject` · `view.save`.
   Agent kinds: `traverse` · `propose` · `review` · `presence`. Writer-per-kind
   is enforced by the gate — a component can only ever dispatch human kinds.
   There is **no** `view.read` gate kind; navigation is `focus { node }`.
2. **Weft** (operational read log): `POST /api/loom/weft`. Used only for
   `view.read` — deposited by `useInstrument.emitRead`, never by a component.

## Read Path

State is derived from the log by replay, nowhere else:
- `useLoomState()` (`src/lib/useLoomState.ts`) — fetches `GET /api/loom/events`,
  subscribes to SSE `GET /api/loom/stream`, folds via `replay`. The ONLY place
  `reduce` runs in the app. Exposes `{ events, state, seq, scrub, follow }`.
- `useProfile()` — human identity + tier.

## Component Taxonomy (real prop signatures)

| Component | Props (all read-only) | Scope |
|---|---|---|
| `ProposalNode` | `NodeProps` from `@xyflow/react`; `data: { label, survival, tone }` | React Flow node: label + body-survival bar |
| `ProposalDigest` | `{ state: LoomState; onSelect: (id: string) => void }` | beginner digest, one line per pending proposal |
| `EventOverlay` | `{ events: LoomEvent[]; seq: number; onFollow: () => void; onSelect: (seq: number) => void }` | sidebar, append-only event log, color by writer |
| `TimelineScrubber` | `{ logLength: number; currentSeq: number; onSeqChange: (seq: number) => void }` | timeline scrub via `stateAt(seq)` |
| `Instrument` | `{ scene: Scene; reading: Reading; onFocus?: (id: string \| null) => void }` — types from `@p31/field` | Canvas 2D field; draws via `resolveToken` |
| `JitterbugScene` | none | WebGL closure; lazy-loaded via `Suspense` (`App.tsx:28`) — ~530 kB three.js justifies the split |

The proposal review panel (approve/reject/reason) is currently **inline** in
`App.tsx:196-252` — not yet a component. Use `app/loom/BRIEF-ProposalReviewPanel.md`
as the pattern for extracting it and for every new component.

## Callback Conventions

App owns logic and state; components dispatch only through callbacks. Existing
signatures: `onSelect(id)` · `onSelect(seq)` · `onFocus(node|null)` ·
`onFollow()` · `onSeqChange(seq)`. No new callback names without updating the
taxonomy. Tier label helpers live in `src/lib/surface.ts`: `effectiveTier`,
`resolveSurface`, `rejectReasonFor(tier, reason)`, `approveLabel(tier)`.
`Tier = 'beginner' | 'intermediate' | 'advanced'` from `src/lib/profile.ts`.

## Layout & Responsive

- Shell grid (`index.css:37`): columns `1fr 320px`, rows `48px 1fr auto`,
  named areas `'bar bar' 'canvas panel' 'scrub scrub'`.
- Canvas: `grid-area: canvas; min-height: 0` (prevents flex overflow).
- Panel: `grid-area: panel`, `overflow: auto` — overflowing content scrolls
  inside the container, never the page.
- Breakpoint: **820px** (`index.css:179`) — compact the instrument/jitterbug
  phase, readouts, controls.

## Patterns to Honor

- **Reduced motion**: under `prefers-reduced-motion`, decorative motion is
  collapsed (`index.css:23`); Instrument and Jitterbug draw one static frame.
- **Progressive disclosure**: `.loom-shell` takes `data-tier`; tier changes
  what the canvas surfaces, never what the log records.
- **A11y floor**: `--loom-letter-spacing` / `--loom-line-height` /
  `--loom-density` on `:root`; target ≥ 48px touch, focus rings 2px.
- **No model names** in `src/` (seal gate) — role language only.

## Imports

- React Flow from `@xyflow/react`
- `LoomEvent`, `LoomState`, `Proposal`, `Review` from `@p31/canon/loom/events`
- `LoomEventInput` from `@p31/canon/loom/gate`
- Styling: `src/index.css` tokens only
- Token resolution: `resolveToken` / `resolveTokenRgb` / `watchTheme` from `../lib/tokens`

## What Not to Do

- No bare hex/rgb colors in components — tokens only
- No `fetch`/`axios`/`localStorage`/file writes in components
- No mutations — derive or receive state, dispatch callbacks
- No new gate kinds, no new writer names
- No external libraries without approval

## UI Brief Template (use for every component request)

```markdown
# UI Brief: [Component Name]
## What — one-sentence purpose.
## Where — grid area; panel vs canvas node vs overlay; lazy-loaded? justify.
## State — exact LoomState reads (e.g. state.proposals.get(id) → Proposal).
## Writes — the postEvent human kinds dispatched (e.g. approve/reject).
## Existing Similar — one component to mirror (layout/pattern).
## Design Tokens — 2-3 tokens this surface needs.
## Constraints — coercion to the sections above + responsive at 820px.
## Acceptance — checklist; see the five checks below.
```

## Quality Gate (five checks)

```bash
# 1 Token usage — no bare hex in tsx/ts
rg -n '#[0-9a-fA-F]{6}|rgb\(' src/components/[Component].tsx || echo OK
# 2 Write constraint — no bypass
rg -n 'localStorage|fetch\(|axios|writeFile' src/components/[Component].tsx || echo OK
# 3 Types
pnpm --filter @p31/loom typecheck
# 4 Unit + e2e lanes
pnpm --filter @p31/loom test && pnpm --filter @p31/loom test:e2e
# 5 Integration — prop signature matches a row in Component Taxonomy; topology
#   verified manually at 820px; callbacks match App wiring.
```