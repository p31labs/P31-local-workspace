# Porting agent brief — Loom → canon + React

> **Status: port complete.** The Phase A/B port landed across commits
> `f5867add` → `3a1f0c26`. This brief is retained as the *method* for porting
> any future app into the canon shape — it is no longer a to-do list for the
> Loom. The completion criteria below all read as satisfied: 0 missing AAF
> actions, 0 used-but-not-in-canon tokens, a documented micro-element list,
> 21 e2e + 59 unit green.

You are porting the live Loom (`apps/loom/src`) to the canon + React layout
the production system expects. The prototype era is over. The live app already
uses the real transport (`/api/loom/event`, `postEvent`, SSE); the canon
generator wants the real *shape*.

## Read these first, in order

1. `docs/PROTOTYPE_MASTER_PROMPT.md` — the design constraints (the three
   humans, the hard rules, the porting contract).
2. `docs/PORTING_INVENTORY.md` — the current drift report. Every token, AAF
   action, class prefix, and event kind the live app uses.
3. `packages/canon/dist/tokens.css` — the canonical tokens. **These names are
   contractual.** The live app's `index.css` uses them, but it defines the
   loom-local ones itself; the port moves the canon ones to an import.
4. `packages/canon/src/loom/events.ts` — the canonical event kinds. The live
   app already uses `focus`, `propose`, `approve`, `reject`, `review`; the
   port does not invent new ones. Note the writer-per-kind gate in
   `packages/canon/src/loom/gate.ts` — a `propose` must be agent-authored, an
   `approve` must be human-authored. The port does not relax this.
5. `apps/loom/public/.well-known/agent-manifest.json` — the canonical AAF
   actions. The port does not add a `data-agent-action` that isn't here (see
   "What to do when the inventory finds a missing action," below).

## What the port actually changes

The live app is well-structured. The port is mostly *relocation*, not rewrite:

| Live location | Port target |
|---|---|
| `apps/loom/src/index.css` (canon tokens in `:root`) | `import '@p31/canon/tokens.css'` (delete the canon `:root` block; the generator owns it). The `--loom-*` and `--motion-scale` locals are loom-chrome and stay. |
| `apps/loom/src/index.css` (all `.loom-*`, `.lumi-*`, `.chapter-*`, etc.) | **NOT CSS modules.** The stylesheet is already organized into cascade layers (`@layer reset, base, tokens, components, utilities, overrides`, declared once at the top). The chapter components share a common vocabulary (`.chapter-*`, `.lumi-*`, `.made-*`), so per-component modules would force a shared module — one file with extra ceremony. Class names stay stable, so the e2e class selectors stay green. If `index.css` crosses ~2000 lines, split it by layer into plain files (`base.css`, `chapters.css`, `chrome.css`, `companion.css`) — still no hashing. |
| `apps/loom/src/components/*.tsx` | same file, same name; class names unchanged (the layer order handles precedence) |
| `apps/loom/src/lib/useLoomSound.ts`, `lib/colors.ts` | `apps/loom/src/hooks/` and `apps/loom/src/lib/` per canon directory convention |
| `postEvent(event, id)` calls | `commit(input)` from `@p31/canon/loom/commit` — the live app's transport middleware wraps it, so call sites don't change shape |
| `data-agent-*` attributes | unchanged — they already match the manifest |

**Do not rewrite logic.** The phase machines, the animationend-driven
transitions, the log-derived artifacts, the reduced-motion behavior — all of
it is already correct. The port is a mechanical lift.

## Rules

1. **One raw-value group per commit.** Work the inventory's "raw values that
   should be tokens" queue top to bottom, committing in small groups (e.g. the
   launchpad group, then the chapter group, then the companion group). Each
   commit runs `pnpm port-audit` and shrinks the raw-value section of the
   inventory. This replaces the earlier "one component per commit" rule, which
   assumed a CSS-module split; the stylesheet is a single layered file, so the
   queue is worked in-place.
