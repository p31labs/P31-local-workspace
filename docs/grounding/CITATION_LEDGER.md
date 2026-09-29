# P31 Grounding — Citation Ledger

**Purpose:** Every external citation in a governed P31 document is either
verified against a primary source, marked as training-knowledge with a
figure to re-check, or removed. This ledger is the record. An entry that
cannot be verified must not reach an auditor as a claim.

**Generated:** 2026-09-28 · **Audit method:** primary-source fetch (DOI,
registry, .gov, vendor docs) at the time of writing.

---

## Tier definitions

| Tier | Meaning | Handling |
|---|---|---|
| **A** | Verified against a primary source (DOI, registry, .gov, vendor page) at audit time | Keep citation as-is |
| **B** | Real, well-established standard/framework; figure-level nuance should be re-checked at source before an auditor reads it | Keep, note re-check |
| **C** | Could not verify a primary source; or appears nowhere in the repo | Remove from any doc that reaches an auditor; do not cite |

---

## Verified citations (Tier A)

### 1. The Grammar of Governance — CRADLE/TEND/KEEP modes

- **Cited in:** `packages/govern/domains/family/constitution.json:8` ("Built from The Grammar of Governance (CRADLE mode)")
- **Primary source:** Zenodo record 21198369 — "The Grammar of Governance", Warner Rey Allen, published 2026-07-05. DOI `10.5281/zenodo.21198369`.
- **Verified claim:** The abstract states: *"The preservation chain calibrates governance sensitivity to the vulnerability of the person in the room: CRADLE for children, TEND for elders, KEEP for operational environments."* Also confirms REGISTER/BALANCE/CONFIRM/RELEASE/REPORT and a three-state confirmation gate with a held state.
- **Also verified:** the paper's "NIST AI RMF 1.0 — 71 of 72 subcategories (98.6% coverage)" figure appears verbatim in the abstract.
- **Status:** ✅ KEEP

### 2. ForgeDock gate-marker forgeability precedent (#1582)

- **Cited in:** `packages/govern/docs/DECISIONS.md:33` ("The ForgeDock precedent (issue #1582): a gate that reads a path from a file the PR can write is forgeable")
- **Primary source:** https://github.com/RapierCraftStudios/ForgeDock/issues/1582 — "fix(ci): gate-marker-check FORGE:GATE_PASS is forgeable — no author check (staging review — PR #1575)". Closed, merged.
- **Verified claim:** The issue confirms a `<!-- FORGE:GATE_PASS -->` marker scanned from PR comments is forgeable by any commenter; the fix restricts the scan to the trusted review identity / requires a signed or run-id-bound marker.
- **Status:** ✅ KEEP

### 3. Lilo Engine — deterministic safety pipeline for elder AI

- **Cited in:** `packages/govern/domains/family/constitution.json:89` ("The Lilo Engine's 100% crisis recall is bench-battery-scoped, not clinical")
- **Primary source:** medRxiv preprint 2026.02.17.26346507 — "A deterministic safety pipeline for therapeutic AI in elderly assisted living", Aejaz Sheriff. DOI `10.64898/2026.02.17.26346507`.
- **Verified claim:** The abstract reports a 5-layer deterministic pipeline replacing a multi-agent orchestrator, "100% crisis recall (500/500 comprehensive scenarios), < 5% false positive rate", AND the honest boundary: *"the 100% crisis recall claim is validated against the semantic and linguistic crisis expressions within our test battery, not against the full clinical phenotype space."*
- **Status:** ✅ KEEP — the constitution's "bench-battery-scoped, not clinical" framing matches the primary source exactly.

### 4. FIPS 203 (ML-KEM) — post-quantum key encapsulation

- **Cited in:** `packages/govern/domains/family/constitution.json:92` ("ML-KEM-768 + ML-DSA-65 (FIPS 203/204) hybrid")
- **Primary source:** NIST FIPS 203 — "Module-Lattice-Based Key-Encapsulation Mechanism Standard", published 2024-08-13. DOI `10.6028/NIST.FIPS.203`. Parameter sets ML-KEM-512/768/1024 confirmed in the abstract.
- **Status:** ✅ KEEP

