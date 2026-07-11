# Work Package: P31 Pre-Quantum & Post-Quantum Crypto-Security Protocol

**Document ID:** P31-WP-PQ-2026-001
**Classification:** Technical Specification & Research Roadmap
**Status:** Draft for NGI Grant Submission (v1.0, 2026-07-11)
**Author:** P31 Labs Secure Systems Division (W.R. Johnson)
**Related:** `AXIS-1_FINAL_DELIVERABLE.md`, `plans/WCD-QC-001_QUANTUM_CONSOLIDATION.md`, `QUANTUM_ARCHITECTURE.md`, `scripts/pqc-audit.js`, `interfaces/quantum.ts`, `docs/NLNET_LOVE_LEDGER_GRANT_DRAFT.md`

---

## Executive Summary

P31 Labs has built its cryptographic stack on a clear two-layer doctrine: a **pre-quantum**
foundation that is *deployed today*, and a **post-quantum** path that is *designed and staged*.
This Work Package documents both, plus an explicit **research track** for the quantum
measurement primitive (SIC-POVM) that motivates the geometry but is **not** deployable in the
current runtime.

The theoretical frame for the quantum side was established by P31 Labs in two open-access
Zenodo preprints (records `18627420`, `19004485`, Johnson, W.R.) — the *Tetrahedron
Protocol* — which formalize the regular tetrahedron (complete graph K₄) as a unifying design
principle spanning SIC-POVM quantum measurement, structural rigidity, and network topology.
As of **2026-07-11**, that theory meets deployed practice:

- The **pre-quantum layer — Clause Blind Schnorr (CBS)** — is **LIVE** in the LOVE-ledger
  worker (`https://love-ledger.p31ca.org`), compiled to WebAssembly from Rust
  (`curve25519-dalek` + `sha2`). Double-spend and nonce-reuse replays are both
  cryptographically blocked (HTTP 409).
- The **post-quantum layer — lattice PQC (ML-KEM / ML-DSA, FIPS 203 / 204)** — has a
  working reference module (`software/packages/quantum-core/src/pqc/fips203-204.ts`) and a
  staged hybrid-migration design, but is **not yet wired into** the LOVE-ledger deployment.
- The **SIC-POVM research track** is explicitly scoped as *future work requiring quantum
  hardware* — it is documented as inspiration/analogy, never claimed as a deployed component.

This document is intentionally honest about what is live, what is designed, and what is
research. No classical primitive is presented as quantum-safe, and no quantum primitive is
presented as deployable where the runtime cannot support it.

---

## 1. The Pre-Quantum Foundation: Clause Blind Schnorr (CBS) — LIVE

### 1.1 CBS Deployment Status (as of 2026-07-11)

| Property | Value |
|----------|-------|
| Endpoint | `https://love-ledger.p31ca.org` |
| Blind mode | `BLIND_MODE = 'taler'` (real CBS; `mock` is fail-closed in production) |
| Implementation | Rust → `wasm32-unknown-unknown` (no `clang`/libsodium in build env) |
| Dependencies | `curve25519-dalek` (Ed25519), `sha2` (SHA-512) |
| WASM size | ≈ 51.7 KB raw (canonical figure in `AXIS-1_FINAL_DELIVERABLE.md`) |
| Imports | **0** (statically linked; no host calls from the crypto core) |
| Delivery | Cloudflare **CompiledWasm** (`[[rules]] type = "CompiledWasm"`) |
| Verified | Round-trip verifies; tampered `s'` / wrong message / random signature all rejected |
| Replay defense | `/blind-sign` nonce reuse → 409 `Nonce already used`; `/withdraw` coin reuse → 409 `Token already spent` |

CBS replaces the earlier staging-only mock blind signature. The issuer signs a *blinded*
challenge and never learns which credit it minted, while the resulting signature remains
verifiable against the issuer's public key — satisfying both *privacy* (unlinkability) and
*court-admissibility* (a hash-chained, signed receipt attests *who* was paid).

