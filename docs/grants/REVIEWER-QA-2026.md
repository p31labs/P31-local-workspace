# Reviewer Q&A Pack — NGI TALER + NGI Fediversity (2026-08-01 submissions)

**Purpose:** Pre-prepared answers to anticipated reviewer questions. NLnet
evaluates each proposal with at least two independent review committee members;
failed proposals receive the reviewers' concerns and are pushed back to the next
call. These answers keep responses fast, consistent, and evidence-backed.

**Submissions:**
- NGI TALER — `L.O.V.E.-Ledger` (code `2026-08-1f1`, €15,000)
- NGI Fediversity — `PHOS-Sovereign` (code `2026-08-1ed`, €25,000)

Evidence file: `docs/grants/RESEARCH-2026-08-01.md`

---

## Q1. X-Wing and composite signatures are IETF drafts, not RFCs — why should we trust the cryptography?

The proposals describe these as implementations, not as published RFCs. The
cryptographic primitives that are published standards — ML-DSA-65 (FIPS 204),
ML-KEM-768 (FIPS 203), `did:jwk` ML-DSA-65 per RFC 9964 — are implemented and
verified. X-Wing (`draft-connolly-cfrg-xwing-kem`) and composite signatures
(`draft-ietf-pquip-composite-signatures`) are implemented against the current
IETF drafts, which are stable and interoperate with reference implementations.
We track both drafts and will adopt the final RFCs on publication; the interface
surface is small (one hybrid KEM construct and one combined signature format), so
migration cost is minimal.

## Q2. The test counts in your materials — how many tests actually pass, and can we verify?

Use one consistent, honest figure: **41+ worker tests passing with 0 typecheck
errors** across personal-swarm (23), X-Wing KEM (8), and federation-bridge (10).
The BONDING engine additionally passes **95 tests**. The outdated "384 tests"
figure was removed and should not be cited. Verification: the test suites live in
the public repository (AGPL-3.0); offer to share a CI test-run log or run the
suites live during evaluation.

## Q3. LOVESBT / ERC-5192 — is your soulbound token standards-compliant?

No ERC-5192 compliance is claimed in the submissions, and none should be added.
`LOVESBT` on Base Sepolia is soulbound **by convention**: `transfer`/`transferFrom`
revert, but the ERC-5192 interface (`locked()`, `Locked` event,
`supportsInterface(0xb45a3c0e)`) is not implemented. The submissions describe it
accurately as "soulbound by convention — transfers revert."

## Q4. What is the "Cognitive Passport"?

A client-side PHOS surface that adapts the UI by spoon level (0–5), not an
on-chain token. There is no `CognitivePassport.sol` contract. The submissions
describe it as a client-side surface; keep it that way.

## Q5. The P31 Portal supplement (€5K) — which call does it target?

It is parked. There is no open NGI call that fits it today (NGI Zero Commons
closed 2026-06-01). It will be retargeted to the Open Internet Stack programmes
announced after summer (see `OPEN-INTERNET-STACK-RETARGET.md`). This does not
affect the two submitted proposals.

## Q6. Is the GNU Taler integration real, or aspirational?

Real and deployed. The `taler-exchange-bridge` worker is wired to
`exchange.demo.taler.net`; CBS blind signatures are live in production via the
WASM build (`BLIND_MODE='taler'`, `taler_cs.wasm`). The project is funded, in
part, to move from the demo exchange to production-grade settlement flows.

## Q7. What is the money-transmitter exposure of the LOVE-to-Taler bridge?

P31 is a Georgia nonprofit (501(c)(3) application pending) and provides only
non-custodial bridge software. LOVE credits represent care value inside the
family perimeter and are not convertible to fiat through P31. P31 never holds
user funds, never processes fiat conversions, and does not operate the settlement
layer (licensed entities run the Taler exchange-to-banking path). Legal review is
in progress; the architectural invariant is that P31 is not a money transmitter.

## Q8. How do you reconcile Taler's merchant transparency with family-perimeter privacy?

Taler gives the merchant transaction amount, timestamp, and product description —
not payer identity. The LOVE-Ledger hash-chain layer proves care occurred (SHA-256
entries chained via `prev_hash`/`entry_hash`) without exposing the medical or
emotional content of care. Only hash digests are anchored on-chain
(P31TransparencyAnchor, Base Sepolia); underlying care data stays inside the
family perimeter, encrypted at rest.

## Q9. Who are the 18 pilot families?

18 families are registered with active status in the `pilot_registry` (shared
LOVE_DB D1), verified by a live D1 query. They form the initial rollout cohort for
LOVE-Ledger and the Fediversity pilot deployment. Sending invitations and
structured feedback collection is manual outreach per `docs/PILOT-OUTREACH-KIT.md`.

## Q10. Why are you (US-based) applying to EU-funded programmes?

The work is squarely within each call's scope: privacy-preserving payments
(TALER) and a self-hostable fediverse-connected hosting stack (Fediversity). The
software is libre (AGPL-3.0 / CC-BY-4.0), interoperates with EU standards
(EUDI Wallet, E-IDAS 2.0, GDPR) and is documented for EU adopters, including
open-source licensing and legal analysis for non-US jurisdictions. US-based
applicants are eligible under the call rules.

## Q11. Post-quantum signatures are large (ML-DSA-65 = 3309 bytes). How do they fit in constrained Workers?

Challenge acknowledged in the proposals. Mitigations: composite signatures are
verified at the ledger-bridge boundary before on-chain relay; X-Wing KEM is used
for key exchange where the larger public-key/signature footprint is acceptable;
HTTP header/payload size is managed at the worker boundary; memory is bounded to
the Cloudflare Workers 128MB runtime with Web Crypto only. All test vectors pass
in the deployed runtime.

## Q12. What happens if the grants are not awarded?

Both proposals are milestone-scoped and independent of each other. If declined,
NLnet sends the reviewers' concerns and we address them for the next call. The
core infrastructure (bridge, federation, PQC) is already deployed and continues
to be maintained regardless of grant outcome.

---

## Response timing guidance

- NLnet contacts the applicant "within a few days" of the deadline, then the
  decision window is roughly 4–8 weeks (mid-September to mid-October 2026).
- Reply promptly to reviewer questions (24–48h target).
- If the confirmation email is missing, check spam; if a legacy forwarding
  mechanism is in use, the receiving server may drop DMARC/DKIM/SPF-failing mail
  (fix with Sender Rewriting Scheme).
