# The Loom UI Development Guide

A system for AI-assisted component generation on the P31 Loom canvas.

**Status:** Production — corrected against a verified scan of `apps/loom/src/`
(`App.tsx`, `index.css`, `lib/tokens.ts`, `lib/surface.ts`, `lib/profile.ts`,
`lib/useLoomState.ts`, `lib/useInstrument.ts`) and
`packages/canon/src/loom/{gate.ts,events.ts}`.

**Audience:** Bash & Willow, and every developer or AI agent who generates UI
for the Loom.

**Companion files** (this guide is the umbrella; these are the working parts):

| File | Role |
|---|---|
| `UI_CONTEXT.md` | System of record — tokens, channels, taxonomy, constraints |
| `BRIEF-ProposalReviewPanel.md` | Worked example of the brief format |
| `AGENT_UI_PROMPT.md` | Copy-paste preamble for the coding agent |

---

## 1. Philosophy

The Loom is a design-system canvas where a human and AI agents are co-present
on a shared, append-only event log. The UI is the *projection* of that log, not
a second source of truth.

Three invariants hold the whole system together:

1. **The log is the source of truth.** State is derived by replaying events,
   in exactly one place. A second derivation is a divergence, not a
   convenience.
2. **A component is a pure consumer.** Props in, callbacks out. It never
   fetches, never writes, never owns state that belongs in the log.
3. **Writes flow through one gate.** Human decisions are posted as warp events
   through `postEvent()`, wired in `App.tsx`. Observational context (weft) is
   written only by middleware, never by a component.

This separation is what makes the Loom auditable, deterministic, and safe to
extend with AI-generated code. The guide exists so the AI doesn't have to
*guess* the boundary — it reads the map.

---

## 2. The System of Record

The full record lives in `UI_CONTEXT.md`. The parts that matter for every
request are reproduced here so you never have to hold them in memory.

### 2.1 Design tokens

Every color resolves from a `--p31-*` token referenced as
`var(--p31-token, <fallback>)`. The fallback must be the exact literal below —
it renders if the token fails to resolve, so a wrong fallback is a silent
visual bug, not a typo.

| Token | Fallback | Use |
|---|---|---|
| `--p31-accent` | `rgb(0, 240, 255)` | cyan — primary accent, human focus ring |
| `--p31-accent-green` | `rgb(52, 211, 153)` | approve, healthy state |
| `--p31-accent-gold` | `rgb(251, 191, 36)` | component-kind badge, gold glow |
| `--p31-accent-red` | `rgb(251, 113, 133)` | reject, drifted/warning |
| `--p31-accent-violet` | `rgb(167, 139, 250)` | agent cursor, trail |
| `--p31-text` | `rgb(226, 232, 240)` | primary text |
| `--p31-text-secondary` | `rgb(148, 163, 184)` | secondary text |
| `--p31-text-tertiary` | `rgb(100, 116, 139)` | hints, metadata, disabled |
| `--p31-surface` | `#12121a` | card/control backgrounds |
| `--p31-bg` | `#0a0e14` | primary UI background |
| `--p31-glass-border` | `rgba(255, 255, 255, 0.1)` | borders, dividers |
| `--p31-glass-surface` | `rgba(255, 255, 255, 0.06)` | glass fills |
| `--p31-glow-amber` | `rgba(251, 191, 36, 0.5)` | gold glow/shadow |
| `--p31-font-sans` / `--p31-font-mono` | `system-ui` / `monospace` | font families |

Rules:

- No bare `rgb()`, `#hex`, or `rgba()` literals in component code.
- The Jitterbug WebGL canvas draws a raw `rgb(2, 3, 8)` internally. That is a
  GL-internal literal, **not** the `--p31-bg` fallback. Do not reuse it, and do
  not let it convince you the table is wrong.
- Canvas 2D / shader `vec3` uniforms cannot parse `var()` — use
  `resolveToken(token)` / `resolveTokenRgb(token)` from `../lib/tokens`.
  Everything else uses CSS vars.

### 2.2 Write channels: warp & weft

Two channels move information. Components only ever touch one, and only via
callbacks.

**Warp — human intent.** The only thing a component may *cause*. App wires
callbacks to:

