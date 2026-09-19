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