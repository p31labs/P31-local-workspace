# SIC-POVM Quantum-Measurement Research Track

**Status:** 🔬 Research scoping — **not** a deployed or deployable component.
**Owner:** P31 Labs Secure Systems Division (W.R. Johnson)
**Related:** `plans/P31-WP-PQ-2026-001_PRE_POST_QUANTUM_CRYPTO_SECURITY.md` §5 (K₄ analogy), §8.3 (future research);
Zenodo preprints `18627420`, `19004485` (Johnson, W.R., P31 Labs, Inc.).

---

## 1. What a SIC-POVM is

A **Symmetric Informationally Complete POVM** in dimension `d = 2` arranges **four**
measurement outcomes as a regular tetrahedron inscribed in the Bloch sphere, satisfying the
equiangular overlap `|<ψᵢ|ψⱼ>|² = 1/(d+1) = 1/3`. This geometry enables
**full quantum state tomography from a single measurement basis** — eliminating the sifting
inefficiency and reference-frame dependence of orthogonal protocols such as BB84.

This is a **quantum measurement**: it requires coherent quantum state and a measurement
apparatus operating on that state.

## 2. Why it is NOT in the deployed stack

Cloudflare Workers are **V8 isolates** — classical deterministic compute. They have no
quantum state, no coherence, no measurement basis. A SIC-POVM is not a classical
algorithm that can be "ported"; it is a physical measurement performed on quantum
hardware (photonic, trapped-ion, or superconducting). Therefore:

- SIC-POVMs are **not a near-term deployable primitive** in the LOVE-ledger stack.
- They belong to a **future-research track** requiring a quantum co-processor / photonic module.
- The correct near-term quantum-resistant path is **lattice-based PQC** (FIPS 203/204),
  which *is* classical-computable and Worker-deployable (see the live ML-DSA-44 seal).

## 3. The geometric bridge (what IS usable today)

The regular tetrahedron is a shared *design principle* — equiangularity, isostatic
rigidity, and informational completeness — appearing at both the quantum-measurement scale
and the distributed-ledger scale:

| SIC-POVM (quantum) | CBS (classical) | Shared property |
|---------------------|-----------------|----------|
| 4 measurement outcomes | 4 parties (U, I, L, C) | K₄ (4 vertices, 6 edges) |
| Equiangular 1/3 | Isostatic 4-party attestation | Minimum isostatic rigidity |
| Informational completeness | Full court-admissible audit | Completeness |

This **Tetrahedron Protocol** framing (Johnson, W.R., P31 Labs — Zenodo
`18627420`, `19004485`) is the *theoretical foundation* for the analogy. The
preprints are **CC-BY open-access preprints / defensive publications, not peer-reviewed
journal articles**; they establish the geometry as prior art, not a shared implementation.

## 4. Research questions (future)

1. **Photonic co-processor:** can a SIC-POVM measurement module be delivered as a
   hardware add-on to an edge/Worker-adjacent node, and at what coherence budget?
2. **K₄ / tetrahedral QKD analogue:** does the tetrahedral geometry yield a
   reference-frame-independent key-distribution advantage worth pursuing vs. PQC?
3. **Partnerships:** engagement with quantum-hardware providers to move §2 from theory
   to a bench experiment.

## 5. Explicit non-goal

This track is **research only**. No SIC-POVM output is a blind signature, a ledger
primitive, or a Worker runtime component. Claims of SIC-POVM *deployment* in the
LOVE-ledger stack are incorrect and must not appear in grant or engineering docs.
