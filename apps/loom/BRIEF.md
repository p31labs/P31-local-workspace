# β-2 Brief — Canvas Lane

**Owner:** `apps/loom/**`
**Reads:** `@p31/canon/loom/{events,gate,jsonl,commit}`
**Does not touch:** `packages/canon/src/loom/**`, `packages/canon-mcp/**`, `packages/canon/scripts/**`

## Grounding (verified against disk)

`apps/loom/src/` today is a static registry renderer:
- `graph.ts` — `buildGraph()`: 287 static nodes (tokens/classes/component/themes),
  fixed ring layout, ids namespaced (`token:--p31-accent`, `class:.glass-card`,
  `component:Button`, `theme:ocean`).
- `App.tsx` — renders the graph and a side panel; local `focused` string only;
  `POST /api/loom/focus` at line 37 is a fire-and-forget stub.
- `main.tsx`, `index.css` — mount and plain CSS on `var(--p31-*)`. No Tailwind.
- `package.json` — dev/build/preview/typecheck only. No vitest, no Playwright,
  no `@p31/canon-mcp`.

The Loom event model uses **bare node names** (`--p31-accent`, `.glass-card`,
`Button`, `ocean`). The graph uses **namespaced ids**. The canvas reconciles.

## The one architectural decision

**The registry graph is the persistent base; the event log is a live overlay
referencing its node ids.** Do not replace `buildGraph()`. Do not re-layout
the ring on every event.

Node identity:
- Base graph nodes: memoized once, keyed by graph id, stable across renders.
- Overlay nodes (proposal ghosts, path trail markers): keyed by event seq,
  positioned independently of the ring.
- Cursor layer: absolutely positioned, not React Flow nodes.

## Reconciliation

Reverse-index the graph once at load: `Map<bareName, namespacedId>` populated
from `buildGraph()`. Events reference bare names; the canvas looks up.
Do not use prefix heuristics — `ocean` and `Button` are both bare words with
different namespaces. Collisions fail loudly at index time.

## Path resolution

`src/lib/logPath.ts` — `resolveLogPath()` finds the repo root by walking up
to `pnpm-workspace.yaml` and returns `<root>/.loom/events.jsonl`, or
`process.env.LOOM_LOG` if set. The Vite middleware and the demo agent both
import this. Two different defaults means the convergence test passes against
an empty log on one side.

## Prerequisites (lane-owned, no substrate change)

Add to `apps/loom/package.json`: `vitest`, `@testing-library/react`,
`@playwright/test`. If the monorepo has a single lockfile, commit the lockfile
diff too or CI install fails.

## Deliverables, in order

1. `src/lib/logPath.ts` + `src/lib/useLoomState.ts` — the hook owns the log:
   fetch `/api/loom/events`, subscribe `/api/loom/stream`, fold via
   `replay(events)` / `gate.stateAt(seq)`, expose `{events, state, seq, scrub}`.
   This is the only place `reduce` runs in the app.
   **Gate:** renders a 60-event seeded log with no frame drops.

2. Vite middleware (`vite.config.ts` `configureServer`) —
   - `POST /api/loom/event` → `commit(logPath, body.input)`.
     Structured so a future authenticated wrapper can override
     `body.input.writer` before the call. One line; write it that way now.
   - `GET /api/loom/events` → `readEvents(logPath)`.
   - `GET /api/loom/stream` → SSE tail with `X-Accel-Buffering: no` and
     `Last-Event-ID`. SSE carries **only new events**; on reconnect the client
     re-fetches `/api/loom/events` and re-derives. Document the choice.
   - Rename the stub call site at `App.tsx:37` to use the generic endpoint.
   **Gate:** `curl` POST lands a line in `<root>/.loom/events.jsonl`;
   SSE delivers within 500 ms.

3. Overlay — render `state.agentCursor` (presence), `state.agentPath`
   (traverse trail), `state.proposals` (propose → ghost nodes) onto the
   registry graph. Focus ring on `state.focused`. Base nodes stay stable;
   overlay nodes keyed by event seq.
   **Gate:** a 10-event synthetic log renders the correct focus/cursor/proposal
   state (component test).

4. `EventOverlay.tsx` — color by writer (human/agent/system), scroll,
   click-to-highlight. Reuses `--p31-*` tokens.

5. `TimelineScrubber.tsx` — RAF play; drag → `scrub(seq)` → `stateAt(seq)`.
   **Gate:** seq 5 vs seq 50 render two distinct states.

6. `e2e/convergence.spec.ts` — Playwright:
   - start dev server
   - spawn the demo agent as a child (imports the same `resolveLogPath()`)
   - assert **the first** ghost proposal + cursor + overlay events appear
     within 5 s (not the full sequence — the demo takes 2–6 s to finish, and
     asserting the terminal state races)
   - approve via canvas, assert the ghost solidifies
   - run `packages/canon`'s `test:loom` against the mutated log
   **Gate:** `pnpm --filter @p31/loom test:e2e` exits 0.

## Hard constraints

- Canvas is read-only against the log. The only write path is
  `/api/loom/event → commit()`.
- No client-side state derivation outside `useLoomState`.
- No model names in `apps/loom/src/**` or `vite.config.ts` — role language.
- The seal gate still holds: no direct append anywhere.

## Propose-back to substrate (do not edit; file as proposals)

- ~~`check-loom-seal.mjs` and `check-no-agent-names.mjs` scan `apps/loom/src`
  but not `apps/loom/vite.config.ts`.~~ **Resolved** (`6469a45c`): both gates now
  scan `apps/loom/` with `node_modules`/`dist` filtered, and `vite.config.ts` is
  covered.
- Node-identity namespacing in the log itself: canvas-side reconciliation is
  sufficient today. Only propose if a second consumer disagrees about the
  scheme.

## Lane gates

- `pnpm --filter @p31/loom typecheck` exits 0
- `pnpm --filter @p31/loom test` exits 0
- `pnpm --filter @p31/loom test:e2e` exits 0
- `packages/canon` `test:loom` still seven-green after merge
