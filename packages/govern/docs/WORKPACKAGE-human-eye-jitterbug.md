# Jitterbug Work Package — The Human Eye Test

**Work package ID:** WP-2026-09-28-HET
**Domain:** forge (governed, 6th domain) · govern (runtime)
**Kind:** jitterbug (fractal research workflow)
**State:** PROPOSED — not yet gated
**Owner:** forge-portal
**Research round:** 2026-09-28 (CHAP, AHI, Explanatory Tax, CrimRxiv, PLOS ONE, TIBET, Flesch-Kincaid statutes)

---

## Part 0 — The Jitterbug Frame

The jitterbug is Buckminster Fuller's transformation: a vector-equilibrium cuboctahedron folds through octahedron and icosahedron, changing shape at every phase while conserving structural integrity. As a research workflow, it means: start from a stable problem, fold it through distinct representations, arrive at a resolved state that is structurally the same but topologically different.

| Phase | Polyhedron | Representation | Produces |
|---|---|---|---|
| Problem | Vector equilibrium (cuboctahedron) | The stable but unexamined state | 6 verified gaps |
| Fold 1 | Octahedron (8 faces) | Decomposition into dimensions | 6-dimension rubric |
| Fold 2 | Icosahedron (20 triangles) | Research threads per dimension | External evidence base |
| Resolution | Cuboctahedron (transformed) | The work package | 6 moves, each gated |

The integrity conserved across the fold is the **negative-control contract**: every move must prove it can fail before it is registered.

## Part 1 — Problem State (Vector Equilibrium)

### The problem

P31 has solved programmatic verification — every gate emits `NEGATIVE_CONTROL_OK` only when it has proven it can fail. But the human-facing layer is unverified. No one has asked whether a board member, auditor, or regulator can read the generated artifacts, trace every claim, and afford the verification cost.

### The research that reframes it

**Humans cannot detect AI authorship — and that is not the test.**
- A paired dataset of 3,066 AI-forged documents found human 2AFC accuracy = 0.501, indistinguishable from chance, even side-by-side.
- GPT4o-Receipt (30-annotator study): "a striking paradox: humans are better at seeing AI artifacts, yet worse at detecting AI documents."

**Verification cost is the bottleneck.**
- The "verification tax" (hidden human time to ensure AI output meets standards) is now the dominant cost. METR: experienced developers were **19% slower** with AI tools despite believing they were **20% faster**.
- The Explanatory Tax: chain-of-thought gives "a semblance of logic" that *induces overreliance* — more explanation can worsen verification burden.
- The Human Proof Deficit: a measurable structural condition where the cost of proving authenticity rises as generation cost falls.

**Trust calibration is fragile.**
- N=495 experiment: visual confidence cues improved subjective accuracy discrimination but **amplified behavioral overreliance** on incorrect outputs. More signals ≠ more trust.

**A-role locking is the structural precursor to failure (AHI).**
- "Persistent A-role locking (A-locking) as the primary structural precursor to IEs, which, when chronic, produce measurable degradation in both collaborative output and participant trust." The human stuck as prompter is the diagnosis.

**Provenance must be structurally visible (CHAP, TIBET).**
- CHAP: "the override that used to vanish into a chat thread becomes a structured event carrying a diff, a rationale, and a content hash. The handoff between shifts becomes a portable envelope."
- TIBET: every provenance entry MUST carry "a human-readable string explaining WHY this action was taken" — not just a hash.

**AI documents are less readable and get approved anyway.**
- PLOS ONE: AI abstracts are "more complex and less readable across multiple metrics" — higher Flesch-Kincaid Grade Levels, LLMs "prioritize syntactic complexity over communicative clarity."

**Sentence-level provenance transforms verification.**
- JMIR: sentence-level provenance "reduces verification burden and supports calibrated reliance" in high-risk contexts.

### The verified gap (checked against disk)

| P31 has | P31 lacks |
|---|---|
| `NEGATIVE_CONTROL_OK` on every gate | A human-readable summary of what the gate proved |
| `GATE_PASS/GATE_FAIL` markers | A diff of what changed between runs |
| Genesis chain blocks | A way for a human to read the chain |
| Evidence blocks (claim/value/source/verified) | `replayCommand` + `verificationCost` per claim |
| Governance overview + board resolution packs | A human-eye test of whether they read right |
| Four-party K₄ review | A structured handoff envelope for the human reviewer |
| `govern audit` (agent verifies agent) | `govern propose` (human proposes, agent verifies — breaks the A-lock) |

## Part 2 — Fold 1: The Octahedron (8 faces → 6 dimensions)

