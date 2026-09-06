# Quantum Fortune 1 (QF-1) — Honest Architecture

## As-Is (Code Reality Before QF-1)

| Subsystem | Status | What existed |
|-----------|--------|------------|
| SIC-POVM | Aspirational only | `SicPovmSwarmManager` used `Math.random()` noise + weighted average |
| Posner molecule | Decorative | `PosnerMolecule.tsx` — 9 Ca + 6 P in approximate positions, no model |
| LOVE ledger | Partially deployed | Balance/transactions/earn/spend endpoints live; **no hash chain** despite AGENTS.md claim |
| K4 graph | Hardcoded arrays | `Tetrahedron.tsx` + `mapTopology.ts` — literal arrays, not a graph engine |
| P2P care mesh | Deployed | `care-mesh` worker has submit/aggregates/mesh endpoints with Laplace DP |
| EUDI credentials | Non-standard | `exportEUDIWallet()` emits local JSON, not W3C VC / SD-JWT |
| DID resolver | Partial | `did-document.ts` exists; `resolveDIDAsync()` was claimed but absent |

## To-Be (Implemented in QF-1)

| Subsystem | What it now computes |
|-----------|---------------------|
| SIC-POVM d=2 | Real fiducial vector + Weyl-Heisenberg orbit, verified overlap = 1/3, trace = 1 |
| Posner molecule | Ca₉(PO₄)₆ with correct atom counts (9 Ca, 6 P, 12 O), bond graph, coherence state model |
| LOVE hash chain | SHA-256 tamper-evident chain (`love_chain` table, `/chain`, `/export`), auto-appended on earn/spend |
| K4 graph engine | `K4Graph` class with adjacency matrix, shortest path, completeness/planarity checks |
| P2P federation DO | `CareFederationNode` Durable Object with peer registration, message relay, trust scoring |
| EUDI SD-JWT VC | Envelope per draft-ietf-oauth-sd-jwt-vc-17 with `dc+sd-jwt` typ, Ed25519 signature |
| DID resolver | `resolveDIDAsync()` supports `did:key`, `did:web`, `did:jwk` |

## Honest Labeling Status

All quantum-related source files carry the `⚠️ HONEST LABEL` header indicating:
- Underlying science is contested / NOT established physics
- Code is an architectural metaphor made literal
- See `docs/QF1_CONTESTED_SCIENCE.md` for full position

## Known Gaps

1. **Formal EUDI certification**: PENDING — not EBSI-certified, not eIDAS 2.0 recognized
2. **P2P mesh consensus**: Simplified — uses DO for coordination, not full consensus protocol
3. **K4 deployment schema**: Schema SQL is written but needs `wrangler d1 execute` to apply
4. **LOVE chain migration**: `002_love_chain.sql` needs to be applied to the live D1
5. **EBSI credential types**: Not yet implemented

## Bundle Budgets

| Subsystem | Target | Status |
|-----------|--------|--------|
| Quantum-core (SIC + Posner) | < 200KB gzip | ✅ Pure JS, no deps |
| LOVE chain helpers | < 50KB | ✅ Native Web Crypto |
| K4 graph engine | < 100KB | ✅ Pure JS |
| P2P mesh DO | < 150KB | ✅ DO + stdlib |
| EUDI (resolveDID + SD-JWT) | < 100KB | ✅ Pure JS + fetch |
| **Total per Worker** | **< 600KB** | ✅ |
