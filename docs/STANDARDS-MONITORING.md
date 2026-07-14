# Standards Monitoring — P31 Stack (2026)

Tracker for standards the P31 stack depends on or will converge with. Status
reflects the post-041 research synthesis (2026-07-14). See `AGENTS.md` for the
verified-standards baseline already implemented.

## Active / In-Force

| Standard | Status | P31 Alignment | Action |
|----------|--------|---------------|--------|
| **ML-DSA (FIPS 204)** | Finalised (NIST) | `ml_dsa65` in `ledger-bridge` | None — ahead of curve |
| **ML-KEM (FIPS 203)** | Finalised (NIST) | `ml_kem768` in `quantum-core` + X-Wing KEM (CWP-2026-042 §1) | None |
| **X-Wing hybrid KEM** (draft-ietf-lamp-xwing-00) | IETF draft, 2026-06-23 | Implemented `ledger-bridge/src/kem.ts` | Pin to draft-00; revisit on draft update |
| **DID Core v1.1** | W3C Candidate Rec, 2026-03-05 | `did:key`/`did:jwk`/`did:web` resolver | Monitor PR (expected Q4 2026) |
| **RFC 9964** (ML-DSA for JOSE/COSE) | Published | `did:jwk` `kty:AKP`, `alg:ML-DSA-65` | None |
| **SD-JWT VC draft-17** | At IESG for publication, 2026-07-06 | `typ:dc+sd-jwt`, `_sd_alg:sha-256` | Keep **dual-typ** acceptance (`dc+sd-jwt` + legacy `vc+sd-jwt`) |
| **RFC 9421** (HTTP Message Signatures) | Published | `federation-bridge` server-to-server auth | None |

## Approaching Finalisation (watch list)

| Standard | Expected | Impact on P31 | Trigger |
|----------|----------|---------------|---------|
| **W3C Quantum-Resistant Cryptosuites v1.0** | FPWD mid-2026 | Data Integrity cryptosuites using PQC (ML-DSA/ML-KEM) for VCs | Add cryptosuite once FPWD lands |
| **NIST 3rd-round PQS selections** | Announced May 2026 | Additional post-quantum signature schemes beyond ML-DSA | Evaluate add if a scheme beats ML-DSA-65 for our use |
| **DID Core v1.1 Proposed Rec** | Q4 2026 | Final DID Core spec | Update resolver if normative changes |
| **SD-JWT VC Proposed Standard** | Q3 2026 | Final SD-JWT VC spec | Drop legacy `vc+sd-jwt` typ after transition window |

## Federation

| Project | Status | P31 Use |
|---------|--------|---------|
| **BadgeFed** | Protocol, 2026-07-10 | `federation-bridge` implements BadgeFed-style credentialing natively (CWP-2026-043 §2): `POST /credential/issue` (SD-JWT VC via `ledger-bridge` + ActivityPub `Create` + FEP-8b32 proof), `POST /credential/verify`, `GET /credential/search` |
| **Fedify** | Active | ActivityPub + FEP-8b32 Object Integrity Proofs; reference for `federation-bridge` |

`federation-bridge` now signs outbound activities with **FEP-8b32 Object Integrity Proofs**
(eddsa-2022 / Ed25519 over JCS-canonicalized JSON) and verifies inbound proofs before
accepting `Create`/`Announce` activities (CWP-2026-043 §3).

## Edge / Rendering

| Item | Status | P31 Use |
|------|--------|---------|
| **Cloudflare Cache Reserve** | GA 2026-04-24 | Persistent edge cache for long-lived R2 assets. **Requires a custom-domain zone + qualifying plan** — not available on `*.workers.dev`. Code already emits `Cache-Control: public, max-age=86400`. Enable on the zone dashboard when a custom domain is attached. |
| **Three.js WebGPU (r171+)** | Production-ready | Live `spatial-dashboard.html` uses **real WebGPU** via `3d-force-graph` + `Graph.renderer(WebGPURenderer)` (guarded, WebGL fallback) |
| `graph-gpu` (npm) | **Does not exist** (404) | Superseded — do not depend on it |
| **@fusefactory/fuse-three-forcegraph** v1.1.15 | Real, maintained | WebGL **GPGPU** force graph (ping-pong render-to-texture compute, `THREE.WebGLRenderer`). API: `new Engine(canvas, opts).setData().start()`. An alternative renderer, but it is **not WebGPU** — the live dashboard's WebGPU path is already superior for that goal |
| **BadgeFed** | Protocol, not a package (npm 404) | `federation-bridge` implements BadgeFed-style credentialing natively (ActivityPub + SD-JWT VC + FEP-8b32), no SDK dependency |

## Review cadence
Re-check this file when any "Expected" date passes or when a dependent CWP opens
a PR against a listed standard. Update `AGENTS.md` Research Findings in lockstep.
