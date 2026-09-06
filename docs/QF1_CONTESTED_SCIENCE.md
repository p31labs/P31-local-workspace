# QF-1 Contested Science Position

## What this document is

This document tracks which claims in the QF-1 codebase are **contested**,
**not established**, or **metaphorical** — and where the code makes no
scientific claim at all.

## Subsystem-by-subsystem

### SIC-POVM (d=2 qubit)

- **Established:** SIC-POVMs are a standard quantum information concept (POVMs
  with equally-weighted, symmetric outcomes). The d=2 case (4 outcomes with
  fidelity 1/3) is mathematically proven and uncontroversial.
- **Contested:** The claim that SIC-POVMs are the mechanism by which biological
  systems (e.g., microtubules, neurons) perform "quantum measurement" or
  "cognitive measurement" is NOT established. The Penrose–Hameroff Orch-OR
  theory remains highly speculative.
- **Code claim:** None. The code computes SIC-POVM states — it does not assert
  biological implementation.

### Posner molecule (Ca₉(PO₄)₆)

- **Established:** Posner molecules exist as a calcium phosphate cluster in
  bone and cellular environments. The crystal structure (Fisher 2015, Whaley
  2024) is real.
- **Contested:** The hypothesis that Posner molecules mediate biologically
  relevant quantum entanglement (spin-½ ³¹P nuclei entangled via
  dipole-dipole coupling) is NOT established. Salari et al. (2017) published
  strong refutations showing decoherence times too short for biological
  function.
- **Code claim:** The code models the molecular geometry and a simplified
  coherence state. It does not claim biological quantum computation.

### LOVE ledger

- **Established:** SHA-256 hash chains are standard cryptography.
- **Contested:** Nothing contested here — the "ontological volume" and "entropy"
  in the name are poetic, not physical. The ledger is a conventional
  care-accounting system with a hash chain.
- **Code claim:** Tamper-evident care records. No quantum claims.

### K₄ graph

- **Established:** K₄ is a standard complete graph on 4 vertices.
- **Contested:** Nothing contested.
- **Code claim:** Graph operations (adjacency, shortest path, completeness).

### P2P care mesh

- **Established:** Differential privacy (Laplace mechanism), Ed25519 signing.
- **Contested:** Nothing contested.
- **Code claim:** Privacy-preserving peer data exchange.

### EUDI / DID

- **Established:** W3C DID Core, SD-JWT draft, Ed25519.
- **Contested:** The `did:jwk` ML-DSA-65 AKP key type (RFC 9964) is
  experimental. PQC TLS is a zone-level Cloudflare toggle.
- **Code claim:** W3C-compatible credential envelope. Not eIDAS 2.0 certified.

## Overall position

This code is an **architectural metaphor made literal** — it translates a
conceptual framework (care measurement, sovereign identity, peer support) into
real, computed data structures and cryptographic primitives. Where the
underlying science inspires the architecture, the code labels it honestly and
does not assert established medical or quantum-biological fact.