### 1.2 CBS Security Properties

- **Unlinkability** — the exchange issues blind-signed LOVE without learning the spend trail
  (GNU Taler cash-model privacy).
- **Fail-closed verify** — constant-time scalar comparison; the broken `return 0` always-valid
  stub is explicitly forbidden and absent from the shipped code.
- **Court-admissibility** — every mint/spend is appended to a SHA-256 hash chain
  (`love_chain`, `prev_hash`/`entry_hash`) and each receipt is signed with Ed25519
  (`RECEIPT_SIGNER_PRIVATE_KEY`). Private emotional state is never exposed.
- **Single source of truth** — one secret (`BLIND_ISSUER_PRIVATE_KEY`, the scalar `x`) drives
  the issuer keypair; `LOVE_AUTH_SECRET` gates write paths via HMAC-SHA256 (60s TTL).

### 1.3 The CBS Attestation Topology: Four-Party Model

CBS issuance resolves to **four** roles, which map naturally onto the complete graph K₄:

| Vertex | Role |
|--------|------|
| **U** | User / care-worker (presents blinded challenge) |
| **I** | Issuer (Taler exchange / `love-ledger` blind-signer) |
| **L** | Ledger (D1 atomic debit + `cbs_coin` single-use claim) |
| **C** | Court / Verifier (validates the hash-chained, Ed25519-signed receipt) |

This four-party, fully-interconnected topology is the **classical** counterpart to the
quantum K₄ geometry developed in §5.

### 1.4 Deployment & Reproducibility

```bash
# Build + unit/integration gates (Rust → WASM)
cd software/workers/creation-accountant/taler-cbs
bash build-cbs.sh            # cargo --target wasm32-unknown-unknown --release
node test/vector.mjs         # known-answer vector (cross-checked vs Node Web Crypto)
node test/integration.mjs    # full blind→sign→unblind→verify flow

# Deploy (Cloudflare CompiledWasm)
cd apps/phos/src/workers/love-ledger
npx wrangler deploy          # or: bash l5-deploy.sh

# Live smoke (double-spend + nonce-reuse both expected 409)
node software/workers/creation-accountant/taler-cbs/test/cbs-smoke.mjs
```

---

## 2. Cryptographic Inventory & Quantum Threat Model

### 2.1 Classical Primitive Inventory (LOVE Ledger)

| Primitive | Algorithm | Status | Quantum exposure |
|-----------|-----------|--------|------------------|
| Hash chain | SHA-256 | **Live** (`love_chain`) | Grover: halves to 2¹²⁸ — acceptable |
| Path auth | HMAC-SHA256 | **Live** (`LOVE_AUTH_SECRET`) | Grover: acceptable at 256-bit |
| Blind sig | **CBS (Clause Blind Schnorr)** | **Live** (2026-07-11) | **Shor-vulnerable** (asymmetric) |
| Receipt sig | Ed25519 | **Live** | **Shor-vulnerable** (asymmetric) |
| KDF | SHA-512 | **Deployed** | Grover: acceptable |
| Payload encryption | AES-256-GCM | **Planned** | Grover: AES-256 → 2¹²⁸ — acceptable |

### 2.2 Quantum Threat Assessment

- **Shor's algorithm** breaks all *asymmetric* primitives deployed today: CBS (Curve25519),
  Ed25519 receipt signatures, and any ECDH key exchange. These are the **migration priority**.
- **Grover's algorithm** squares-root Brute-force cost: it halves symmetric-key strength.
  SHA-256 (→ 2¹²⁸) and AES-256 (→ 2¹²⁸) remain safe for the foreseeable horizon;
  AES-128 would need upgrading. **Symmetric primitives are retained** in the PQC design.

---

## 3. The Quantum Reality Check: SIC-POVMs

### 3.1 What SIC-POVMs Are (and Are Not)

