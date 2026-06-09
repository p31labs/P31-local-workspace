# WCD-QC-001: Quantum Stack Consolidation & Hardening

**Date:** March 28, 2026
**Author:** Jarvis (Architect mode)
**Classification:** Work Control Document — Quantum Core

---

## Executive Summary

The quantum stack has sound architecture but broken implementation. Three critical failures:

1. **ML-KEM/ML-DSA are pseudo-implementations** — async-in-sync bugs produce empty key buffers
2. **Two divergent `quantum-core` packages** — same conceptual space, different code
3. **quantum-edge worker still uses SHA-256** — the exact vulnerability the migration guide says to fix

This WCD consolidates, fixes, tests, and deploys the quantum stack across 6 phases, 21 tasks.

---

## Phase 1: Consolidate (Single Source of Truth)

### 1.1 — Delete `packages/quantum-core/` (slim duplicate)

- Remove the 7-file slim package entirely
- Update `software/packages/quantum-edge/package.json` dependency reference
- Update `software/packages/sovereign-sdk/package.json` dependency reference
- Verify no other imports reference the deleted path

### 1.2 — Deduplicate `software/packages/quantum-core/src/index.ts`

- The 930-line monolith re-implements classes that already exist in src/ subdirectories
- Decision: src/ subdirectory files are MORE complete (real circuit breaker, real monitoring, real baseline)
- Refactor index.ts to RE-EXPORT from src/ subdirectories instead of duplicating
- Keep only the unique pieces in index.ts: SIC-POVM swarm, hash functions, IBM client mock

### 1.3 — Resolve the three ML-KEM/ML-DSA implementations

- `src/index.ts` lines 80-346: BROKEN (async-in-sync, empty buffers)
- `src/pqc/fips203-204.ts`: WORKING (Buffer-based, synchronous SHAKE256)
- Decision: Canonical = `src/pqc/fips203-204.ts`. Delete the broken copies from index.ts.

---

## Phase 2: Fix the Crypto (Real PQC)

### 2.1 — Fix ML-KEM key derivation in `src/pqc/fips203-204.ts`

- Current: SHAKE256 hash → Buffer (works but is simplified, not real lattice math)
- Upgrade: Use `crypto.createHash('shake256')` with proper parameter sets matching FIPS 203 byte lengths
- publicKeyBytes: 1184 (ML-KEM-768), 1568 (ML-KEM-1024)
- secretKeyBytes: 2400 (ML-KEM-768), 3168 (ML-KEM-1024)
- ciphertextBytes: 1088 (ML-KEM-768), 1568 (ML-KEM-1024)
- Ensure key pair sizes match FIPS 203 spec exactly

### 2.2 — Fix ML-DSA signature verification in `src/pqc/fips203-204.ts`

- Current: Re-generates R/S/C and compares (deterministic but not real lattice verification)
- Upgrade: Implement proper Fiat-Shamir with Aborts verification
- Ensure signature sizes match FIPS 204 spec: 2420 (ML-DSA-44), 4594 (ML-DSA-65), 6178 (ML-DSA-87)

### 2.3 — Fix HybridPQCScheme in `src/pqc/fips203-204.ts`

- Current: signAndEncrypt doesn't actually encrypt the message (just encapsulates)
- Fix: XOR message with shared secret for actual encryption
- Fix: decryptAndVerify should decapsulate → XOR to recover message → verify signature

### 2.4 — Add Web Crypto API PQC support (Chrome 124+)

- Chrome 124+ natively supports ML-KEM-768 via `crypto.subtle.generateKey({ name: 'ML-KEM' })`
- Add feature detection: try native PQC, fall back to our implementation
- This is the forward path — native browser PQC is coming fast

---

## Phase 3: Fix the Edge Worker

### 3.1 — Replace SHA-256 with SHA-512 in `quantum-edge/worker.ts`

- Line 108: `crypto.subtle.digest('SHA-256', data)` → `crypto.subtle.digest('SHA-512', data)`
- This is the exact vulnerability the migration guide says to fix
- Also update hashString output length (SHA-512 = 128 hex chars, not 64)

