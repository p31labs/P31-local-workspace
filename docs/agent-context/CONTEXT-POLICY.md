# CONTEXT-POLICY — working-set retention for long agent sessions

Basis: wset (working-set retention) research. Under context pressure, models
treat **tool results as the only truth** and re-read rather than trust any
memory block. The intervention that worked: never evict the newest read of a
file; age out everything else. This policy adapts that to this session.

## Rule 1 — The file, not the chat, is the truth

- After reading a file, that read result is authoritative **until superseded
  by a newer read of the same file**.
- After running a command, its output is authoritative **until superseded**.
- Chat history older than ~10 turns is stubbed **unless** it contains a
  verified fact recorded in `SESSION-STATE.md`.

## Rule 2 — Working set = files touched, not chat length

- The working set is the files you've read or written this session. Keep the
  newest read of each.
- When context is tight, drop whole files from memory (you can re-read them),
  never drop the *newest* read of a file.

## Rule 3 — Verify, don't assume

- If a fact is not in `SESSION-STATE.md` and not in the last 5 turns, it is
  **unknown**. Re-verify with a command. Do not assume.
- This is what `tools/agent-verify/verify.mjs` enforces mechanically: a claim
  must be backed by a command + output, or it is not a fact.

## Rule 4 — One thread at a time

- Work on exactly one facet. When switching, update `SESSION-STATE.md` and
  log the switch in `docs/workpackages/THREAD-LOG.md`.
- Do not reference facts from a previous facet unless they are in
  `SESSION-STATE.md`.

## Rule 5 — Facet boundaries are the checkpoint

At every facet boundary:

1. Update `SESSION-STATE.md` with verified facts (command + output).
2. Read `SESSION-STATE.md` as the first action of the next facet.
3. Run `tools/agent-verify/verify.mjs` against the current claims.

## Why this works (from the research)

- DeepSeek specifically improved from 2/6 → 6/6 task passes with a
  keep-newest eviction at 4–20× fewer tokens (wset).
- Structured context management raised task resolution 40.7% vs 11.7% (GCC).
- The trained behavior is "re-verify via tools" — this policy works WITH that
  tendency instead of fighting it.