```ts
async function postEvent(input: LoomEventInput, humanId: string | null): Promise<void>
```

Human-only warp kinds (writer-per-kind is enforced by the gate; a component can
never legally dispatch anything outside this list):

| Kind | Field(s) | Meaning |
|---|---|---|
| `focus` | `node` | navigation — which node the human is reading |
| `revise` | `proposal`, `body` | human edits a proposal's body |
| `approve` | `proposal` | human accepts a proposal |
| `reject` | `proposal`, `reason` | human declines with a reason |
| `view.save` | `label`, `from`, `to` | snapshot a window of the log |

Note the field is `proposal`, **not** `proposalId` (`gate.ts:31-32`):

```ts
postEvent({ writer: 'human', kind: 'approve', proposal: proposal.id }, humanId)
postEvent({ writer: 'human', kind: 'reject', proposal: proposal.id, reason }, humanId)
```

**Weft — observational context.** Read-only to every component. Carries
`view.read` (human opened the instrument / focused a node) and `agent.cursor`.
Weft is written **only** by middleware — `useInstrument.emitRead` posts
`view.read` to `POST /api/loom/weft`. A component never dispatches weft, and
`view.read` is not a warp kind.

> If a component needs to *cause* something → warp (via callback). If it needs
> to *know* something → read it from props.

### 2.3 Read path

State is derived by replay, in one place only:

- **`useLoomState()`** — fetches `GET /api/loom/events`, subscribes to SSE
  `GET /api/loom/stream`, folds via `replay()`. The only place `reduce`/`replay`
  runs in the app. Exposes `{ events, state, seq, scrub, follow }`.
- **`useProfile()`** — human identity + tier.

Never re-derive state by another route.

### 2.4 Component taxonomy (verified prop signatures)

Each component has a narrow, specific prop interface. There is no generic
shared shape — do not invent one, and do not reuse a component's shape for a
different component.

| Component | Props | Area / purpose |
|---|---|---|
| **EventOverlay** | `{ events: LoomEvent[]; seq: number; onFollow: () => void; onSelect: (seq: number) => void }` | `panel` — append-only event log, colored by writer |
| **TimelineScrubber** | `{ logLength: number; currentSeq: number; onSeqChange: (seq: number) => void }` | `scrub` — seek via `gate.stateAt(seq)` |
| **ProposalNode** | `NodeProps` (from `@xyflow/react`); `data: { label: string; survival: number; tone: string }` | `canvas` — React Flow node |
| **ProposalDigest** | `{ state: LoomState; onSelect: (id: string) => void }` | `panel` — beginner-tier digest |
| **Instrument** | `{ scene: Scene; reading: Reading; onFocus?: (id: string \| null) => void }` — `Scene`/`Reading` from `@p31/field` | `canvas` — Canvas 2D field view |
| **JitterbugScene** | *(none)* | `canvas` — WebGL closure; lazy-loaded via `Suspense` (~530 kB three.js justifies it) |
| **ProposalReviewPanel** | see `BRIEF-ProposalReviewPanel.md` | `panel` — first extraction target; currently inline in `App.tsx:196-252` |

### 2.5 Callback wiring (what actually dispatches where)

This is the most frequently mis-documented table. In the current `App.tsx`,
**every component callback is local UI state** — none of them dispatch warp or
weft directly:

| Callback | Wired to (App.tsx) | Effect |
|---|---|---|
| `EventOverlay.onSelect` | `scrub` (`:254`) | pins the view to a seq |
| `EventOverlay.onFollow` | `follow` (`:254`) | resumes following the head |
| `ProposalDigest.onSelect` | `selectProposal` (`:256`) | selects a proposal for review |
| `Instrument.onFocus` | `setFocus` (`:173`) | zooms the instrument to a zone |
| `TimelineScrubber.onSeqChange` | `scrub` (`:267`) | scrubs to a seq |

Warp is dispatched by **App's handlers**, not by components:

- Node click → `postEvent({ writer: 'human', kind: 'focus', node }, humanId)` (`App.tsx:129`)
- Approve → `postEvent({ writer: 'human', kind: 'approve', proposal: proposal.id }, humanId)` (`App.tsx:212`)
- Reject → `postEvent({ writer: 'human', kind: 'reject', proposal: proposal.id, reason: rejectReasonFor(tier, reason) }, humanId)` (`App.tsx:231-239`)

