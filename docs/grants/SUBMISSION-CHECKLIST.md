# NGI Submission Checklist — P31 Labs

## NGI TALER (14th Open Call)

- [x] Proposal narrative complete (`NGI-TALER.md`)
- [x] Final submission package (`NGI-TALER-SUBMISSION.md`)
- [x] Live demo links verified (phos.p31ca.org, pilot.p31ca.org)
- [x] Compliance evidence (DID Core v1.1, RFC 9964, SD-JWT VC draft-17, NIST IR 8547)
- [x] Test coverage (384 tests passing)
- [ ] Demo video recorded and uploaded
- [ ] Submitted via NLnet portal (https://nlnet.nl/taler/)
- [ ] Confirmation received from NLnet

## NGI Fediversity (12th Open Call)

- [x] Proposal narrative complete (`NGI-FEDIVERSITY.md`)
- [x] Final submission package (`NGI-FEDIVERSITY-SUBMISSION.md`)
- [x] Live demo links verified (federation.p31ca.org, phos.p31ca.org)
- [x] Compliance evidence (ActivityPub, RFC 9421, NodeInfo 2.1)
- [x] Test coverage (384 tests passing)
- [ ] NixOS module implementation (WP2)
- [ ] Demo video recorded and uploaded
- [ ] Submitted via NLnet portal (https://nlnet.nl/fediversity/)
- [ ] Confirmation received from NLnet

## Common Artefacts

- [x] Code repository: https://github.com/p31labs/P31-local-workspace
- [x] NIST IR 8547 compliance report: `docs/grants/NIST-IR-8547-COMPLIANCE.md`
- [x] DID Core v1.1 resolver: `apps/phos/src/lib/did.ts`
- [x] SD-JWT VC implementation: `software/workers/ledger-bridge/src/sdjwt.ts`
- [x] Post-quantum crypto: `@noble/post-quantum` ML-DSA-65
- [x] Federation bridge: `software/workers/federation-bridge/`
- [x] Pilot dashboard: `software/workers/pilot-dashboard/`
- [x] Pilot invitation system: `/api/invite` + dashboard button
- [x] Request-ID propagation: `x-request-id` across all workers
- [x] Observability: D1 latency probes in health endpoints

## Deadline

**2026-08-01, 12:00 CEST** — 18 days from CWP date.

## Notes

- Both proposals submitted in parallel (TALER + Fediversity)
- Budget: TALER €15,000 + Fediversity €25,000 = €40,000 total
- P31 has not previously received NGI funding (no cumulative cap concern)
