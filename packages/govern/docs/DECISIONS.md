# P31 Sovereign Stack — Decision Record

**Status:** Proposed for review
**Generated:** 2026-09-28
**Basis:** deep-web research (SchemaVer, JSON Schema versioning, enforcement-surfaces, ForgeDock gate-marker forgeability, documentation hierarchy)

---

## Decision R1 — Runbook path resolution

**Decision:** Add an optional `resolutionRoot` field to the constitution schema; bump the schema URI to `0.3.1`.

**Rationale (research-backed):**
- The monorepo path-resolution failure is a named class: a script works from its package dir but fails from the root because paths resolve against `process.cwd()`. The fix is to resolve against a declared base (`__dirname`/`import.meta.url`), not cwd.
- The design constitution's runbook paths resolve against `constitutionRoot` to `domains/design/runbooks/`, which does not exist — the files live in `/home/p31/production/runbooks/`.
- A `resolutionRoot` field (optional, reader-supplied default = `constitutionRoot`) lets design point at the production runbooks without copying files, and lets monetization/justice default to their own dirs.

**Versioning:** Under SchemaVer, adding an optional field with a reader-supplied default is an ADDITION, not a model change. Under the project's version-in-URI discipline, bumping the URI to `0.3.1` makes the additive field discoverable. All five constitutions update `schema` + `version` in the same commit.

## Decision R2 — Write all four runbooks

**Decision:** Write all four missing runbooks (monetization-entitlement, monetization-ledger, justice-evidence, justice-escrow), not just the two the lessons pair against.

**Rationale:** All four are referenced by gate `remediation` pointers. A remediation to a missing runbook is furniture. Writing only two leaves two gates with furniture remediations. Follow the production six-section template.

## Decision R3 — Guard the `--registry` override

**Decision:** Require an explicit `--allow-registry-override` flag alongside `--registry`. CI invokes the meta-gate without it; the self-test NC passes both flags.

**Rationale (research-backed):**
- The enforcement-surfaces distinction: a `git-hook` is bypassable (`--no-verify`); a `ci-gate` is hard, un-bypassable.
- The meta-gate currently has an unguarded `--registry <path>` override, making it behave like a git-hook, not a ci-gate.
- The ForgeDock precedent (issue #1582): a gate that reads a path from a file the PR can write is forgeable. The hardened version reads from a source it controls.
- Requiring the explicit flag restores the ci-gate posture: CI reads the real registry; the NC (which legitimately needs the override) passes both flags.

## Decision R4 — Add validator runbook file-existence check

**Decision:** Add a file-existence check to `validateConstitution`: for each runbook and each gate's `remediation`, resolve the path against `constitutionRoot` (or `resolutionRoot` if present) and verify the file exists.

**Rationale:** The validator currently checks runbook metadata (owner, lastVerified) but not file existence — so green-by-syntax passes validation. This closes G2 (lesson pairing) and G4 (path resolution) structurally, not by convention.

**Known tension:** the design constitution's 7 runbooks exist in the production repo but not relative to its `constitutionRoot`. This check must land **with** R1 (`resolutionRoot`) or it will break design's validation.

## Decision R5 — Commit strategy

**Decision:** Atomic slices, each `tsc --noEmit && tsc && node --test` clean:

| Slice | Contents |
|---|---|
| 1 | Schema 0.3.1 (`resolutionRoot`) + validator file-existence check + all 5 constitutions updated (R1 + R4) |
| 2 | The 4 missing runbooks (R2) |
| 3 | `--allow-registry-override` guard on the meta-gate (R3) |
| 4 | KNOWN_GAPS disclosures (G1 count-source stubs, G3 override, G5 validator) |
| 5 | This doc suite (docs/) |

**Rationale (research-backed):** atomic commits — one logical change per commit, each build-clean on its own. Never commit in a way that breaks the build at an intermediate step.

---

## Open human decisions

| # | Decision | Why it's human |
|---|---|---|
| H1 | Design's K₄ issuer conflict (G6) | Requires naming a distinct maintainer/third party as issuer |
| H2 | Point CI at `govern audit enterprise-constitution.json` + `govern reconcile` as deploy blocks (G7) | Requires naming the CI moment |
| H3 | Configure live read-only endpoints for the count sources (G1) | Requires exposing D1/DO read state in production |

## Known limitation (flagged, not blocking)

The `NEGATIVE_CONTROL_OK` / `GATE_PASS` markers are printed to stdout with no author binding. Per ForgeDock's fix, the stronger pattern binds the marker to the emitting process (nonce or signature). For the current scope, the exit-code + marker combination is adequate; this is a documented limitation, not a silent assumption.