Weft `view.read` is emitted by `useInstrument.emitRead`, invoked from App's
effect when the instrument mode is active (`App.tsx:64-66`) — not from any
component.

**Implication for briefs:** a component declares callbacks; the brief states
what App does with each one. Components are presentational; App owns logic,
state, and the write path.

### 2.6 Tier behavior

`Tier = 'beginner' | 'intermediate' | 'advanced'` lives in `src/lib/profile.ts`
(`profile.ts:45`) — **not** `surface.ts`.

Pure tier helpers live in `src/lib/surface.ts`:

- `effectiveTier(tier, showMore)` — beginner "show me more" promotes to advanced for the session
- `resolveSurface(tier)` — `{ showOverlay, showScrubber, showSurvival }`
- `approveLabel(tier)` — `'Looks good'` (beginner) vs `'Approve'`
- `rejectReasonFor(tier, reason)` — `'deferred by human'` (beginner) vs `'rejected by human'` when reason is empty

Tier changes what the canvas *surfaces*, never what the log *records*. Don't
gate a warp write behind tier — gate the UI affordance.

### 2.7 Layout & responsive

```css
display: grid;
grid-template-columns: 1fr 320px;
grid-template-rows: 48px 1fr auto;
grid-template-areas:
  "bar    bar"
  "canvas panel"
  "scrub  scrub";
```

- Canvas: `grid-area: canvas; min-height: 0` (prevents overflow).
- Panel: `grid-area: panel; overflow: auto` — scrolls internally, page body never scrolls.
- Breakpoint: **820px**, not Tailwind's 768px.

### 2.8 Patterns to honor

- **Reduced motion**: `prefers-reduced-motion` collapses decorative motion; Instrument and Jitterbug draw a single static frame.
- **Progressive disclosure**: `.loom-shell` carries `data-tier`.
- **A11y floor**: `--loom-letter-spacing` / `--loom-line-height` / `--loom-density` on `:root`; ≥48px targets, 2px focus rings.
- **No model names** in `src/` (seal gate `check-no-agent-names.mjs`) — role language only.

---

## 3. The Brief

The brief is the contract between human and AI. It must be precise enough that
the AI can implement without guessing, and complete enough that a reviewer can
verify without ambiguity.

### 3.1 Sections

Use `BRIEF-ProposalReviewPanel.md` as the template. Every brief has:

1. **What** — one-sentence purpose.
2. **Where** — grid area (`canvas` / `panel` / `scrub` / overlay); lazy-loaded? justify.
3. **State** — exact prop shape for *this* component; types from `@p31/canon/loom/events`.
4. **Writes** — which callbacks, their exact signatures, and what App does with each.
5. **Existing Similar** — one component to mirror in *pattern* (pure render, callback-only).
6. **Design Tokens** — the 2–3 `--p31-*` tokens this surface needs.
7. **Constraints** — tokens only; no fetch/localStorage; no new callbacks without defining them; 820px; no new CSS classes.
8. **Acceptance** — a verifiable checklist.

### 3.2 Correcting the common brief errors

The first draft of the ProposalReviewPanel brief contained errors that were
caught by checking against the code. Watch for these same errors in any brief:

- `proposalId` field → the real field is `proposal` (`gate.ts:31-32`).
- `Tier` imported from `../lib/surface` → it's `../lib/profile`.
- `onReject: () => void` in one place and `onReject: (reason: string) => void`
  in another → pick one; the reason must flow up, so `(reason: string) => void`.
- `reading: boolean` on Instrument → it's `reading: Reading` (a `@p31/field` type).
- A generic `{ state?, events?, selectedId?, ... }` shape → each component has its own narrow interface.

---

## 4. The Agent Preamble

`AGENT_UI_PROMPT.md` is pasted before every request. Its non-negotiables:

1. Colors: `var(--p31-*, fallback)` only; fallbacks match the table exactly.
2. Writes: callbacks only; no `fetch`, `localStorage`, or file writes.
3. Callbacks: taxonomy names only, with the correct per-component signature.
4. Types: `LoomState`/`LoomEvent`/`Proposal`/`Review` from `@p31/canon/loom/events`; `LoomEventInput` from `@p31/canon/loom/gate` — `LoomState` is **not** exported from `gate`.
5. Responsive: 820px.
6. No model names.
7. No new libraries (React 19, React Flow `@xyflow/react`, Three.js — lazy-loaded, Canvas 2D).
8. Code style: single quotes, no semicolons, 2-space indent, strict mode, no `any`.

The ten common mistakes enumerated there are real — the agent has made each of
them even when briefed. Keep them in the preamble; they are the cheapest
quality win in the whole system.

---

## 5. Workflow

```
Brief → Prompt → Code → Verify → Manual review → Land → Archive
```

1. **Brief.** Write it with the template; answer the agent's clarifying questions.
2. **Code.** The agent ships `.tsx` + `.test.tsx`.
3. **Verify.** Run the gate (Section 6). All must pass.
4. **Manual review.** Callbacks match the brief; class names match `index.css`; responsive at 820px; tier behavior preserved.
5. **Land.** Component + tests, export from `index.ts`, wire into `App.tsx`, PR `ui: extract <Name>` / `ui: add <Name>` linking the brief.
6. **Archive.** Brief stays in `apps/loom/` as the spec.

Typical total: ~20–30 minutes per component.

---

## 6. Quality Gate

```bash
COMPONENT=MyComponent

# 1. Tokens — no bare color literals
rg 'rgb\(|#[0-9a-fA-F]{6}|rgba\(' src/components/$COMPONENT.tsx && echo "❌ color" || echo "✅ tokens"

# 2. Writes — no bypass
rg 'localStorage|fetch\(|axios|writeFile' src/components/$COMPONENT.tsx && echo "❌ write" || echo "✅ callbacks"

# 3. Callback audit — cross-reference the taxonomy
rg 'on[A-Z]\w+' src/components/$COMPONENT.tsx | sort -u

# 4. TypeScript
pnpm --filter @p31/loom typecheck

# 5. Tests  (`test` = `vitest run` in package.json)
pnpm --filter @p31/loom test

# 6. Visual (manual): 820px breakpoint + callback signatures + class names
```

CI re-runs 1–5; check 6 stays manual.

---

## 7. Research-Backed Insights

The system above is grounded in the codebase. These findings from current
research sharpen it further. (Sources cited by name; verify URLs before
relying on them.)

### 7.1 Design-system documentation (Storybook, zeroheight)

- **Write for designers and developers.** Cover the "why" (principles, usage)
  and the "how" (props, code) together.
- **Keep docs in sync with code.** Docs drift when they live apart from the
  work; treat the doc as part of the component contract — ship both together.
- **Show live, rendered components**, not screenshots or pasted snippets.
- **The W3C Design System Documentation Spec (DSDS)** is standardizing a
  machine-readable format for design-system docs (components, tokens, themes,
  foundations, patterns, guides, chunks). Relevant because AI agents will
  consume design systems — a shared format means agents can navigate docs too.

**Application:** the brief *is* documentation. Archive it, link it in the PR,
and update it when the component changes. Watch DSDS as a future format for
how briefs are structured.

### 7.2 AI code-generation constraints (Karpathy-style simplicity)

- **Write the minimum code to solve the problem.** No speculative features.
- **Surgical edits.** Don't improve adjacent code as a drive-by edit.
- **Test-first.** Verify a bug with a failing test before writing the fix.
- **Bounded autonomy.** AI agents perform best when constrained; rules prevent
  scope drift and process theater.

**Application:** the preamble is a constraint harness. Keep the rules tight but
avoid over-constraining — see 7.3.

### 7.3 Context engineering (modern context-engineering guidance)

- **Rules → let the model use judgement.** Dense "Never:" walls are less
  effective than code that reads like the surrounding code.
- **Examples → design interfaces.** A worked example constrains the model to
  the right exploration space.
- **Avoid conflicting instructions across layers.** System prompt, skill, and
  user request must not contradict each other.