### 3.2 — Add PQC headers to edge worker responses

- Include `X-PQC-Algorithm: ML-KEM-768` header on all health credential responses
- Include `X-PQC-Secured: true` header

### 3.3 — Implement real SIC-POVM in edge worker

- Current `SicPovmProcessor.executeBiologicalTomography()` is a weighted average
- Replace with actual d² measurement matrix computation
- For d=2 (qubit): 4 POVM elements, each with weight 1/d² = 0.25
- Map biological state vector to density matrix, apply POVM, return measurement outcomes

---

## Phase 4: Implement Real SIC-POVM

### 4.1 — Create `src/swarm/sicPovmSwarm.ts` (file was deleted/not found)

- Implement proper SIC-POVM measurement operator E_i = (1/d) |ψ_i⟩⟨ψ_i|
- For d=2: 4 measurement operators forming a tetrahedron on the Bloch sphere
- Tetrahedron vertices: (0,0,1), (√8/3, 0, -1/3), (-√2/3, √6/3, -1/3), (-√2/3, -√6/3, -1/3)
- Map biological state (calcium, PTH, HRV, VitD) → Bloch vector → density matrix → POVM outcomes

### 4.2 — Update `src/index.ts` SIC-POVM swarm manager

- Current: `runSicPovmMeasurements()` generates random probabilities
- Replace: Real POVM measurement using the tetrahedron operators
- Keep the health status mapping (CRASH_WARNING < 0.75, ATTENTION < 0.80, OPTIMAL ≥ 0.80)

### 4.3 — Add Fisher-Escolà Q-Factor computation

- The Q-Factor is the cognitive coherence score across four tetrahedral vertices
- Implement: Q = √(Σ(w_i × m_i)²) where w_i = axis weight, m_i = measurement outcome
- Four axes: Body (calcium), Mesh (HRV), Forge (VitD), Shield (PTH)

---

## Phase 5: Test Suite

### 5.1 — Fix existing test file `test/quantum-core.test.ts`

- Currently imports from `../src/index` which has broken ML-KEM/ML-DSA
- After Phase 1 consolidation, imports will resolve correctly
- Add tests for: ML-KEM key generation, encapsulation, decapsulation
- Add tests for: ML-DSA key generation, sign, verify
- Add tests for: HybridPQC sign-and-encrypt round-trip

### 5.2 — Create `test/pqc.test.ts` for cryptographic primitives

- Test SHA-512 hash produces 128 hex chars
- Test SHAKE256 hash produces variable-length output
- Test quantum-safe HMAC
- Test quantum-safe PBKDF2
- Test quantum-safe CID generation
- Test integrity verification (positive and negative cases)

### 5.3 — Create `test/sic-povm.test.ts` for biological tomography

- Test tetrahedron operators are properly normalized (Tr(E_i) = 1/d)
- Test crash state detection (calcium < 0.75)
- Test optimal state detection (calcium ≥ 0.80)
- Test Q-Factor computation
- Test POVM completeness: Σ E_i = I (identity)

### 5.4 — Create `test/edge-worker.test.ts` for quantum-edge

- Test telemetry ingestion
- Test SHA-512 hashing (not SHA-256)
- Test health status computation
- Test alert severity levels

### 5.5 — Run full test suite, achieve ≥90% coverage

- `npm run test` in quantum-core package
- Verify all tests green
- Coverage report: lines, functions, branches, statements

---

## Phase 6: Deploy

### 6.1 — Build verification

- `tsc --noEmit` clean in quantum-core
- `tsc --noEmit` clean in quantum-edge
- No type errors, no import errors

### 6.2 — Deploy quantum-edge worker

- `wrangler deploy` from quantum-edge package
- Verify health endpoint returns PQC headers
- Verify telemetry endpoint accepts Node One data

### 6.3 — Update documentation

- Update `QUANTUM_ARCHITECTURE.md` with actual implementation status
- Update `docs/QUANTUM_BRIDGE_IMPLEMENTATION_GUIDE.md` with completed migration
- Create `WCD-QC-001_CLOSEOUT.md` with OQE (Objective Quality Evidence)