A **Symmetric Informationally Complete POVM** in dimension `d = 2` arranges **four** measurement
vectors as a regular tetrahedron inscribed in the Bloch sphere, satisfying the equiangular
overlap condition

```
|<ψ_i|ψ_j>|² = 1/(d+1) = 1/3    (i ≠ j)
```

This geometry enables **full quantum state tomography from a single measurement basis**,
eliminating the sifting inefficiency and reference-frame dependence of orthogonal protocols
such as BB84. It is a *quantum measurement* — it requires coherent quantum state and a
measurement apparatus operating on that state.

### 3.2 Why SIC-POVMs Cannot Run in a Cloudflare Worker

Cloudflare Workers are **V8 isolates**: classical deterministic compute. They have no quantum
state, no coherence, no measurement basis. A SIC-POVM is not a classical algorithm that can
be "ported" — it is a physical measurement performed on a quantum system (photonic, trapped-ion,
or superconducting). Therefore:

- SIC-POVMs are **not a near-term deployable primitive** in the LOVE-ledger stack.
- They belong to a **future-research track** requiring a quantum co-processor / photonic
  module (§8.3), not to the Worker runtime.
- The correct near-term quantum-resistant path is **lattice-based PQC** (§4), which *is*
  classical-computable and Worker-deployable.

### 3.3 Bibliography — The Tetrahedron Protocol (Zenodo)

P31 Labs (Johnson, W.R.) has published two open-access preprints establishing the geometric
(K₄ / tetrahedral) framework that informs the analogy in §5:

- Johnson, W.R. (P31 Labs, Inc.). *The Tetrahedron Protocol: A Geometric Framework for
  Unified Systems Theory Connecting SIC-POVM Quantum Measurement, Structural Rigidity, and
  Biological Coherence.* Zenodo (2026-02-13). DOI **10.5281/zenodo.18627420**.
- Johnson, W.R. (P31 Labs, Inc.). *The Tetrahedron Protocol: A Grand Unified Theory of
  Structural Resilience.* Zenodo (2026-03-13). DOI **10.5281/zenodo.19004485**.

These are **CC-BY open-access preprints / defensive publications, not peer-reviewed journal
articles.** They establish the tetrahedral / K₄ design principle as prior art. Their connection
to the LOVE-ledger crypto program is the **geometric analogy** developed in §5 — *not* a shared
implementation. They are cited here as the theoretical foundation for the SIC-POVM research
track (§8.3), never as deployed cryptographic components.

---

## 4. The Post-Quantum Path: Lattice-Based PQC

### 4.1 Hybrid Migration Strategy

The migration **retains symmetric primitives** (Grover-safe) and **replaces asymmetric ones**
with NIST-standardized lattice crypto:

| Layer | Today | Post-Quantum |
|-------|-------|--------------|
| Key exchange / encapsulation | (ECDH / CBS scalar) | **ML-KEM** (FIPS 203) |
| Signatures | Ed25519 | **ML-DSA** (FIPS 204) |
| Hashing / MAC | SHA-256 / HMAC-SHA256 | **Retained** |
| Bulk encryption | AES-256-GCM (planned) | **Retained** |

During transition, LOVE-ledger will use **hybrid envelopes** (classical + PQC signature/KE)
so a break in either scheme does not compromise a session.

### 4.2 PQC Primitives Inventory (FIPS 203 / 204)

| Parameter set | Scheme | Security | Use |
|---------------|--------|----------|-----|
| ML-KEM-768 / ML-DSA-65 | default | 192-bit (NIST L3) | LOVE-ledger primary |
| ML-KEM-512 / ML-DSA-44 | light | 128-bit (NIST L1) | edge-constrained clients |
| ML-KEM-1024 / ML-DSA-87 | strong | 256-bit (NIST L5) | long-lived root keys |

Reference sizes (ML-DSA-65): public key ≈ 1,952 B, secret key ≈ 4,096 B, signature ≈ 3,309 B.

### 4.3 Integration Architecture