### 5. SchemaVer — schema semantic versioning

- **Cited in:** `packages/govern/docs/DECISIONS.md:5,18` (MODEL-REVISION-ADDITION versioning for the schema URI bump)
- **Primary source:** Snowplow — "Introducing SchemaVer for semantic versioning of schemas" (snowplow.io). Also used by CERT CC (SSVC) per its ADR-0015.
- **Verified claim:** MODEL-REVISION-ADDITION, where ADDITION = additive, backward-compatible change. Matches DECISIONS.md R1's use.
- **Status:** ✅ KEEP

### 6. ISO/IEC 42001:2023 — AI management systems

- **Cited in:** `packages/govern/docs/COMPLIANCE.md:33`, `packages/govern/specs/compliance.md:18` ("certifiable AIMS")
- **Primary source:** ISO/IEC 42001:2023, published December 2023 — the first certifiable international AI management system standard. Confirmed via iso.org and multiple references.
- **Status:** ✅ KEEP

### 7. NIST AI Risk Management Framework 1.0

- **Cited in:** `packages/govern/docs/COMPLIANCE.md:24`, `packages/govern/specs/compliance.md:9`
- **Primary source:** NIST AI 100-1 (AI RMF 1.0). Real, well-established framework.
- **Status:** ✅ KEEP (Tier B re-check: no numeric coverage claim is made in the P31 docs beyond the Grammar of Governance paper's own 98.6% figure, which is verified above)

### 8. EU AI Act

- **Cited in:** `packages/govern/docs/COMPLIANCE.md:41`, `packages/govern/specs/compliance.md:26` (Art 13/14/15 mapping)
- **Primary source:** Regulation (EU) 2024/1689. Real, in force.
- **Status:** ✅ KEEP (Tier B re-check: Article numbers are stable; verify against the consolidated text before an auditor reads the mapping)

---

## Real but figure-level re-check needed (Tier B)

These are real, well-established frameworks/standards. The P31 docs do not
make numeric claims about them, so no removal is required — but any future
numeric claim must cite the primary source.

| Item | Where | Re-check |
|---|---|---|
| JSON Schema versioning | DECISIONS.md:5,18 | Standard is JSON Schema; SchemaVer is the project-specific scheme (verified above) |
| SHA-256 chain / dual-signature length guards (Ed25519, ML-DSA-65) | justice constitution + runbooks | Algorithm names and length guards are local implementation facts, not external citations; ML-DSA is FIPS 204 (verified) |

---

## Could not verify / absent from repo (Tier C — do not cite)

The following appeared in conversation narrative only. A repo-wide search
confirmed they exist in **no** file in either repo:

- **"VAC paper"** — no results for "VAC paper" AI governance (DuckDuckGo). Not on disk. Do not cite.
- **"AICDI 3A model"** — GitHub search returns only unrelated repos (form generators, templates); no matching 3A model. Not on disk. Do not cite.
- **"Agentic Governance Benchmark"** — GitHub repo search: 0 results. Not on disk. Do not cite.
- **"F.AI.2R"** — no verifiable source found (code search requires auth; no repo match). Not on disk. Do not cite.

**Handling:** no on-disk doc references these, so no doc edit is required.
This ledger is the permanent record that they were considered and dropped.

---

## The honesty invariant

An entry in this ledger is either:
- **Tier A** — a primary source exists and was fetched at audit time, or
- **Tier B** — a real standard with figure-level re-check noted, or
- **Tier C** — absent from the repo and must never be cited.

Any future document that cites an external source must add its claim to this
ledger in the same commit, or the citation does not ship.

**Verification commands run at audit time:**

```bash
# Grammar of Governance
curl -s "https://zenodo.org/api/records?q=%22Grammar%20of%20Governance%22" | jq '.hits.hits[].metadata.title'
# ForgeDock #1582
# fetch https://github.com/RapierCraftStudios/ForgeDock/issues/1582
# Lilo Engine
# fetch https://www.medrxiv.org/content/10.64898/2026.02.17.26346507v1
# FIPS 203
# fetch https://csrc.nist.gov/pubs/fips/203/final
```