2. **Never introduce a token.** If the inventory reports a used-but-not-in-canon
   token, that's a bug to fix at the *use site*, not a token to add. If a color
   is genuinely missing, note it in a `<!-- TOKEN GAP -->` comment and use the
   closest existing token — do not add to `tokens.css` by hand.
3. **Never introduce an AAF action.** If a component needs an action that isn't
   in the manifest, add it to the manifest in the *same* commit, and write the
   entry as if a fresh agent will read it a year from now.
4. **Never add an npm dependency** without asking. The system deliberately has
   almost none.
5. **Every commit must leave `pnpm test` and `pnpm test:e2e` green.** The port
   is a refactor, not a feature.
6. **The e2e tests are the contract.** If a test fails after the port, the port
   is wrong — not the test. The 19 e2e + 59 unit tests describe the design's
   behavior; they do not describe the prototype's.

## What to do when the inventory finds a missing action

The inventory's AAF section lists every `data-agent-action` the live app uses
that isn't in the manifest. The Phase A pass filled the 12 that were missing;
as of this writing the audit reports 0 used-but-unmanifested actions. Add any
new one in the same commit as the component that uses it, following the
existing entries' shape:

```json
{
  "name": "companion.back",
  "kind": "action",
  "danger": "none",
  "confirm": "never",
  "schema": {}
}
```

The entry's `name` is what the UI and tests reference; the `schema` is the
contract an agent needs before it may invoke the action. Write the description
as if a model is deciding whether it's allowed to call it.

Two manifest entries are deliberately *not* UI affordances: `loom.traverse`
and `loom.propose` carry `"surfaced": "agent-side"` — the agent commits them
directly to the log and they never appear as `data-agent-action` in the DOM.
Leave that marker intact; it is what tells the audit and a scanning model that
their absence from the DOM is intentional, not a gap.

## What to do when the inventory finds a raw value

The inventory's "raw values that should be tokens" section is the porting
queue. Work it top to bottom. Each one is either:

- A color — replace with the nearest `var(--p31-*)`. If nothing fits, a
  `<!-- TOKEN GAP -->` comment + closest match.
- A spacing — replace with `var(--p31-layout-spacing-*)`. The live app already
  does this almost everywhere; any raw px in a padding/margin/gap is a leak.
- A duration — replace with `calc(<base> * var(--motion-scale))`. Never a bare
  `300ms`.
- A deliberate size (e.g. `min-height: 64px` on a touch target) — keep it, but
  the inventory will keep reporting it. If it is truly a design constant, lift
  it to a token once, then it stops appearing.

## How to know you're done

Run `pnpm port-audit`. The port is complete when:

- `tokens.usedNotInCanon` is empty (the six `--loom-*` locals are expected —
  they are app chrome, not canon).
- `actions.usedNotInManifest` is empty.
- `eventKinds.usedNotInCanon` is empty.
- `rawValues` is empty (or every remaining entry is a documented, token-lifted
  design constant).
- `pnpm test` and `pnpm test:e2e` are green.
- `git log --oneline` shows small, themed commits (one raw-value group each),
  not one giant "port everything" commit.

A second condition worth stating: the class-name selectors in the e2e tests are
a *feature*, not a liability. The layered single-file stylesheet keeps class
names stable, so the 20 e2e tests keep selecting `.chapter-action`,
`.made-artifact-label`, etc. — no `data-testid` layer, no selector migration.
The AAF attributes remain the agent-legibility layer; class names are the test
contract. Do not introduce a `data-testid` attribute to "fix" the tests — the
class-based selectors are correct here.

## What NOT to do

- Do not refactor a component's behavior while porting it. If the port reveals
  a bug, fix it in a follow-up commit, not the port commit.
- Do not rename a class that the e2e tests select. If a test says
  `.chapter-action--ok`, the class stays `.chapter-action--ok`. If a class
  genuinely needs renaming, rename it in a commit that also updates the test —
  never one without the other.
- Do not port the `docs/` directory. Documentation is not a React artifact.
- Do not touch the transport (`/api/loom/event`, `postEvent`, SSE). It works.