| # | Dimension | Question | Measurement | Research basis |
|---|---|---|---|---|
| 1 | Claim traceability | Can every factual claim be traced to its source? | % of claims with a resolvable source | TROVE, sentence-level provenance |
| 2 | Verification cost | How long to verify all claims? | Sum of per-claim `verificationCostMinutes` | Verification Tax (METR 19% slowdown) |
| 3 | Provenance visibility | Is the agent's involvement visible? | Handoff envelope attached? | CHAP (portable envelope), TIBET (WHY string) |
| 4 | Decision auditability | Can a human decision be replayed? | Diff events recorded + signed? | CHAP (non-repudiable signed decision) |
| 5 | Cognitive load | Readable at the target grade level? | Flesch-Kincaid vs audience ceiling | PLOS ONE (AI less readable) |
| 6 | Completeness | Acknowledges what it cannot verify? | `aspirational[]` / KNOWN_GAPS present? | AHI (interaction-state governance) |

## Part 3 — Fold 2: The Icosahedron (20 triangles → research threads)

**Thread 1 — Handoff envelope (CHAP).** CHAP's Core = workspaces, participants, tasks, artefacts, an append-only evidence log, plus composable profiles (review, modes, routing, deliberation, handoff, identity, signatures). The Coordinator "receives envelopes, checks workspace policy, routes accepted messages, appends accepted envelopes to the evidence log." → Every forge document gets a companion `.envelope.json`.

**Thread 2 — Verification cost model.** Generation cost → 0; verification cost → rises. The Explanatory Tax shows explicit reasoning can worsen the burden. → Each evidence block carries `verificationCostMinutes`; the envelope sums them; the reviewer sees the cost *before reading*.

**Thread 3 — A-role locking (AHI).** The human permanently in role A (prompter) is the structural precursor to incoherence events. → `govern propose`: human proposes a change; agent validates it against the runtime; role inversion.

**Thread 4 — Readability standards (Flesch-Kincaid statutes).** Colorado: auto-insurance ≤ grade 10. Texas: consumer loans ≤ 9.0, ≤ 8.0, secondary mortgage ≤ 10.0. Illinois: production contracts ≤ grade 12. US Supreme Court 2020 opinions averaged 10.1. → Board resolution ≤ 12.0; governance overview ≤ 14.0.

**Thread 5 — Provenance + accountability (TIBET, F(AI)2R).** TIBET mandates a human-readable WHY string per entry. F(AI)2R: "Who did what, and who checked?" — an executable provenance ladder where rungs 5–6 are human-only. → Genesis chain blocks carry a `humanReadableReason`, not just a hash.

**Thread 6 — Verification fatigue + automation bias.** HITL under real conditions is "not inherently reliable. Automation bias, cognitive ease, attitude and expectation effects, and review fatigue can reduce HITL to a formal gesture." The Synthetic Consensus Trap: correlated AI errors + verification overload + automation deference. → The rubric includes a fatigue threshold: if verification exceeds ~30 min for a board document, it fails not because it's wrong but because it's unverifiable within a human attention budget.

## Part 4 — Resolution: The Work Package

### M1 — Handoff Envelope

- **Deliverable:** `software/p31-forge/scripts/build-envelope.mjs` → `.envelope.json` per forge-generated document.
- **Schema:**
```json
{
  "artifact": "P31_Resolution_Adopt_Sovereign_Stack_Governance.docx",
  "artifactHash": "sha256:...",
  "generatedBy": "forge://pipeline/v0.1.0",
  "generatedAt": "2026-09-28T...",
  "evidenceChain": [
    {
      "claim": "The framework has 15/15 gates proven able to fail",
      "source": "govern self-test on each constitution",
      "verifiedAt": "...",
      "replayCommand": "node dist/cli.js self-test domains/forge/constitution.json",
      "verificationCostMinutes": 2
    }
  ],
  "verificationCost": {
    "claims": 12,
    "autoVerifiable": 9,
    "requiresHumanJudgment": 3,
    "estimatedMinutes": 8,
    "fatigueThresholdMinutes": 30
  },
  "diffFromPrevious": null,
  "humanDecision": null
}
```
- **Negative control:** `tests/acceptance/negative-controls/envelope.mjs` — a document with an unresolvable `replayCommand` must fail.
- **Gate:** register `handoff-envelope` in `domains/forge/constitution.json`, BLOCKING.

### M2 — Verification-Cost on Evidence Blocks

- **Deliverable:** extend the forge evidence block with `replayCommand` + `verificationCostMinutes`.
- **Files:** `software/p31-forge/scripts/build-governance-pack.js` (emit), `production/portals/forge/src/routes/Compose.tsx` (render), `domains/forge/constitution.json` (system-test asserts every evidence block has a cost).
- **Negative control:** an evidence block missing `replayCommand` fails system-test.

### M3 — Diff Event (CHAP structured override)

- **Deliverable:** `govern review <constitution> --event` — records a human decision as a signed structured object on the Genesis chain.
- **Schema:**
```json
{
  "event": "human_review",
  "artifactHash": "...",
  "reviewer": "did:key:board-member-1",
  "action": "approve_with_edits",
  "edits": [{ "field": "body[3].text", "before": "...", "after": "...", "rationale": "EIN formatting" }],
  "timestamp": "...",
  "signature": "ed25519:..."
}
```
- **Negative control:** a review event with a forged signature must be rejected by `govern audit`.

### M4 — Human-Eye Test Rubric + Readability Gate

