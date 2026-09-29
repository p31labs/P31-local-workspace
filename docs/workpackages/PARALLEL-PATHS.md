# PARALLEL-PATHS — the payload decomposition

Decomposes the two pillars into disjoint-write facets. Each task produces one
artifact; its path IS its ownership. One writer per file. Never share a
directory prefix. If a fix needs a write outside a facet's boundary, that is a
dependency — record it and sequence it, don't write it.

## The two pillars (do NOT interleave)

- **Pillar 1 — agentic human design collaboration:** the 4-stage Lantern
  pipeline (narrator → architect → mechanic → firmware), gates, human anchor.
- **Pillar 2 — full system provenance:** internal chain → external Sigstore →
  npm audit signatures.

## Facets (disjoint writes)

| Facet | Writes | Reads | Depends on | Validation |
|---|---|---|---|---|
| A — Lantern pipeline stages | `packages/design-core/src/agentic/` (stage logic) | `src/agentic/` | nothing | `cd packages/design-core && pnpm typecheck && pnpm test` |
| B — Human anchor | `packages/design-core/src/agentic/approve.ts` + CLI | `src/agentic/audit.ts` | nothing | `node tools/agent-verify/verify.mjs --claims anchor.json` |
| C — Internal provenance (agentic audit blocks) | `packages/govern/domains/design/.govern-audit.jsonl` | `src/agentic/audit.ts` | B (needs approve.ts) | `cd packages/govern && node dist/cli.js validate domains/design/constitution.json` |
| D — External provenance (Sigstore publish) | `docs/provenance/`, `publish.yml` | `package.json` | nothing | `npm audit signatures` |

Note: the pipeline-stage rename (lantern-*) already landed in Thread A's
domain. Facet A now means the *remaining* pipeline work (stage integration,
not the rename).

## Execution DAG

```text
Wave 1:  A  ||  B  ||  D        (independent, disjoint writes — any order)
Wave 2:  C                       (depends on B — needs approve.ts)
Wave 3:  S                       (synthesis — reads all, writes summary only)
```

## Thread-lock rule

The agent works on exactly ONE facet at a time. When switching facets:

1. Update `docs/agent-context/SESSION-STATE.md` (verified facts).
2. Record the switch in `docs/workpackages/THREAD-LOG.md`.
3. Do not reference the previous facet's facts unless they are in
   `SESSION-STATE.md`.

Interleaving two facets is the context leak. It is forbidden.

## Convergence

Every facet boundary runs:

```bash
cd /home/p31/P31-local-workspace
node tools/agent-verify/verify.mjs --claims tools/agent-verify/self-claims.json
node tools/system-test/run.mjs --fast
```

No facet advances on a failed convergence. Halt → diagnose → fix → re-run.