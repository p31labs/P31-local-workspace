# W3C VC Data Model 2.1 — Monitoring Plan

**Created:** 2026-08-17
**Status:** Working Draft (WD)
**Call for Exclusions deadline:** 2026-09-06

---

## Current Status

| Milestone | Date | Impact |
|-----------|------|--------|
| **First Public Working Draft (FPWD)** | 2026-04-09 | Published; minor changes from VC 2.0 |
| **Working Draft (WD)** | 2026-05-11 | Latest published; editorial refinements |
| **Call for Exclusions** | Ends 2026-09-06 | Patent exclusion period; no new features expected |
| **Candidate Recommendation** | Q4 2026 (est.) | Stability gate; implementation reports required |
| **Proposed Recommendation** | Q1 2027 (est.) | Final review before Recommendation |
| **W3C Recommendation** | Q2 2027 (est.) | Official standard |

---

## What Changed from VC 2.0

Per the published FPWD and WD:

1. **`digestSRI` deprecated** — Use `digestMultibase` or Data Integrity proofs instead
2. **Editorial refinements** — Clarifications on vocabulary, examples, security considerations
3. **No breaking changes** — All VC 2.0 credentials remain valid under VC 2.1

---

## P31 Impact Assessment

| Component | VC Version Used | Breaking Risk | Action |
|-----------|----------------|---------------|--------|
| `eudiExport.ts` | VC 2.0 (`@context` v2) | **None** | No changes needed; v2.0 context is a subset of v2.1 |
| `eudi.ts` (SD-JWT) | SD-JWT VC draft-17 | **None** | SD-JWT is independent of VC Data Model version |
| `cognitivePassport.schema.ts` | N/A (internal) | **None** | Schema is internal; no W3C VC dependency |
| `federation-bridge` | SD-JWT + FEP-8b32 | **None** | Federation proofs are version-agnostic |
| `ledger-bridge` | SD-JWT VC | **None** | SD-JWT VC draft-17 alignment already done |

**Verdict:** Zero breaking changes expected. P31's VC usage is forward-compatible with VC 2.1.

---

## Monitoring Actions

### Before 2026-09-06 (Call for Exclusions deadline)
- [ ] Review Final Classification Report for any patent exclusion claims
- [ ] Confirm no new cryptographic suite requirements (PQC already ahead)
- [ ] Verify `@context` v2 still accepted (likely; v2.1 is additive)

### At Candidate Recommendation (Q4 2026)
- [ ] Review implementation reports from other vendors
- [ ] Check if `digestSRI` deprecation timeline affects any P31 exports
- [ ] Validate EUDI Wallet test harness against VC 2.1 CR

### At Proposed Recommendation (Q1 2027)
- [ ] Run full VC 2.1 compliance suite against P31 credentials
- [ ] Update `eudiExport.ts` `@context` array if v2.1 context URI changes
- [ ] Update documentation to reference VC 2.1 Recommendation

---

## Key URLs

- **Spec:** https://www.w3.org/TR/vc-data-model-2.1/
- **FPWD:** https://www.w3.org/TR/2026/WD-vc-data-model-2.1-20260409/
- **Latest WD:** https://www.w3.org/TR/vc-data-model-2.1/
- **GitHub:** https://github.com/w3c/vc-data-model/issues
- **Call for Exclusions:** https://www.w3.org/2002/12/cpp-charter.html (standard W3C process)

---

## Review Cadence

- **Monthly:** Check W3C VC WG mailing list and GitHub for new WDs
- **At milestones:** Full impact assessment (see actions above)
- **On alert:** If any PQC or selective disclosure changes are proposed, immediate review

---

## Notes

- VC 2.1 is a **minor** update from VC 2.0 — the W3C VC WG explicitly stated no breaking changes
- P31's primary VC format is SD-JWT VC (draft-17 / RFC 9901), which is version-independent
- The `@context` array in P31 credentials includes both v1 and v2 URIs for backward compatibility
- EUDI Wallet framework (eIDAS 2.0) references VC Data Model generically; no version-specific requirement yet