**Application:** keep the preamble's *safety* rails (tokens, callbacks, types)
as hard rules; leave *stylistic* choices (indentation, naming) to be inferred
from the codebase. `BRIEF-ProposalReviewPanel.md` is the "worked example" that
anchors the model.

### 7.4 Prompt engineering for coding agents (Bayesian framing)

- **Give evidence that eliminates**, not evidence that repeats — each example
  should rule out a category of wrong interpretation.
- **Break complex tasks into steps.** Agents have fixed depth per forward pass;
  overly complex single prompts "run out of layers" and hallucinate.
- **Keep prompts domain-focused.** Mixed-domain prompts activate competing
  "inference tracks" and create interference.

**Application:** the workflow already decomposes (brief → code → verify). Keep
each brief to one component, one grid area, one callback set.

### 7.5 React composition (PatternsDev, 2026)

- **Replace boolean props with composition.** N booleans = 2^N states; use
  composable children or variant components instead.
- **Compound components + context** share implicit state without prop drilling.
- **Use children over render props** for composition.

**Application:** if a Loom component accumulates more than 3–4 boolean props,
refactor to compound components. The current taxonomy is already narrow and
focused — keep it that way.

### 7.6 The Jitterbug geometry

The Jitterbug is Buckminster Fuller's dynamic polyhedral transformation: a
cuboctahedron contracts through an icosahedron and octahedron to a tetrahedron,
with three distinct "click-stops" (vector equilibrium → icosahedron →
octahedron → tetrahedron). `JitterbugScene` renders this as the topological
twin of the Sierpiński gap: the field starts open (β₂ = 0) and closes to the
tetrahedron (β₂ = 1). The geometry is not decorative — it is the visual
foundation of the field's closure operation.

---

## 8. Worked Example: ProposalReviewPanel

The first component extracted with this system. Full brief in
`BRIEF-ProposalReviewPanel.md`; the summary:

- **What:** presentational panel for a selected proposal + tier-specific
  decision controls (approve / reject / beginner "Not yet" gate).
- **Where:** `grid-area: panel`, sibling to `EventOverlay`. Not lazy-loaded.
- **State (corrected):**

```ts
import type { Proposal } from '@p31/canon/loom/events'
import type { Tier } from '../lib/profile'   // not ../lib/surface

interface ProposalReviewPanelProps {
  proposal: Proposal
  tier: Tier
  reason: string
  notYet: boolean
  onApprove: () => void
  onReject: (reason: string) => void          // reason flows up
  onReasonChange: (reason: string) => void
  onToggleNotYet: () => void
}
```

- **Writes:** callbacks only. App wires `onApprove` → `postEvent({ writer: 'human', kind: 'approve', proposal: proposal.id })` and `onReject` → `postEvent({ writer: 'human', kind: 'reject', proposal: proposal.id, reason: rejectReasonFor(tier, reason) })`. The component never computes the final reason; App does.
- **Tokens:** `--p31-text`, `--p31-text-secondary`, `--p31-text-tertiary`, `--p31-accent-green` (`.loom-btn--ok`), `--p31-accent-red` (`.loom-btn--no`), `--p31-surface`, `--p31-glass-border`, `--p31-accent-gold` (`.loom-kind--component`). All classes already exist in `index.css`.
- **Tier behavior:** `approveLabel(tier)` on the approve button; beginner `!notYet` shows "Not yet?"; advanced shows the `.loom-json` `<pre>`.

---

## 9. Maintenance

These docs drift from the code if nobody re-checks them. The rule: **a stale
prop shape is worse than no doc at all.**

- New token → update `UI_CONTEXT.md` token table, verify fallback against `lib/tokens.ts` / `index.css`.
- New callback → update the taxonomy and wiring tables.
- New common mistake → add it to `UI_CONTEXT.md` / the preamble.
- A component's props change → update its taxonomy row immediately.

All updates go through a brief review. Re-verify the token and prop tables
against `HEAD` before trusting this doc again — it is a snapshot, not a live
source.

---

**For Bash & Willow.** When the brief + preamble + local verification work, and
the docs stay honest about the code, the canvas stays reliable. That means
fewer surprises, faster iteration, and more time for the game. Keep the Loom
beating.