- The canonical PQC module is **`software/packages/quantum-core/src/pqc/fips203-204.ts`**
  (working Buffer/SHAKE256 implementation of ML-KEM + ML-DSA, designated canonical in
  `plans/WCD-QC-001_QUANTUM_CONSOLIDATION.md`). This is the **migration target** for
  LOVE-ledger — the work is *integration*, not from-scratch crypto.
- PQC keypairs are added alongside the existing Ed25519/CBS keys; the receipt/attestation
  envelope becomes **hybrid** (Ed25519 ‖ ML-DSA).
- The module is WASM-compatible (no Node-only APIs), so it can follow the same
  CompiledWasm delivery path as CBS.

### 4.4 Performance & Overhead

Illustrative reference figures (NIST Round-3 ML-DSA on commodity server hardware):

| Scheme | Keygen | Sign | Verify | Sig size |
|--------|--------|------|--------|----------|
| ML-DSA-44 | ~0.3 ms | ~0.8 ms | ~0.5 ms | ~2,420 B |
| ML-DSA-65 | ~0.6 ms | ~1.2 ms | ~0.6 ms | ~3,309 B |
| ML-DSA-87 | ~1.0 ms | ~1.8 ms | ~0.9 ms | ~4,621 B |

Signatures are ~30–60× larger than Ed25519 (64 B); the LOVE-ledger D1 schema and wire
envelopes must be sized accordingly.

---

## 5. The CBS–SIC-POVM Analogy: K₄ Tetrahedral Topology

### 5.1 Geometric Isomorphism

Both the SIC-POVM (d = 2) and the CBS attestation model are four-entity systems whose
minimal rigid structure is the **complete graph K₄** (4 vertices, 6 edges):

| SIC-POVM (quantum) | CBS (classical) | Shared property |
|---------------------|-----------------|----------------|
| 4 measurement outcomes on the Bloch sphere | 4 parties (U, I, L, C) | 4 vertices (K₄) |
| Equiangular overlap 1/3 | Isostatic 4-party attestation | 6 edges = minimum rigidity |
| Informational completeness (single-basis tomography) | Full auditability (who was paid, unlinkably) | Completeness |

This is the **Tetrahedron Protocol** bridge: the regular tetrahedron is a shared *design
principle* — equiangularity, isostatic rigidity, and informational completeness — appearing at
both the quantum-measurement scale and the distributed-ledger scale.

### 5.2 Why the Analogy Holds (and Where It Breaks)

- **Holds** at the *topological / geometric* level: both are K₄ structures with the same
  vertex/edge count and the same "minimum isostatic rigidity" property (Maxwell: V=4, E=6).
- **Breaks** at the *physical* level: a SIC-POVM is a coherent quantum measurement requiring
  quantum hardware; CBS is classical public-key cryptography running in a V8 isolate. The
  tetrahedron is a **structural analogy and design heuristic**, not a protocol equivalence.
  No CBS output is a quantum state, and no SIC-POVM output is a blind signature.

---

## 6. Deployment & Operational Security (OPSEC)

### 6.1 Key Management

- **`BLIND_ISSUER_PRIVATE_KEY`** — the CBS scalar `x` (base64). Single secret; drives the
  issuer keypair. Rotate via `wrangler secret put`.
- **`LOVE_AUTH_SECRET`** — HMAC-SHA256 key (60s TTL) gating LOVE-path writes; 401 on
  miss/expiry.
- **`RECEIPT_SIGNER_PRIVATE_KEY`** — Ed25519 keypair signing each `love_chain` receipt;
  verified by `RECEIPT_SIGNER_PUBLIC_KEY`.
- Rotation is performed through `wrangler secret put` — no key material is committed to the
  repo.

### 6.2 CompiledWasm Integrity

- The CBS module is compiled **ahead-of-time** and delivered as Cloudflare **CompiledWasm**
  via `[[rules]] type = "CompiledWasm"`, `globs = ["**/*.wasm"]`, `fallthrough = false`.
