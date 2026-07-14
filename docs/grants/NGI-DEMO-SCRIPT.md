# NGI Demo Script — P31 Sovereign, Post-Quantum Care Attestation

**CWP:** CWP-2026-045 (Launch Frontier), Phase 5
**Length:** ≤ 3 minutes
**Upload:** Zenodo or YouTube (unlisted); link in both NGI proposals.

---

## 0:00–0:30 — Introduction
- P31 builds **sovereign, neuroinclusive, post-quantum** care attestation for neurodivergent families.
- The problem: care is invisible labour; there is no verifiable, privacy-preserving record.
- The stack: **PHOS** (spoon-aware workspace) → **personal-swarm** (spatial dashboard) → **ledger-bridge** (PQC on-chain anchor) → **federation-bridge** (EUDI-aligned credentialing).

## 0:30–1:00 — Create & register a sovereign DID
- Navigate `https://phos.p31ca.org` → **Passport** surface → generate a `did:key` (Ed25519).
- → **PQC Keys** surface (`/pqc-keys`): generate ML-KEM-768 + ML-DSA-44 + ML-DSA-65 keypair.
- → register the DID with the **love-ledger** identity registry (self-signed `identity_registry`).

## 1:00–1:30 — Mint a Care SBT + issue credentials
- → **Care Mint** surface (`/mint`): mint a soulbound Care SBT on Base Sepolia (`LOVESBT`).
- → toggle **Post-Quantum Co-Signature**: sign the mint with the ML-DSA-65 PQC vault key.
- → `federation-bridge` issues an **SD-JWT VC** (draft-17) with `vct`/`sub`/`exp`/`cnf`; EUDI `CredentialIssuer` service endpoint.

## 1:30–2:00 — Spatial Quantum Dashboard
- → **Spatial Quantum Dashboard** (`/spatial`, WebGPU): watch the Sierpinski swarm render care events in real time.
- Note the **edge cache** (verified `MISS → HIT`) and the `cf-monitor` auto-diagnostic.

## 2:00–2:30 — Federation + EUDI verification
- Show `https://federation.p31ca.org/actor` — the DID Document exposing `CredentialIssuer` + `CredentialVerifier` **service** endpoints.
- Issue a **BadgeFed-style** credential (ActivityPub `Create` + FEP-8b32 Object Integrity Proof).
- Verify it: `POST /credential/verify` → returns `verified: true`.
- Revoke it: `POST /credential/revoke/:id` → `GET /credential/revocation/:id` returns `status:"invalid"`.

## 2:30–3:00 — Compliance & close
- Overlay the **NIST IR 8547** cryptographic inventory + **X-Wing hybrid KEM** (ML-KEM-768 + X25519, live round-trip in `ledger-bridge`).
- Call out: **41+ tests passing**, 0 typecheck errors, deployed to Cloudflare Workers.
- CTA: fund P31 via NGI TALER / Fediversity to bring sovereign, PQC care attestation to 18 pilot families.

---

## Recording notes
- Tool: OBS / QuickTime (screen only; no audio PII).
- Use the **spoon-aware** UI at `data-spoons="3"` for the dashboard segment.
- Keep each segment under its time budget; cut the Care SBT confirmations for pacing.
- Export 1080p MP4, ≤ 3 min, upload unlisted, paste link into `docs/grants/NGI-TALER-SUBMISSION.md` + `docs/grants/NGI-FEDIVERSITY-SUBMISSION.md`.
