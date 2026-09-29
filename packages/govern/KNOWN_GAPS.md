# Known Gaps — @p31ca/govern

The runtime is a governance tool that isn't yet fully governed itself. This file
is the debt ratchet. The count may not exceed the baseline. Every fixed gap
drops the count, and lock-the-gain forces the floor down in the same commit.

The runtime does not gate any other domain until its own audit is green.

| # | Gap | Anti-pattern it repeats | Status |
|---|---|---|---|
| 1 | `read-orphan-count.mjs` hardcodes a `/home/p31/...` path | hand-edited mirror | **fixed** — accepts the JSON path as an argument |
| 2 | Lessons validation resolves to a string pattern, not an existing runbook/gate id | green-by-absence | **fixed** — `validateConstitution` resolves prevention to an existing id |
| 3 | The ratchet's lock-the-gain branch has no negative control | unverified branch | **fixed** — `ratchet-lock-gain.mjs` negative control + test |
| 4 | The audit event was emitted to stdout; no persisted hash-chained trail | unanchored claim | **fixed** — `JsonlHashChainSink` (Genesis Block) |
| 5 | `govern init` writes to the runtime's CWD | config blast-radius | **fixed** — `init` now requires an explicit target directory |
| 6 | Cross-repo absolute paths made the runtime unportable | multi-truth | **fixed** — `constitutionRoot()` relative resolution |
| 7 | No schema version migration path | frozen governance | **fixed** — version-in-URI |

Fixed: 7. Remaining: 0. Baseline: 0.

The runtime is now self-governed by its own standard: all seven gaps are closed,
and the `known-gaps` ratchet floor has been lowered to 0 in the same commit that
closed #5 — that is the lock-the-gain property, demonstrated on the runtime
itself. A ratchet that says current=0, baseline=1 would still permit one unit of
debt to return.