- The Worker **instantiates the module once** at startup (`WebAssembly.instantiate`); there is
  no runtime `fetch()` of executable code. Integrity is enforced by the deploy pipeline, not by
  runtime download.

### 6.3 Monitoring & Audit

- **`scripts/pqc-audit.js`** scans the codebase for classical-crypto patterns (RSA, ECDSA,
  ECDH, SHA-1/MD5, etc.) and flags them for PQC migration — the mechanism that will track the
  remaining Ed25519 / CBS migration to ML-DSA / ML-KEM.
- Observability is enabled (`[observability] enabled = true`) with Axiom OTLP export.
- The `love_chain` hash chain is the immutable audit trail (see §7.2).

---

## 7. Standards & Compliance Alignment

### 7.1 Regulatory Mapping

| Standard | Scope | LOVE-ledger status |
|----------|-------|--------------------|
| **FIPS 203** (ML-KEM) | PQC key encapsulation | Design (§4) |
| **FIPS 204** (ML-DSA) | PQC signatures | Design (§4) |
| **FIPS 205** (SLH-DSA) | Hash-based signatures | Considered (long-lived roots) |
| **NIST IR 8413** / **CSWP 041** | *Migrations to Post-Quantum Cryptography* | Adoption roadmap (§8) |
| **NIST IR 8547** | PQC migration planning | Roadmap |
| **ETSI QSC 001-3** | Quantum-safe crypto deployment | Reference |
| **GDPR** Art. 25 | Privacy by design (unlinkability) | Met via CBS blind signatures |
| **EU AI Act** | Care-context AI transparency | Design consideration |
| **WCAG 2.2** | Neuroinclusive access | Met (automated axe-core, 0 blocking) |

> Note: earlier drafts cited "NIST SP 800-208" for PQC migration — that document addresses
> key-derivation, not PQC transition. The correct references are **NIST IR 8413 / CSWP 041**.

### 7.2 Audit Trail

Every LOVE mint and spend is recorded in the SHA-256 **hash chain** (`love_chain`):
`prev_hash` → `entry_hash`, exposed via `GET /chain` and `GET /export`. This is a
WCD-46-style, court-admissible artifact that proves *consistency of care* without exposing
private emotional state.

---

## 8. Research Roadmap & Deliverables

### 8.1 Near-Term (0–6 months)

- **CBS hardening + live baseline** — *DONE* (commit `ab7bff6`, 2026-07-11): real WASM,
  double-spend + nonce-reuse 409-blocked.
- **PQC audit in CI** — wire `scripts/pqc-audit.js` into the pipeline to track classical
  primitives awaiting migration.
- **Hybrid PQC design spec** for LOVE-ledger (envelope format, key hierarchy).
- **Publish** this Work Package and the Tetrahedron Protocol preprints as the theoretical
  foundation.

### 8.2 Mid-Term (6–18 months)

- **Integrate ML-KEM / ML-DSA** (`quantum-core/fips203-204.ts`) into LOVE-ledger as
  **hybrid signing** (Ed25519 ‖ ML-DSA) and PQC key encapsulation.
- **WASM PQC module** delivered via the same CompiledWasm path as CBS.
- **Pilot** with neurodivergent families (10 users); measure signature-size / latency impact.
- **Post-quantum court-admissible receipts** (hybrid-signed `love_chain` entries).

### 8.3 Long-Term (18+ months): The SIC-POVM Frontier

- **Photonic / quantum co-processor research** — explore a SIC-POVM measurement module as a
  hardware add-on, *explicitly out of scope* for the current Workers runtime.
- **K₄ / tetrahedral QKD analogue** — investigate whether the tetrahedral geometry yields a
  reference-frame-independent key-distribution advantage (building on the Tetrahedron Protocol).
- **Partnerships** with quantum-hardware providers; publish findings as open defensive
  literature. This track is research, not a deployed component.

---

