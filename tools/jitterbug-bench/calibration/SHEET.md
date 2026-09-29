# Judge Calibration Sheet

Run: 2026-09-29

**Instructions:** For each criterion below, replace `______` with one of:
`Satisfied` / `Partially` / `Not Satisfied` (positive criteria),
or `Present` / `Absent` (negative criteria, weight < 0).

Read the full report at the path shown before scoring.

When done, edit `tools/jitterbug-bench/calibration/sheet.json` to match and run
`node tools/jitterbug-bench/calibrate.mjs` to compute agreement + Cohen's kappa.

---

## 03-privacy-preserving-identity

Compliance (judge): **0.222**  ·  Report: `/home/p31/P31-local-workspace/tools/jitterbug-bench/calibration/reports/03-privacy-preserving-identity.md`

| ID | Axis | Criterion | Your verdict |
|---|---|---|---|
| ER-1 | Explicit Criteria | Specifies a deterministic generation algorithm | ______ *(Satisfied / Partially / Not Satisfied)* |
| ER-2 | Explicit Criteria | Provides a collision-probability bound | ______ *(Satisfied / Partially / Not Satisfied)* |
| ER-3 | Explicit Criteria | Defines testable invariants (as assertions) | ______ *(Satisfied / Partially / Not Satisfied)* |
| ER-4 | Explicit Criteria | Cites a real PRNG or hash function (cyrb128, mulberry32, etc.) | ______ *(Satisfied / Partially / Not Satisfied)* |
| IR-1 | Implicit Criteria | Infers that vocabulary changes break existing names | ______ *(Satisfied / Partially / Not Satisfied)* |
| IR-2 | Implicit Criteria | Addresses the case where the seed leaks | ______ *(Satisfied / Partially / Not Satisfied)* |
| SY-1 | Synthesis | Connects the privacy argument to the algorithm choice | ______ *(Satisfied / Partially / Not Satisfied)* |
| RF-1 | References | Citations resolve | ______ *(Satisfied / Partially / Not Satisfied)* |
| CM-1 | Communication | Algorithm is presented as runnable pseudocode | ______ *(Satisfied / Partially / Not Satisfied)* |
| NG-1 | Negative | Does NOT claim the system is 'anonymous' if it is pseudonymous | ______ *(Present / Absent)* |
| NG-2 | Negative | Does NOT use a reversible encoding as the 'privacy' mechanism | ______ *(Present / Absent)* |

## 02-family-safe-governance

Compliance (judge): **0.571**  ·  Report: `/home/p31/P31-local-workspace/tools/jitterbug-bench/calibration/reports/02-family-safe-governance.md`

| ID | Axis | Criterion | Your verdict |
|---|---|---|---|
| ER-1 | Explicit Criteria | Specifies a hash-linked, append-only audit chain | ______ *(Satisfied / Partially / Not Satisfied)* |
| ER-2 | Explicit Criteria | Defines the human-approval gate for irreversible actions | ______ *(Satisfied / Partially / Not Satisfied)* |
| ER-3 | Explicit Criteria | Provides a concrete schema for the audit block | ______ *(Satisfied / Partially / Not Satisfied)* |
| ER-4 | Explicit Criteria | Cites NIST AI RMF, ISO 42001, SOX ITGC, IETF GAR, or FedRAMP 20x | ______ *(Satisfied / Partially / Not Satisfied)* |
| IR-1 | Implicit Criteria | Infers the 'verifiable without trusting the vendor' requirement | ______ *(Satisfied / Partially / Not Satisfied)* |
| IR-2 | Implicit Criteria | Addresses nonhuman-identity lifecycle (joiner-mover-leaver) | ______ *(Satisfied / Partially / Not Satisfied)* |
| SY-1 | Synthesis | Maps at least two frameworks onto one architecture | ______ *(Satisfied / Partially / Not Satisfied)* |
| RF-1 | References | Citations resolve to real, relevant sources | ______ *(Satisfied / Partially / Not Satisfied)* |
| CM-1 | Communication | Architecture has named components and data flows | ______ *(Satisfied / Partially / Not Satisfied)* |
| NG-1 | Negative | Does NOT propose logs that nobody reads (governance theatre) | ______ *(Present / Absent)* |
| NG-2 | Negative | Does NOT propose rubber-stamp approvals | ______ *(Present / Absent)* |