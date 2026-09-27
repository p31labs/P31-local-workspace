# @p31/canon-react — session corrections, gaps & changelog

Trust byte counts, tsc exits, and test output over any narrative — including
this file. The handoff's own rule: a lie reported as success is worse than a
failure reported as a failure.

## 2026-09-19 — Phase 2 landing

Precondition 3 caught a real canon gap before a single component file was
written: `dist/tokens.css` carried the palette tier only — the semantic tier
(`--p31-color-action-*`, `--p31-space-inline-*`, `--p31-font-size-*`,
`--p31-motion-*`) existed in `tokens.dtc.json` but never as CSS custom
properties. Button.css reads those names; in a browser the button would render
transparent and unpadded. jsdom cannot see it — the preconditions could.

Fixed in `packages/canon/scripts/gen-tokens.mjs`: every CSS block now also
emits SEMANTIC_MAP slots, wrapped in `@layer p31.tokens` with a one-time layer
order. `tokens.dtc.json` stayed byte-stable at 34,961 (290 leaves, CONVERGE).

### Honest gaps — named now, closed later (Phase 2.5 / Phase 3)
1. **Scorers are static.** `verify-contract.mjs` reads source text. It catches
   a variant added to Button.tsx without the contract, but not behavioral
   drift — a Button that sets aria-disabled yet still fires onClick. The unit
   tests catch that today; the Phase 3 eval harness generalizes it.
2. **No visual regression.** jsdom does not evaluate CSS variables. If a
   `--p31-*` name in Button.css misses the emitted CSS, `pnpm test` still
   passes and the button renders wrong in a browser. Precondition 3 is the
   source-level proxy (grep every `var(--p31-*)` in component CSS against the
   DTCG tree); a real-browser check comes in Phase 3.
3. **Slot on React 19.** The runtime resolves to React 18.3.1 (root override)
   with @types/react 19. `cloneElement` + merged ref works; React 19 changed
   ref plumbing. The asChild test proves the happy path only.
4. **build-css.mjs exists now, but has no ordering contract yet.** Concatenation
   is sorted and `@layer` reopens safely. When components grow to multiple CSS
   files with competing specificity, ordered layers must be audited.
5. **Exports generation gates on built artifacts** (gen-exports.mjs). Correct
   by design; the cost is that `./styles.css` ghosts until `pnpm build` runs.
   Wire `gen:exports` into a CI gate before anything publishes.

### Source-level contract cheatsheet (keep current)
- Package face `src/index.ts` has NO `'use client'`. Client-only exports live
  in `src/client.ts`. Button is currently stateless → both surfaces identical.
- `verify-contract.mjs` must be extended per component: add an enumProbe entry
  for each enum prop and a props pass. It is Button-shaped today.

### Test-discovered bugs fixed this session (tests caught what static gates can't)
1. **jest-dom matchers never registered under Vitest 3 + pnpm.** The
   documented `import '@testing-library/jest-dom/vitest'` side-effect imports
   `expect` from a 'vitest' the pnpm store resolves to a different instance
   than the runner's — matchers were silently absent ("Invalid Chai
   property: toHaveAttribute"). Fix in `test-setup.ts`: import `expect` from
   'vitest' ourselves and `expect.extend` both jest-dom/`matchers` and
   `vitest-axe/matchers` against it. vitest-axe's manual extend proving the
   pattern worked is what exposed the jest-dom miss.
2. **asChild rendered Slot multiple children → `Children.only` threw.** Button
   always wrapped its label/spinner inside the composition; with asChild the
   consumer element became second child of Slot. Fix in `Button.tsx`: when
   `asChild`, forward the consumer `children` directly into Slot (no label
   span) — the consumer provides the content; the label wrapper is
   non-asChild rendering only.
