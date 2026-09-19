# The Loom benchmark — method and limits

## What this is

A fixed task ("given this CSS and this token list, produce a component
contract") run by two runners and scored on four axes: token grounding, caveat
honesty, prop completeness, and determinism.

## How to run it

```bash
# 1. Run the Loom on a fixture; capture the proposal body.
node scripts/bench/run-loom.mjs scripts/fixtures/foreign > /tmp/bench/foreign-btn.loom.json

# 2. Record a direct-model baseline (manual — no API key in this repo):
#    paste the prompt from task.md into the model, save the JSON contract as
#    /tmp/bench/foreign-btn.baseline.json

# 3. Compare.
node scripts/bench/compare.mjs /tmp/bench /tmp/bench scripts/fixtures/foreign/tokens.json
```

## The honesty clause

The baseline is a **stub** until someone records real model output. A table
with one populated column and one empty is not a result — it proves the Loom
*can be measured*, not that it *won*. Do not quote a half-empty table as
evidence. The result waits on a manual run.

## The axis that matters

**Determinism.** Run `run-loom.mjs` twice on the same fixture. The output is
byte-identical — the agent is deterministic, the fold is deterministic. A
direct model is not. That is the Loom's clearest structural win, and it is
measurable in an afternoon.

## A finding, recorded

The first run of the Loom against the **foreign** fixture produced an empty
`tokenContract`. Cause: the coverage agent's `groundTokens` filters to `p31.*`
paths, but a foreign system's tokens are named `color.primary`, not
`p31.color.primary`. The ingestion is correct (it preserves the foreign names
verbatim); the grounding boundary is canon-only. That is a real integration gap
between Lane α (coverage) and Lane β (ingest), not a scoring bug — the score
now reports empty grounding as 0, not a phantom 1.0. Closing it is the first
task of Move 3's next iteration.
