# Stash snapshot (2026-04-28)

Patches exported with `git stash show -p stash@{n}` before **`git stash clear`**.

- **00–02** — Generated `hub-landing.json` / `ops-glass-probes.json` noise (may conflict with current `main`).
- **03** — `p31-delta-hiring` tsconfig test includes.
- **04** — Delta hiring work-samples / storage / types.
- **05** — Local p31ca lockfile + passport-generator + workflow tweaks.

**Dropped pre-ship:** see branch **`archive/recovered-stash-pre-ship-april2026`** (same tree as lost `stash@{pre-ship}`, commit `b91f54c`).

**Passport micro-stash:** superseded by current `main`; dropped empty on apply.