3. **vitest-axe 0.1.0 augments the removed `namespace Vi`.** Its runtime
   matcher works on Vitest 3; its TYPES are stale. Fix: `src/vitest-axe-types.d.ts`
   augments `module 'vitest'` `Assertion`/`AsymmetricMatchersContaining` with
   `AxeMatchers`, mirroring @testing-library/jest-dom's types/vitest.d.ts.
4. **`*/` inside a block comment** (the glob `src/**/*.css` in build-css.mjs's
   JSDoc) terminates the comment early and broke the build. Avoid literal
   `**/` in comments; the banner avoids it too so generated styles.css stays
   valid.

## Review-fed closures (2026-09-19) — gaps the 7 gates cannot see, held to the same standard

The gates passed before closure; these were found by cross-review, then pinned
with evidence. A green gate is not a license to skip the question.

1. **asChild + loading — contract lowered, not preserved.** Contract said
   `loading` "shows a spinner and sets aria-busy"; the asChild path forwards
   the consumer element into Slot with no spinner. `requiredAria` was NOT
   violated — `Slot.mergeProps` (Slot.tsx:35) passes `aria-busy` (slotValue)
   onto the child, since the child has no such prop — the promise that was
   broken was only the *visual*. Slot enforces a single consumer element
   (`Children.only`, Slot.tsx:47), so the spinner cannot be composed into the
   child without destroying the consumer's content.
   **This is a weakening, and it is named as one.** `button.contract.ts`
   `loading` description and `semanticParts.spinner` were changed to state
   the spinner is default-rendering only and asChild delegates the
   interrupted-state visual to the consumer. That is the contract matching
   the code, not the code matching the contract. A CSS `::before` spinner on
   `[aria-busy='true']` would have preserved the original promise without
   DOM injection — rejected because no visual regression tool can evaluate
   it. The verification gap is real: the "loading shows a visual" promise
   is not yet testable in asChild mode, and the lowered contract documents
   that rather than papering over it.
   Pinned by `Button.test.tsx` "asChild + loading: reflected aria-busy and
   click block, no composed spinner" — asserts `aria-busy="true"` on the
   link, no `.p31-button__spinner`, onClick blocked. The CSS changed nothing
   (opacity 0.6 on `[aria-busy]` applies to both shapes).
   Open for Phase 3 or a future decision: should asChild buttons display a
   loading visual? If yes, the `::before` approach needs a real-browser
   test; if no, the current description is correct and no further action
   is needed.

2. **RSC boundary was declared, not verified.** Now verified on the built
   artifact: `dist/index.js` opens with `import { Button, Slot …` — no
   `"use client"`; `dist/client.js` opens with `"use client"`; grep across
   `index.js` + chunk found zero directive leakage (grep exit 1). The boundary
   holds at runtime, not just in source. `index.d.ts` re-exporting from
   `./client.js` is a type-surface adjacency; directives are runtime-only and
   the runtime graph does not cross.
3. **`linkWorkspacePackages: true` is a global resolution change.** Audited:
   all 140 workspace package names → consumer declarations that overlap are
   `@p31/*` and `@counterscale/*`, every one declared `workspace:*` or `file:`
   (intentional). The single bare `"@counterscale/tracker": "*"` lives in
   `apps/counterscale/packages/server` — a nested dir matching no workspace
   glob, hence not linkable, hence unaffected. Real consumer build:
   `pnpm --filter design-hub build` (consumes `@p31/design-system` via `file:`)
   → `✓ built in 4.29s`, 1513 modules. Resolution intact.
   NOTE: `pnpm --filter p31ca build` is unreachable today — its own prebuild
   gate fails on *unrelated* content freshness (`love.json`/`nonprofit.json`
   737h > 720h threshold, `verify-content-consistency`). `verify-ground-truth:
   OK`. Not bypassed; not caused by the flag; filed as a stale-data gate.