## 9. Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| Shor attack on Ed25519 / CBS | Critical (pre-PQC) | Hybrid PQC migration (§4, §8.2) |
| Grover on SHA-256 / AES-128 | Low (→ 2¹²⁸) | Retain 256-bit; upgrade AES-128→AES-256 |
| SIC-POVM overclaim | Credibility | Explicitly scoped as future research (§3.2, §8.3) |
| Key compromise | High | `wrangler secret put` rotation; no keys in repo |
| Replay / double-spend | High | 409 blocks, live-verified (§1.1) |
| PQC integration regresses CBS | High | Vector + integration gates (`test/*.mjs`) in CI |

---

## 10. Conclusion

P31 Labs' crypto-security doctrine is **layered and honest**:

1. **Pre-quantum (LIVE):** Clause Blind Schnorr, compiled to WASM and deployed in
   LOVE-ledger, delivers unlinkable care-credit issuance with court-admissible,
   hash-chained receipts.
2. **Post-quantum (DESIGNED):** a hybrid ML-KEM / ML-DSA migration, anchored on the existing
   `fips203-204.ts` module, retains symmetric primitives and replaces asymmetric ones.
3. **Quantum measurement (RESEARCH):** SIC-POVMs — the inspiration for the K₄/tetrahedral
   design principle — are documented as a future hardware track, never misrepresented as
   deployable today.

This separation of *deployed*, *designed*, and *researched* is deliberate: it keeps the grant
narrative truthful and the deployed system secure.

---

## Appendix A — Reproducibility

```bash
# 1. Build CBS WASM + run gates
cd software/workers/creation-accountant/taler-cbs
bash build-cbs.sh
node test/vector.mjs
node test/integration.mjs

# 2. Deploy (CompiledWasm)
cd apps/phos/src/workers/love-ledger
npx wrangler deploy        # or: bash l5-deploy.sh

# 3. Live smoke (expect both replays → 409)
node software/workers/creation-accountant/taler-cbs/test/cbs-smoke.mjs

# 4. PQC audit (flags remaining classical primitives)
node scripts/pqc-audit.js

# 5. Secrets
npx wrangler secret put BLIND_ISSUER_PRIVATE_KEY
npx wrangler secret put LOVE_AUTH_SECRET
npx wrangler secret put RECEIPT_SIGNER_PRIVATE_KEY
```

## Appendix B — Glossary

- **CBS** — Clause Blind Schnorr, the deployed pre-quantum blind-signature scheme.
- **SIC-POVM** — Symmetric Informationally Complete Positive Operator-Valued Measure; a
  quantum measurement (4 outcomes in d=2) with tetrahedral geometry.
- **K₄** — the complete graph on 4 vertices (tetrahedron); the shared topology of SIC-POVM
  outcomes and the CBS four-party attestation model.
- **ML-KEM / FIPS 203** — lattice-based key encapsulation (post-quantum).
- **ML-DSA / FIPS 204** — lattice-based digital signatures (post-quantum).
- **Grover / Shor** — quantum algorithms; Grover weakens symmetric security (√), Shor breaks
  asymmetric (discrete-log / factoring).
- **CompiledWasm** — Cloudflare ahead-of-time WASM delivery (no runtime fetch of code).
- **love_chain** — SHA-256 hash chain of LOVE mint/spend events (court-admissible).

---

## Related Documents

- `AXIS-1_FINAL_DELIVERABLE.md` — authoritative CBS deployment spec (canonical WASM figures).
- `plans/WCD-QC-001_QUANTUM_CONSOLIDATION.md` — designates `fips203-204.ts` as canonical PQC.
- `QUANTUM_ARCHITECTURE.md` — broader P31 quantum vision.
- `scripts/pqc-audit.js` / `pqc-audit-results.json` — PQC migration audit mechanism.
- `interfaces/quantum.ts` — quantum interface definitions.
- `docs/NLNET_LOVE_LEDGER_GRANT_DRAFT.md` — NGI / GNU Taler grant narrative (this WP informs §2.4).