---

## Sequencing

```
Phase 1 (Consolidate) → Phase 2 (Crypto) → Phase 3 (Edge) → Phase 4 (SIC-POVM) → Phase 5 (Test) → Phase 6 (Deploy)
```

Each phase must complete before the next begins. Phase 5 validates Phases 1-4. Phase 6 is the deployment gate.

## Critical Path

The critical path runs through **Phase 2** (crypto fixes) and **Phase 4** (SIC-POVM). These are the two pieces that make the quantum stack actually work vs. being scaffolding. Phases 1 and 3 are cleanup. Phase 5 is validation. Phase 6 is deployment.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    QUANTUM STACK (POST-WCD)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────┐    ┌──────────────────────┐           │
│  │   quantum-core       │    │   quantum-edge       │           │
│  │   (canonical)        │───▶│   (Cloudflare Worker)│           │
│  │                      │    │                      │           │
│  │  ┌────────────────┐  │    │  ┌────────────────┐  │           │
│  │  │ pqc/           │  │    │  │ EdgeSovereign   │  │           │
│  │  │ fips203-204.ts │  │    │  │ Identity        │  │           │
│  │  │ (ML-KEM/ML-DSA)│  │    │  │ (SHA-512)       │  │           │
│  │  └────────────────┘  │    │  └────────────────┘  │           │
│  │                      │    │                      │           │
│  │  ┌────────────────┐  │    │  ┌────────────────┐  │           │
│  │  │ swarm/         │  │    │  │ SicPovm        │  │           │
│  │  │ sicPovmSwarm.ts│  │    │  │ Processor      │  │           │
│  │  │ (Real POVM)    │  │    │  │ (Real POVM)    │  │           │
│  │  └────────────────┘  │    │  └────────────────┘  │           │
│  │                      │    │                      │           │
│  │  ┌────────────────┐  │    │  ┌────────────────┐  │           │
│  │  │ pqcPrimitives  │  │    │  │ Telemetry      │  │           │
│  │  │ (SHA-512/SHAKE)│  │    │  │ Storage (KV)   │  │           │
│  │  └────────────────┘  │    │  └────────────────┘  │           │
│  │                      │    │                      │           │
│  │  ┌────────────────┐  │    │  ┌────────────────┐  │           │
│  │  │ algorithms/    │  │    │  │ Health         │  │           │
│  │  │ QML/QAOA/VQE  │  │    │  │ Credentials    │  │           │
│  │  └────────────────┘  │    │  └────────────────┘  │           │
│  │                      │    │                      │           │
│  │  ┌────────────────┐  │    │  PQC Headers:        │           │
│  │  │ test/          │  │    │  X-PQC-Algorithm     │           │
│  │  │ 4 test files   │  │    │  X-PQC-Secured: true │           │
│  │  │ ≥90% coverage  │  │    │                      │           │
│  │  └────────────────┘  │    └──────────────────────┘           │
│  └──────────────────────┘                                        │
│                                                                  │
│  ┌──────────────────────┐                                        │
│  │   sovereign-sdk      │                                        │
│  │   (depends on        │                                        │
│  │    quantum-core)     │                                        │
│  └──────────────────────┘                                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## OQE (Objective Quality Evidence) Required for Closeout

- [ ] `tsc --noEmit` clean on both packages
- [ ] All 4 test files passing with ≥90% coverage
- [ ] SHA-512 confirmed in edge worker (grep for SHA-256 returns zero matches)
- [ ] ML-KEM key sizes match FIPS 203 spec (1184/2400/1088 for ML-KEM-768)
- [ ] ML-DSA signature sizes match FIPS 204 spec (2420 for ML-DSA-44)
- [ ] SIC-POVM tetrahedron operators satisfy completeness: Σ E_i = I
- [ ] Edge worker deployed and health endpoint returns PQC headers
- [ ] Single canonical quantum-core package (no duplicates)

---

_It's okay to be a little wonky._ 🔺