4. **`verify-contract.mjs`'s prop extraction is Button-shaped.**
   `/interface\s+ButtonProps\s+extends[^{]*\{([\s\S]*?)\n\}/` matches up to the
   first `\n}` — correct while props stay flat, silent-misparse the first time
   a prop type contains a nested `{` (e.g. a variant-map object). Not rewritten
   here; the Phase 3 eval harness should be AST-based (ts-morph/TypeScript) and
   supersedes it. This note is the standing instruction.

### Standing recommendation for Phase 3
Phase 2 proved the static gates are necessary and insufficient: all four bugs
the tests caught were behavioral, invisible to `verify-contract.mjs`. Phase 3
is NOT another component — it is the **runtime eval harness**: Gusto's three
scorers (prop-validity, enum-validity, import-match) driven against a DOM
instance in a real browser (Playwright), asserting the *behavioral* readings
(disabled+loading block clicks, aria-busy reflects, asChild keeps its element,
`--p31-*` vars resolve to non-empty values). The next component doesn't prove
the pattern; the next scorer does.

## 2026-09-19 — Phase 3 runtime eval harness landed, contract-driven

`interactionStates` went from an array of names to a record of observable
predicates (`schema.ts:122`). The harness derives one Playwright assertion per
state from the contract — the agent that wrote Button does not choose what to
test; the contract does. Named the structural fix for same-session
self-verification: assertions are derived, not hand-authored.

Differential proof (contract → harness → assertion): added a `__fake__` state
to `button.contract.ts` → harness generated a 7th test that FAILED (missing
fixture, clean error). Removed the fake → 6/6 green again. Test count moved
with the contract; that is the derivation, demonstrated.

Evidence (all local commands, exit codes captured):
```
canon validate-contracts          → "1 validated, 290 tokens in DTCG • Button (5 props)", exit 0
canon-react verify-contract       → 5 props, 2 enums, import-match, state-record (6 states), exit 0
canon-react pnpm test             → 14/14 passed, exit 0
canon-react check-css-vars        → 17/17 references resolve, exit 0
playwright verify-states          → 6/6 passed (chromium, playwright-button.config.ts), exit 0
playwright verify-states + fake   → 7 tests, 1 failed (the fake), 6 passed, exit 1
playwright verify-states (clean)  → 6/6 passed, exit 0
```
`migrate-contract.mjs` (new, `packages/canon/scripts`) rewrites a legacy
`interactionStates: ['a','b']` array to the record shape with conservative
default predicates that pass the gate; tested against a legacy fixture
in /tmp and prints a REVIEW REQUIRED notice — defaults are placeholders, not a
license to ship. Chosen conservative defaults because guessing a component's
real observable would fake a pass ("prove or caveat, never fake").

Files touched (byte counts):
```
schema.ts            9460  + MatcherSchema, TriggerSchema, ObservablePredicateSchema,
                            InteractionStatesSchema (z.partialRecord), CaveatSchema,
                            caveats on ComponentContractSchema
button.contract.ts   7514  interactionStates record (6 states) + caveats[0] on loading
validate-contracts.mjs 8357  shape gate + caveat field-resolution (RFC 2119: must resolve)
migrate-contract.mjs 5617  legacy array → record, conservative defaults
verify-contract.mjs  4888  state-record scorer added (canon-react)
verify-states.spec.ts 4061  derived Playwright harness
check-css-vars.mjs   2969  earlier: CSS var resolution gate (17/17)
```

Zod context recorded for the next editor: the workspace root resolves Zod
3.25.76, but `packages/canon` resolves Zod 4.6.5. `z.record(z.enum(), v)` is
EXHAUSTIVE in Zod 4 (requires every enum key) → `z.partialRecord` is required
for partial state maps. First attempt with `z.record` failed
validate-contracts with `expected object, received undefined` on the omitted
states — switched to `partialRecord`, clean.

### Not shipped: p31ca build
`pnpm --filter p31ca build` (apps/p31ca) exit 1, NOT for canon reasons — the
prebuild content-freshness gate fails: `love.json` and `nonprofit.json` are
737h past verification against a 30-day threshold. `fetch-content-stats.mjs
--force` refreshes only stats.json; love/nonprofit need a human or live-API
re-verification and are genuinely stale. Not bypassed, not blessed. Recorded
as the next owner's blocker. `verify-ground-truth` passes; the gate is
content-source freshness, unrelated to these changes.

