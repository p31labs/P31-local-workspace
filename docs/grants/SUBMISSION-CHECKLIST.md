# NGI Submission Checklist — P31 Labs

## NGI TALER (14th Open Call)

- [x] Proposal narrative complete (`NGI-TALER.md`)
- [x] Final submission package (`NGI-TALER-SUBMISSION.md`)
- [x] Live demo links verified (phos.p31ca.org, pilot.p31ca.org, federation.p31ca.org)
- [x] Compliance evidence (DID Core v1.1, RFC 9964, SD-JWT VC draft-17, NIST IR 8547, EUDI readiness, hybrid PQC)
- [x] Test coverage (41+ worker tests: 23 personal-swarm + 8 X-Wing KEM + 10 federation-bridge; 0 typecheck errors)
- [ ] Demo video recorded and uploaded
- [ ] Submitted via NLnet portal (https://nlnet.nl/taler/)
- [ ] Confirmation received from NLnet

## NGI Fediversity (12th Open Call)

- [x] Proposal narrative complete (`NGI-FEDIVERSITY.md`)
- [x] Final submission package (`NGI-FEDIVERSITY-SUBMISSION.md`)
- [x] Live demo links verified (federation.p31ca.org, phos.p31ca.org, pilot.p31ca.org)
- [x] Compliance evidence (ActivityPub, RFC 9421, NodeInfo 2.1, EUDI readiness, hybrid PQC)
- [x] Test coverage (41+ worker tests: 23 personal-swarm + 8 X-Wing KEM + 10 federation-bridge; 0 typecheck errors)
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
- [x] EUDI readiness: `docs/EUDI-READINESS.md`
- [x] Cryptographic inventory (NIST IR 8547): `docs/CRYPTOGRAPHIC-INVENTORY.md`

## Deadline

**2026-08-01, 12:00 CEST** — 18 days from CWP date.

## Notes

- Both proposals submitted in parallel (TALER + Fediversity)
- Budget: TALER €15,000 + Fediversity €25,000 = €40,000 total
- P31 has not previously received NGI funding (no cumulative cap concern)

## Pending (manual — cannot be executed from the build agent)

- **NGI portal upload + submission** (`--submitted` items above): done in the NLnet
  portal by a human operator before **2026-08-01, 12:00 CEST**.
- **Demo video** (`docs/grants/NGI-DEMO-SCRIPT.md`): recorded + uploaded
  (Zenodo/YouTube unlisted) by a human operator; link pasted into both proposals.
- **Cloudflare Alerts** (Worker Errors / D1 latency / R2 / CPU): configured on the
  Cloudflare **dashboard → Alerts** panel, not via wrangler.
- **Hybrid PQC TLS**: enabled at the Cloudflare zone level (SSL/TLS → Edge
  Certificates → Post-Quantum) for `p31ca.org` — a dashboard/ops step, not code.
- **Pilot invites**: `scripts/pilot-onboard.js --export-links` generates onboarding
  URLs; `--export-csv` exports status. `--onboard <did>` marks onboarded. Sending
  invitations is manual outreach using `docs/PILOT-OUTREACH-KIT.md` templates.

## CWP-2026-058 (Fortune 1 Launch) — 2026-07-15

### Completed

- [x] Genesis ping SHA-256 entryHash fix (`scripts/genesis-ping.js`)
- [x] p31ca `/api/health/` endpoint (HTTP 200, JSON)
- [x] p31ca hybrid mode (`output: 'static'` + `@astrojs/cloudflare`)
- [x] Pilot outreach docs (`docs/PILOT-OUTREACH-KIT.md`, `docs/PILOT-TRACKER-TEMPLATE.md`)
- [x] Pilot onboarding CLI (`--export-links`, `--export-csv`, `--summary`, `--template`)
- [x] Demos index expansion (Spaceship Earth, Molecular Field, Starfield tiles)
- [x] Molecular Field demo (`public/demos/molecular-field.html`)
- [x] Spaceship Earth void color fix (`#000000` → `#0A0A0F`)
- [x] Treaty page signing section (`site/uplink.html`)
- [x] Full production demo script (`docs/grants/NGI-DEMO-SCRIPT.md`)
- [x] p31ca built and deployed to production
- [x] All endpoints verified HTTP 200

### Still manual

- Run genesis ping live: `GENESIS_ETH_ADDRESS=0x51c285Df171C76bE36252e32679F098d90768413 node scripts/genesis-ping.js --apply --anchor`
- Record demo video using `docs/grants/NGI-DEMO-SCRIPT.md`
- Send pilot invites via email/Discord using `docs/PILOT-OUTREACH-KIT.md`
- Submit NGI proposals via NLnet portal
- Enable Cloudflare PQC TLS (zone SSL/TLS dashboard)
- Configure Cloudflare Alerts (dashboard)

## CWP-2026-049 Agent Execution — 2026-07-14

Aligned with `docs/cwp/CWP-2026-049-ALIGNMENT.md`. What the build agent completed vs. what remains manual:

- **PHOS deployed:** rebuilt + deployed to Pages project `phos` (deploy `5355d981.phos-btn.pages.dev`). `www.phos.p31ca.org/portal/` → 200, preview `/portal/` → 200.
- **`phos.p31ca.org` apex → 200 (RESOLVED):** root cause was the `phos.p31ca.org/* -> sovereign-agent` Worker route shadowing the Pages custom domain; that route was deleted. `phos.p31ca.org/portal/` and `phos.p31ca.org/` now return 200 (PHOS deployed, production deploy `5355d981.phos-btn.pages.dev`).
- **PQC TLS + Alerts (BLOCKED):** API probes returned `9109` (zone settings) and `10000` (alerts) — insufficient token scope. Dashboard-only.
- **Pilot tool fixed + links generated:** `scripts/pilot-onboard.js` fixed (multi-line JSON parse + missing `registered_at` col); 18 links in `/tmp/pilot-links.txt` (3 are test/seed DIDs). Sending invites is manual.
- **NGI artefacts validated:** all 7 evidence files present.
- **Not executed (by design):** NGI NLnet submit, demo video, pilot invite sends, Discord/Matrix activation, `federation.p31ca.org` custom-domain activation.
- **CWP doc false ✅ corrected:** "NGI submitted" and "Alerts configured" are ❌/pending, not done.