- **Deliverable:** `software/p31-forge/scripts/human-eye-test.mjs` — scores each document on 6 dimensions.
- **Weights:** traceability 25%, verification cost 20%, provenance 15%, auditability 15%, cognitive load 15%, completeness 10%.
- **Ceilings:** board resolution FKGL ≤ 12.0; governance overview ≤ 14.0.
- **Negative control:** an untraceable claim must fail the rubric.

### M5 — govern propose (bounded role inversion)

- **Deliverable:** `govern propose <constitution.json> --change <file>` — accepts a human-authored change, validates it against the runtime, returns a structured verdict.
- **Negative control:** a proposal that would remove a gate's negative control must be rejected.

### M6 — Interaction-State Presentation

- **Deliverable:** the forge Compose route renders the envelope + verification cost + diff alongside the document, before the prose.
- **Research basis:** sentence-level provenance (JMIR), CHI sensemaking (verifiability + accountability).

## Part 5 — The Negative-Control Contract

| Move | Negative control | Proves |
|---|---|---|
| M1 | envelope.mjs — unresolvable replayCommand | Envelope gate can detect a broken evidence chain |
| M2 | evidence block missing verificationCost | system-test can detect an unbounded claim |
| M3 | forged signature on a review event | govern audit can detect a non-repudiable violation |
| M4 | untraceable claim in a document | Rubric can detect a claim with no source |
| M5 | proposal that removes a gate's NC | govern propose can detect a self-defeating change |
| M6 | document rendered without its envelope | Compose gate can detect missing provenance |

Each NC emits `NEGATIVE_CONTROL_OK` on success and exits non-zero on failure. The work package is not complete until all six are proven.

## Part 6 — Verification (OQE)

```bash
cd packages/govern && npm run verify
  # → 23+ tests (incl. 6 new NC tests), docs-check green, 6 domains GOVERNED, compose 6/5/6

cd production/portals/forge && pnpm gate
  # → typecheck, unit, build, system-test green, meta-gate 2/2, drift check green

node software/p31-forge/scripts/human-eye-test.mjs --target governance/sovereign_stack_overview
  # → traceability ≥90%, cost ≤30min, FKGL ≤14.0, aspirational[] present, PASS
```

## Part 7 — Open Decisions

| # | Decision | Recommendation |
|---|---|---|
| D1 | Envelope on governance pack only, or also board resolution? | Overview first (claim-dense); resolution gets the readability gate |
| D2 | Diff-event granularity — field-level or document-level? | Field-level (CHAP shape); document-level as starter |
| D3 | govern propose — full command or lighter preflight? | Full propose — the A-lock breaker |
| D4 | Readability ceiling — grade 12/14? | 12 for resolution, 14 for overview (Illinois precedent, below SCOTUS avg) |
| D5 | Human-eye test — script or governed gate? | Both — script first, gate once stable |

## Part 8 — The Honest Boundary

No protocol removes the fundamental constraints: humans cannot detect AI authorship, trust calibration is fragile, confidence cues can backfire, verification cost dominates generation cost. The best available move is to make the human's verification work **bounded, traceable, and replayable** — so the human eye test tests what the human eye can actually do, not what it cannot.

This work package does not claim to make AI documents trustworthy. It claims to make their trustworthiness **measurable, bounded, and auditable** — which is what an auditor, a regulator, and a board member actually need.

The jitterbug has folded through the octahedron and the icosahedron. The resolution is the same structural problem — the human eye gap — conserved in a form that can now be gated.
---

## Appendix — Gateway routing (Workers-AI-only, intent-based)

**Decision (2026-09-28):** the Cloudflare AI Gateway owns model selection; the jitterbug tags intent. No Worker-side model table (single source of truth), no LLM classifier (the jitterbug knows its intent at the call site).

- **Route:** `dynamic/p31-intent` in gateway `p31-model-router` — 4 conditional branches on `metadata.task`, every fallback edge terminates inside Workers AI. Terminal node (llama-4-scout) has no fallback → loud failure, not a silent third-party bill.
- **Deploy:** `tools/phos-forge/setup-gateway-route.sh` — the three-call sequence (create route → save version → deploy), idempotent by route name.
- **Caller:** `routeToGateway()` in `router.mjs` sends `cf-aig-metadata: {task}` (1 flat entry, under the 5-entry limit) and reads `cf-aig-model` / `cf-aig-provider` response headers for observability.
- **Intent map:** `synthesis` → `@cf/moonshotai/kimi-k2.6` · `coding` → `@cf/moonshotai/kimi-k2.7-code` · `reasoning` → `@cf/deepseek-ai/deepseek-r1-distill-qwen-32b` · default/unlabeled → `@cf/meta/llama-4-scout-17b-16e-instruct`.
- **Negative control:** `test/negative-controls/gateway-route.mjs` — fail-closed (throws when env unset, proven) + default-fallback (unlabeled → llama-4-scout, pending live auth).
- **Run:** `node tools/phos-forge/jitterbug.mjs "<problem>" --factor 3 --depth 2 --gateway`
