# RUNBOOK-pickle-names

## When to use

The `pickle-names` gate fires: the family's identity-integrity invariants
failed, or the negative control could not prove the gate can fail. The pickle
system is the family's privacy-preserving identity layer — "the street never
shows a human name." A failure means identity integrity is broken.

## Prerequisites

- `@p31ca/sovereign-primitives` is installed (or the local `dist` is built)
- The gate script: `tools/family/pickle-names-gate.mjs`
- The negative control: `tools/family/negative-controls/pickle-names.mjs`

## Steps

1. **Run the gate directly.** `node tools/family/pickle-names-gate.mjs`.
   If it exits 0, the invariants hold and the failure was a wiring issue —
   check the constitution's gate command and NC references.

2. **Run the negative control.** `node tools/family/negative-controls/pickle-names.mjs`.
   It must emit `NEGATIVE_CONTROL_OK`. If it does not, the gate cannot be
   shown to fail — that is a gate-is-furniture condition, more serious than a
   mere invariant break.

3. **Check each invariant class:**
   - **Determinism** — `generatePickleName(seed)` must equal itself across
     runs. A break means the PRNG or vocabulary changed.
   - **Vocabulary-closed** — every generated name is `Prefix·Suffix` from the
     published `PICKLE_PREFIXES` / `PICKLE_SUFFIXES`. A name outside these is
     a leak or a bug.
   - **Collision-free** — batch generation must not duplicate. A collision
     means the exclusion logic regressed (the fallback must respect `exclude`).
   - **Canonical passports** — unique ids, unique pickle names, exactly one
     caregiver.

4. **Fix the root cause, not the symptom.** If a passport gained a duplicate
   name, restore uniqueness. If generation became non-deterministic, the
   vocabulary or seeding changed — revert it. Never edit the chain to hide a
   break.

5. **Re-run the gate + NC.** Both must pass before the domain audits green.

## How to verify

```bash
node tools/family/pickle-names-gate.mjs                 # → ✅ gate:pickle-names
node tools/family/negative-controls/pickle-names.mjs    # → NEGATIVE_CONTROL_OK
```

## Common pitfalls

- **A gate that can't fail is furniture.** If the NC ever exits 0 (gate
  accepted a sabotaged fixture), the gate is not enforcing anything.
- **Byte-identical vocabulary is sacred.** Changing `PICKLE_PREFIXES` or
  `PICKLE_SUFFIXES` changes every existing pickle name — a silent identity
  break across the family portals.
- **The fallback `Pickle·<rand>` must respect `exclude`.** Without that, batch
  generation can return a name already held.

## Owner + last verified

`Owner: family-guardian` · `Last verified: 2026-09-29`