## 2026-09-19 — Fixture derivation: the harness renders from the contract too

Follow-up closure. `verify-states.spec.ts` still hand-authored its renders:
`STATE_FIXTURES` mapped state name → props. The observable predicate came
from the contract; the props that PUT the component into the state did not.
Same failure class, one level down. Fixed by moving the fixture INTO the
contract's `interactionStates` entry:

```ts
disabled: {
  fixture: { children: 'Save', disabled: true },  // ← was hand-authored in the harness
  property: 'aria-disabled',
  expected: 'true',
  matcher: 'equals',
  trigger: 'none',
},
```

The harness now reads `spec.fixture` and has no props map of its own. The
contract states what to render AND what to observe; adding a state generates
the render + the assertion. The agent that wrote the component selects
neither.

Differential, repeated with a STRONGER probe this time: added `__fake__`
state **with a fixture** (`{ children: 'Save' }`). The harness rendered it
successfully (fixture guard did NOT trip) and the test failed on the
assertion (`data-fake equals true` never resolves). Removed the fake → 6/6.
Previous round's fake failed on the missing-fixture guard; this round the
fake failed on the observable — the assertion derives from the contract, the
render derives from the contract, and the contract is the only input.

Full pass after the change:
```
canon validate-contracts          → 1 validated, 290 tokens, 6-state record, exit 0
canon tsc --noEmit                → clean, exit 0
canon-react verify-contract       → 5 props, 2 enums, import-match, state-record, exit 0
canon-react pnpm test             → 14/14, exit 0
canon-react check-css-vars        → 17/17, exit 0
playwright verify-states          → 6/6 (>=20s each run), exit 0
```

Files (byte counts):
```
schema.ts              10048  + fixture: z.record(z.string(), z.unknown()) on
                               ObservablePredicateSchema (required — a state
                               without a fixture cannot be tested)
button.contract.ts      7767  + fixture on all 6 states
validate-contracts.mjs  8682  + fixture gate (missing/non-object → error)
migrate-contract.mjs    5901  + fixture: {} in conflicts defaults + review notice
verify-contract.mjs     4888  unchanged (state-record scorer already counts)
verify-states.spec.ts   3828  −STATE_FIXTURES (−233 bytes), reads spec.fixture
```

The differential's lesson, restated: a fake state with a fixture now fails on
the derived assertion, not on a guard the harness author wrote. The harness
has no author-side surface left to fake — every input is the contract.

## 2026-09-19 — file-loss recovery

During a probe experiment, a compound shell line deleted
`packages/canon/src/contracts/button.contract.ts` from the working tree:
`cp probe && rm probe target && rm target; cp probe 2>/dev/null; echo skip`.
The third `rm` deleted the real file; the final `cp` silently failed
because the probe had already been `rm`-ed in the same line.
The file was untracked (`?? packages/canon/src/contracts/`), so git
could not restore it.

Recovery: the probe artifact `__migcheck__.contract.ts` (6911 bytes,
2 conservative states with `fixture: {}`) survived on a different
filename and was used as the reconstruction base. The contract was
rebuilt to its full shape — 6 interactionStates, each with a fixture
(`{ children: 'Save', ... }`), plus caveats, tokenContract,
requiredAria, semanticParts, antiExamples — and written at
`packages/canon/src/contracts/button.contract.ts`. The probe artifact
was then deleted from the contracts directory.

