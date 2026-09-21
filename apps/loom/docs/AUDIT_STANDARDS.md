# The Loom — agent audit standards (spec v1.0)

> The Loom's log as a Session Audit Record — positioned against the drafting
> standards landscape, with the field matrix, the tamper-evidence layer, and
> the cross-anchor to the LOVE care ledger. This is the document an auditor,
> a procurement reviewer, or a standards-body reader opens first.

**Date**: 2026-09-21
**Status**: pre-ratification positioning — every standard cited here is an
Internet-Draft or Community Group report, none is a ratified RFC or W3C
Recommendation as of this date. That is the point: the window is open now.

---

## 1. The claim, in one paragraph

The Loom's log is the **runtime**, not a logging layer bolted onto one. Every
visible state folds over the append-only event log; the gate enforces
writer-per-kind; each stored record carries a `prev_hash` (SHA-256 of the
previous record's RFC 8785 canonical preimage), so the log is **tamper-evident
by construction** — rewriting, reordering, or deleting any record breaks the
chain at the next seq, and `GET /api/loom/verify` names exactly where. The
log satisfies the EU AI Act's automatic-event-logging obligation (Art. 12) by
architecture, not by retro-fit. The LOVE cross-anchor commits the Loom's
`/verify` head into the care ledger's SHA-256 chain — one provable root for
the design system and the care economy.

---

## 2. Where the Loom's log lands in the standards landscape

| Standard | Scope | Loom's fit | Status (2026-09) |
|---|---|---|---|
| **IETF GAR** (`draft-sato-soos-gar-02`) | Session Audit Record (SAR) as primary artifact; causal ordering; audit alerting | The Loom's log **is** the SAR; `seq` is the causal chain; `/verify` is the alert | Individual I-D, no IETF endorsement, no RFC stream |
| **IETF AAT** (`draft-sharif-agent-audit-trail-00`) | Operation-level JSON logging; 11 mandatory fields; `prev_hash` via RFC 8785; ECDSA P-256 | `seq`, `ts`, `writer`, `kind` by construction; **`prev_hash` added 2026-09-21** | Individual I-D |
| **W3C AIVS** (Agentic Integrity Verification Spec) | Session-level cryptographic proof bundles, portable + self-verifiable | `/verify` is the first half; the linked chain is the second | Community Group, launched 2026-04 |
| **EU AI Act Art. 12 / 19** | Automatic event logs; 6-month retention; obligations applied 2026-08-02 | Met by construction (automatic logging); retention is a D1 lifecycle rule, **not yet implemented** | In force |
| **LOVE ledger** (P31's own) | Care-economy SHA-256 chain; `prev_hash → entry_hash` | The Loom anchors its head into it (`LOOM_HEAD`) | In production |

**The differentiator in one line**: the median agent framework logs 5 of the
12 mandatory AAT audit fields. The Loom covers the structural set by
*architecture* — the gate enforces writer identity, the append-only log
preserves order, the fold is replayable, the `prev_hash` chain makes it
tamper-evident. What it lacks is cryptographic *signature* binding (ECDSA
P-256 per AAT), which would tie each record to a writer key. That is the
documented gap and the natural next increment.

---

## 3. The record — the AAT field matrix

The stored record is the D1 row `(seq, ts, data, prev_hash)`. `data` holds
the full `LoomEvent` JSON (gate-stamped `seq` + `ts`), so replay reconstructs
the exact event object. The chain preimage is RFC 8785 (JCS) canonical JSON
of `{ seq, ts, data, prev_hash }`.

| AAT mandatory field | Loom record | How it is satisfied |
|---|---|---|
| record_id | `seq` | Gate-assigned monotonic id |
| timestamp | `ts` | ISO 8601, gate-stamped |
| agent_id | `writer` (`human`/`agent`) | Gate-enforced writer-per-kind |
| session_id | `humanId` on human events; `parentAgent` on agent events | Optional reference, never PII |
| action_type | `kind` | The event union, port-audited against the AAF manifest |
| outcome | `valid` verdict at append | The gate's `GateResult` |
| prev_hash | `prev_hash` | SHA-256 of previous record's JCS preimage |
| signature | — | **Gap**: ECDSA P-256 not yet present |
| (other 4) | — | Covered by `data` payload + replayability |

---

## 4. Tamper-evidence — `/verify` and `/provenance`

- `GET /api/loom/verify` — replays the D1 log, recomputes the chain, returns
  `{ valid, checked, brokenAt, head, expected, found }`. Never cached — a
  stale 200 must not mask a tamper.
- `GET /api/loom/provenance/:seq` — the chain from genesis to `seq`, each
  record with its `prev_hash`, plus the recomputed verdict and the head
  commitment. This is the artifact a reviewer asks for: "show me every action
  that led to this state, and prove none of them changed."

Both are registered in the AAF manifest (`verification.verify`,
`verification.provenance`) as `danger: none` reads — the manifest stays the
single surface list, and the port-audit gates the app at 0 missing actions.

The hash module is `@p31/canon/loom/hash-chain`: `canonicalize` (RFC 8785),
`linkChain`, `verifyChain`. Edge-safe (WebCrypto only), so the Workers edge,
the Node dev middleware, and the tests compute identical bytes — same SHA-256,
same verdict.

---

## 5. The cross-anchor — one provable root

`GET /api/loom/anchor` computes (dry-run) the exact `LOOM_HEAD` entry the
Loom's `/verify` head would occupy in the LOVE ledger's chain, in that
ledger's own `chainAppend` format:
`message = "LOOM_HEAD|" + JSON.stringify(payload) + "|" + prevHash`,
`entryHash = SHA-256(message)`, where `prevHash` is the LOVE chain's current
head (its last `entry_hash`; genesis = 64 zeros).

A written anchor means the LOVE chain **commits to the design log's head**: a
later `/verify` whose head matches the anchored value proves the design log is
the same log the care ledger committed to. Tampering with either breaks the
link. This is the trust layer as a product surface — the answer to
"prove what your agent did" that also names the family's care.

**Write path (not yet live)**: appending the anchor requires a dedicated
service-to-service token to the love-ledger's write path (which is HS256-JWT
+ nonce replay protected). The dry-run endpoint is read-only and live; the
write is documented in `LOVE_INTEGRATION.md` as the next increment.

---

## 6. The documented gaps (honest)

1. **Signatures** — per-record ECDSA P-256 (AAT) would bind writer identity
   cryptographically. The chain proves *something changed and where*; it does
   not yet prove *who* beyond the gate's writer field.
2. **Retention** — EU AI Act Art. 19's 6-month retention is a D1 lifecycle
   rule not yet implemented; R2 WORM cold storage is the LOVE side's pattern.
3. **Per-DID separation** — the LOVE chain is global (one `love_chain` table),
   not per-DID despite the litepaper's phrasing. Fixing that is love-ledger
   work, documented separately.
4. **Anchor write** — the cross-anchor is computed and exposed, but the write
   to the LOVE chain awaits the service token.

---

## 7. What to do when the standards move

- **GAR reaches RFC** — map the Loom's SAR to the ratified record, add the
  five audit types if the draft's taxonomy survives.
- **AAT reaches RFC** — add the ECDSA P-256 signature field; the `prev_hash`
  pattern is already aligned.
- **EU AI Act updates retention guidance** — implement the D1 lifecycle rule
  against the latest guidance.

## Related Documents

- `../README.md` — what the Loom is
- `./STANDARDS.md` — the conformance posture (audit trails section)
- `./DECISIONS.md` — #001 log-as-truth, #008 tamper-evident
- `./SECURITY.md` — the deployed perimeter + integrity
- `./LOVE_INTEGRATION.md` — the care-economy bridge (identity / care proof / anchor)