Final byte count of the restored file: 6026 bytes. The "7767-byte record"
cited above is the fixture-era snapshot (files table under "Fixture
derivation") — a DIFFERENT revision, not the file that was lost. Byte
counts are not a completeness proof: two revisions of the same contract
differ by comment/description verbosity. Structural completeness is now
machine-checked by the `shape-completeness` scorer in `verify-contract.mjs`,
which asserts every top-level field of `ComponentContractSchema` is present
and non-empty (negative-tested: removing `caveats` fails the scorer with
exit 1). Byte counts are evidence of what is on disk; the scorer is evidence
of what is in the file.

Evidence (all captured in the same session):
  schema tsc --noEmit → clean, exit 0
  canon validate-contracts → 1 validated, 290 tokens, 6-state record, exit 0
  canon-react verify-contract → 5 props, 2 enums, import-match, state-record, exit 0
  canon-react pnpm test → 14/14, exit 0
  canon-react check-css-vars → 17/17, exit 0
  playwright verify-states → 6/6, exit 0
  differential (error state w/ fixture) → 7 tests, 6 pass, 1 fail on assertion, exit 1
  after restore → 6/6, exit 0

NOTE (evidence correction): the differential's exit code was first recorded
as 0 here. That was wrong — the capturing command was
`npx playwright test … | tail -15; echo "pw_exit=$?"`, and `$?` after a
pipe is `tail`'s status, not Playwright's. A run with 1 failed test exits 1.
The line now records 1. Same pipe-masking bug class; see the Shell Hygiene
rule in AGENTS.md.

Root-cause rule added: never run a destructive `rm` in the same shell
line as any other operation, and back up to a path that command cannot
touch before the delete runs. The loss was preventable.

Still red:
  pnpm --filter p31ca build → exit 1 (pre-build content freshness).
  love.json and nonprofit.json are stale vs the 720h threshold.
  `fetch-content-stats.mjs --force` only refreshes stats.json.
  love.json needs LIVE k4-cage ledger values; nonprofit.json needs
  current IRS status. Both are human actions or dashboard checks,
  not code changes. Logged as the next owner's blocker.

## 2026-09-19 — evidence re-baseline + recoverability

All prior byte-count tables in this file are historical snapshots of
different revisions. The current on-disk revision (sha256 of
button.contract.ts: d3937647…; 6026 bytes) is:

```
schema.ts                    12863
button.contract.ts            6026
validate-contracts.mjs        7989
migrate-contract.mjs          5901
verify-contract.mjs           6263  (+ shape-completeness scorer)
tests/e2e/verify-states.spec.ts 3828
check-css-vars.mjs            2969
```

Recoverability: `packages/canon`, `packages/canon-react`, `packages/canon-mcp`,
and the Button harness (`tests/e2e/verify-states.spec.ts`,
`playwright-button.config.ts`) were untracked — the reason the
button.contract.ts loss could not be recovered from git. They are now
tracked (commit 7410886d). Untracked is unrecoverable; that is closed.

## 2026-09-19 — p31ca content freshness: verification attempted, no bypass

`pnpm --filter p31ca build` still exits 1 at the prebuild freshness gate
(`verify-content-sources.mjs`): love.json + nonprofit.json `lastVerified`
2026-08-19, 31d > the 30d threshold. Checked whether the values can be
re-verified live (2026-09-19):

```
GET https://k4-cage.trimtab-signal.workers.dev/api/mesh        → 200
    exposes topology / vertices(4) / edges(6) + per-node love
    (Will 1, S.J. 1, W.J. 0, Christyn 0). No totalLove=276 and no
    92/47/36/74 breakdown — love.json's shape is a different source.
GET /api/love|ledger|stats|summary|mesh/love on k4-cage        → 404
GET https://love-ledger.p31ca.org/health                       → 200 (v1.4.0)
GET /api/love|stats|summary|ledger|v1/stats, /openapi.json     → 404
```

No reachable, authorized endpoint exposes love.json's fields. nonprofit.json's
`irsStatus` is an external legal fact (IRS determination letter) with no API.

Decision: did NOT bump `lastVerified` and did NOT raise `stalenessThreshold`.
`ground-truth/content/README.md` documents both files as **monthly** manual
updates, so 30d is the correct threshold; raising it or re-stamping would be
a bypass, not a fix ("prove or caveat, never fake"). The gate is
expected-red and is not caused by the canon work.

Also fixed the gate's remediation message: it told the operator to run
`fetch-content-stats.mjs --force`, which only touches stats.json and would
not clear love/nonprofit. It now separates auto-refreshable from manual
files and warns against re-stamping without a check.

Owner action required (not a code change):
- `love.json` — supply live LOVE ledger totals (`totalLove`, `vertices.*`).
- `nonprofit.json` — confirm IRS status / determination letter for EIN 42-1888158.

## 2026-09-19 — final gate table (post-fix)

Captured with explicit exit codes, no pipe masking (`cmd > file 2>&1; echo $?`):

```
canon validate-contracts     exit 0   1 validated, 290 tokens, 6-state record
canon tsc --noEmit           exit 0
canon-react verify-contract  exit 0   shape-completeness(13), prop(5), enum(2), import, state-record(6)
canon-react pnpm test        exit 0   14/14
canon-react check-css-vars   exit 0   17/17 var(--p31-*)
playwright verify-states     exit 0   6/6 (chromium)
verify-content-sources       exit 1   expected-red: love/nonprofit stale — owner action, see above
```

Negative test of the new scorer (a gate, not a label):

```
verify-contract (caveats removed)  exit 1   shape-completeness: contract is missing top-level field "caveats"
verify-contract (restored)         exit 0   sha256 d3937647… unchanged
```

Current byte counts are in the "evidence re-baseline" section above;
`verify-contract.mjs` is now 6263 (was 4888, +1375 for the scorer).
`verify-content-sources.mjs` is 2310 (accurate remediation message).

## 2026-09-19 — love.json wired to its real source (p31ca blocker, half cleared)

The review proposed rewriting love.json to match k4-cage `/api/mesh`. Checked
that claim before acting:

- `/api/mesh` **does** expose `totalLove` (top level, currently 3) plus
  per-vertex `love` (will 1, sj 1, wj 0, christyn 0). An earlier read had
  truncated past it.
- The in-repo love-ledger worker (`apps/phos/src/workers/love-ledger/index.ts`)
  has **no aggregate route** (only per-DID `/balance`, `/chain`, `/status`,
  `/export`). The deployed `love-ledger.p31ca.org` exposes `/api/love/leaderboard`
  and `/api/love/balance/:user`; summing the leaderboard gives ~1197, not 276.
- love.json was hand-entered at creation (`ac06c045`); its
  `vertices: {top,left,right,bottom}` keys had **no producer and no consumer**.
- No page imports love.json (`index.astro` imports `nonprofit.json` + `stats.json`).

Action: added `apps/p31ca/scripts/fetch-love-stats.mjs`, which GETs
k4-cage `/api/mesh` and writes love.json in the API's real shape
(`totalLove` + per-vertex-id values). Fail-closed: a failed or malformed
fetch exits 1 and does **not** overwrite the file or bump `lastVerified`.
Ran it:

```
totalLove: 276 → 3
vertices:  { "will": 1, "sj": 1, "wj": 0, "christyn": 0 }
lastVerified: 2026-09-19T17:24:44Z
```

Also: README table row updated; `verify-content-sources.mjs` guidance now
lists love.json as auto-refreshable; `package.json` gains `fetch:love` /
`fetch:stats`.

Gate effect: `verify-content-sources` now fails **only** on `nonprofit.json`
(IRS status — needs a human check). `verify-ground-truth` and
`verify-content-consistency` remain green. `pnpm --filter p31ca build` is
still red, blocked solely on nonprofit.json.

The hand-entered `276 / 92-47-36-74` is superseded, not "corrected" — it was
never sourced. Recorded so the change is not mistaken for a regression.

## 2026-09-19 — first consumer: p31ca sign-in uses @p31/canon-react Button

p31ca build went green first (nonprofit.json corrected; see below), then
the first canon adoption: `apps/p31ca/src/pages/signin.astro` renders the
contract `Button` instead of the hand-rolled `<button class="btn btn-primary">`.

Token finding (the reason this was probed): p31ca's design-core does **not**
define the semantic action/space/font/motion tokens the Button needs.
`@p31/canon/dist/tokens.css` does — and it wraps them in `@layer p31.tokens`.
design-core is **unlayered**, and unlayered declarations outrank layered ones,
so on the 28 overlapping palette names (`--p31-bg`, `--p31-accent`,
`--p31-radius-md`, …) design-core still wins; canon only fills the tokens
design-core lacks. Import is page-scoped to signin.astro, so blast radius is
one page. No shim was used.

Rendered proof (`apps/p31ca/dist/signin/index.html`):
```
<button class="p31-button p31-button--primary p31-button--md w-full"
        data-variant="primary" data-size="md" type="submit">
```
Page CSS `dist/_astro/signin.*.css` carries both the token var
(`--p31-color-action-primary`) and `.p31-button--primary`.

Also: IRS determination letter PDF stored at
`apps/p31ca/ground-truth/legal/FinalLetter_42-1888158_P31LABSINC_04032026_v1.0.pdf`
(sha256 3663a18f…, PDF title "501(c)(3) Exemption with Definitive Ruling of
Public Charity Status"); `nonprofit.json.irsDeterminationLetter` points at it.

`pnpm --filter p31ca build`: exit 0.

## 2026-09-19 — second adoption + token-value audit (the endgame question)

Second consumer: `signup.astro` now also renders the contract Button with the
same page-scoped token import. The two-page pattern holds; no new collision.

Hydration: the first adoption rendered `<Button>` with no Astro client
directive — SSR-only, so `Button.tsx`'s `handleClick` (the disabled/loading
click-block) never ran in the browser. The contract was render-only. Both auth
Buttons now use `client:load`; built output confirms
`<astro-island component-export="Button" client="load" ssr>` pointing at
`canon-react.*.js`. The behavioral contract is active in the consumer.

Token-value audit. The 27-name overlap is NOT a rename — the values differ.
Comparing `:root` in `packages/canon/dist/tokens.css` vs
`packages/design-core/src/css/tokens.css`:

```
overlap 27 | identical 8 | DIFFERENT 19
--p31-text-tertiary  design-core oklch(78% .01 240)   | canon oklch(55% .02 235)
--p31-glass-bg       oklch(14% .02 260 / .35)         | oklch(100% .01 230 / .04)
--p31-accent-gold    oklch(65% .18 15)                | oklch(72% .15 40)
--p31-accent         oklch(65% .18 195)               | oklch(70% .15 200)
--p31-bg             oklch(10% .01 240)               | oklch(10% .03 240)
--p31-accent-violet  oklch(65% .18 285)               | oklch(65% .15 250)
… (19 total)
```

Consequence: the `@layer` trick is a **coexistence** tactic, not a migration
tactic. design-core keeps its values on the 19 differing names; canon only
fills the action/space/font/motion tokens design-core lacks. Replacing
design-core with canon is a **visual redesign** (text lightness, glass alpha,
accent hues), not a token subtraction. That decision is unmade and now named.

Also: the pre-existing `translate: -50% -50%` fix on both auth dividers was
committed standalone (`a7b9220f`) so it is no longer a dangling working-tree
edit.

## 2026-09-19 — canon token superset + parity gate (Phase 1–2 of "there can only be one")

Phase 1 (`0245c57a`): canon absorbed design-core's entire token surface
verbatim — the 85 `GLOBAL_COMPAT` tokens plus `CONDITIONAL_CSS` reproducing
design-core's `[data-brand]` / `[data-spoons]` / `[data-dark-mode]` /
`[data-theme="light"]` / `[data-portal]` blocks (emitted unlayered). canon now
emits 131 tokens; design-core 114; **0 missing**. No visual change: design-core
is still loaded unlayered and wins.

Phase 2: `scripts/verify-token-parity.mjs` (`pnpm --filter @p31/canon
verify:parity`), using postcss because design-core nests conditional rules
inside `:root`. It asserts coverage and shared-context value parity. It is
**RED by design** — 0 missing, **19 `:root` divergences** — the switch that
blocks the Phase 3 flip:

```
--p31-bg/-surface/-surface2     chroma differs
--p31-accent/-violet/-gold/-green/-red/-iris
--p31-text-secondary/-tertiary  (tertiary 78% → 55% lightness)
--p31-glass-bg/-border/-shadow
--p31-font-sans/-mono           (font stacks)
--p31-radius-sm/-md/-lg         (design-core calc(var(--p31-scale-*)/2) vs canon literals)
```

The gate compares declared strings, so the `calc()` radii may over-report; the
palette/text/font differences are real. The gate already caught a real porting
bug: design-core has **duplicate `[data-spoons]` blocks** whose later
declarations win (`spoons=2 → blur(8px)`, not `4px`); `CONDITIONAL_CSS` was
corrected to the effective values.

Flip (Phase 3) is blocked until the 19 are reconciled — that is the visual
identity decision, and it remains the one unmade call.

## 2026-09-19 — canon owns CSS (Path B) + p31ca imports canon directly

Path B (`d812c289`): canon now owns the non-token CSS. `packages/canon/src/css/`
holds the 12 component/layout stylesheets + `all.css`; `scripts/build-css.mjs`
emits `dist/css/`; `generate-exports.mjs` derives `./css/*.css` (ghost-gated),
and the build order is `gen:tokens → validate → build:css → gen:exports`
(gen:exports is the only writer of `exports`, so `build:css` must precede it).
design-core's 12 component files + `all.css` are now compat re-exports of
`@p31/canon/css/<file>.css`.

Declared boundary: component CSS internals (`quantum` tetra/sic/edge/phi,
`ambient`, `container`, `size-class`) ride along verbatim and are **out of the
parity gate's theme-token scope**. `theme-p31ca.css` / `theme-phosphorus31.css`
are a competing theme-persona layer (`[data-theme='rebel']` / `[data-brand=…]`)
that overlaps canon's model — **not migrated**; separate workstream.

p31ca now imports canon directly (build exit 0):
```
MarketingShell.astro:17  @p31ca/design-core/css/all.css    -> @p31/canon/css/all.css
p31-style.css:1          @p31ca/design-core/css/all.css    -> @p31/canon/css/all.css
global.css:1             @p31ca/design-core/css/tokens.css -> @p31/canon/tokens.css
```
`@p31ca/design-core` remains in `apps/p31ca/package.json` (now unused); removal is
blocked by pre-existing uncommitted package.json churn and was not swept.

Path D — base.css-only consumer palette shift (accepted + documented):
`phos`, `bonding`, `willow`, `growth-dashboard` import `base.css` without
`tokens.css`, so pre-flip they rendered base.css's hex palette; post-flip
base.css routes through `tokens.css → canon`, so they receive canon's compat
palette:
```
--p31-surface    #12121A   -> oklch(15% 0.015 240)
--p31-accent     #00F0FF   -> oklch(65% 0.18 195)
--p31-radius-md  12px      -> calc(var(--p31-scale-md) / 2)
```
Evidence: `packages/canon/baseline/design-core-css/base.css:6,12,41` vs canon
`dist/tokens.css` `:root`. This is unification, not regression. The parity gate
models the `all.css` surface, so it cannot see this; per-consumer baselines in
`verify-token-parity` are the alternative if preservation is required (not
implemented).

Gates: parity 0/0 (frozen baseline); p31ca/phos/bonding exit 0; undefined-var
scan 3 pre-existing (`status-success`, `accent-bright`, `accent-glow`), 0 new.