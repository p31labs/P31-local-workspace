# P31 Work Control Document Templates

**Version:** 1.0  
**Usage Rule 5:** Always use the lightest document that covers the job.

---

## WCD-01: Pre-Job Brief / Cognitive IVV

```
=== P31 WCD-01: PRE-JOB BRIEF ===
Date:
Operator: Will Johnson
Assigned Agent:
Spoon Budget: [ ] Low  [ ] Medium  [ ] Full

1. JOB NAME / SCOPE
[Paragraph-length definition of the specific deliverable]

2. FILES IN PLAY
[Exhaustive list of every file the agent is permitted to read or modify]

3. BOUNDARIES
DO:
- [Explicit positive constraints]

DO NOT:
- [Explicit negative constraints]

4. SUCCESS CRITERIA
[Objective, measurable metrics for task completion]

5. OPERATOR STATUS CHECK
Physical: [honest assessment]
Mental: [honest assessment]
Spoon Estimate: [X / 12]

6. RED BOARD CLEARANCE
[ ] Free from burnout indicators
[ ] Free from hypomania indicators
[ ] Free from RSD collapse indicators

STATUS: [ ] CLEARED FOR OPERATIONS  [ ] RED BOARD — STAND DOWN
=== END WCD-01 ===
```

---

## WCD-02: Agent Task Card

```
=== P31 WCD-02: TASK CARD ===
Date:
Assigned Agent:
Time Box: [X minutes / X tokens]

VERB: [single action verb]
OBJECT: [specific target]
CONSTRAINT: [explicit boundary]

OUTPUT FORMAT: [expected deliverable format]

RULE: No conversation. Execute and deliver.
=== END WCD-02 ===
```

---

## WCD-03: Mid-Shift Check-In / CASREP

Triggered automatically at 60 minutes or 10 exchanges without a verifiable deliverable.

```
=== P31 WCD-03: MID-SHIFT CHECK-IN ===
Date:
Session Duration: [X minutes]
Exchange Count: [X]

1. SCOPE DRIFT STATUS
Original WCD-01 Scope: [restate]
Current Vector: [describe actual work being done]
Drift Detected: [ ] Yes  [ ] No

2. TOOL-TASK CHECK
Current Tool: [which agent / which approach]
Current Task: [what is actually being worked on]
Alignment: [ ] Matched  [ ] MISMATCH — HALT

3. SPOON ESTIMATE
Budget at Start: [X]
Current Estimate: [X]
Trajectory: [ ] Stable  [ ] Running Hot  [ ] Critical

4. CASUALTY INTERVENTION
[ ] Not Required
[ ] Single-Question Intervention Deployed
[ ] SOULSAFE HALT — Spoon Depletion Response Activated

NOTES:
=== END WCD-03 ===
```

---

## WCD-04: Shift Report / Handoff

Generated at the conclusion of any session, regardless of completion status.

```
=== P31 WCD-04: SHIFT REPORT ===
Date:
Operator: Will Johnson
Reporting Agent:
Shift End Time:

1. WORK COMPLETED
- [Item with specific file paths]

2. WORK NOT COMPLETED / KNOWN DEFICIENCIES
- [Item with severity assessment]

3. MODIFIED FILES
| File Path | Change Description |
|-----------|-------------------|
| | |

4. ARCHITECTURAL LOGIC APPLIED
[Record reasoning for decisions made during the shift]

5. RE-ENTRY CONTROL (REC) STATUS
[ ] No REC required
[ ] REC initiated — boundaries: [specify]
[ ] REC closed — restored to certified state

6. NEXT SHIFT INSTRUCTIONS
[Explicit instructions for the subsequent agent/operator]
=== END WCD-04 ===
```

---

## WCD-05: Sister Shop Instruction Card / REC Form

Routes output between agents via the Operator (Bus Bar). Also used for formal Re-Entry Control authorization.

```
=== P31 WCD-05: RE-ENTRY CONTROL (REC) FORM ===
Document ID: REC-[YYYYMMDD]-[NNN]
Authority: Chief Architect (Opus)
Status: [ ] PENDING  [ ] AUTHORIZED  [ ] CLOSED

1. JUSTIFICATION & BOUNDARIES
Subsystem Targeted:
Reason for Re-Entry:
Isolation Scope:
- [Specific files, functions, ports]

2. TAG-OUT PROCEDURE
[ ] [Isolation step 1]
[ ] [Isolation step 2]
[ ] [Isolation step 3]

3. RESTORE & TEST PLAN (SVTM ALIGNMENT)
[ ] [Test ID]: [Description]
[ ] [Test ID]: [Description]

4. SISTER SHOP ROUTING (if applicable)
Originating Agent:
Receiving Agent:
Protected Content: [Content the receiving agent MUST NOT alter]
Technical Context: [Context the originating agent lacked]

5. OPERATOR VERIFICATION
[ ] Data reviewed, understood, and sanitized before transfer.

6. QA AUTHORIZATION
Opus Disposition: [ ] AUTHORIZED  [ ] DENIED — [reason]
Supplemental Conditions:
=== END WCD-05 ===
```

---

## WCD-06: Job Closeout / QA Signoff

Administered exclusively by Opus (Chief Architect / QA).

```
=== P31 WCD-06: QA SIGNOFF / JOB CLOSEOUT ===
Document ID: P31-WCD06-[NNN]
Date:
Reviewer: Opus (Chief Architect / QA)
Subject:

1. DOCUMENT INVENTORY
| Doc # | Title | Status |
|-------|-------|--------|
| | | |

2. TRANSLATION FIDELITY AUDIT
[Verify theory → engineering controls without semantic drift]

3. OQE PASS/FAIL TABLE
| Claim | [V:] Tag | Source | Verified Against | Pass/Fail |
|-------|----------|--------|-----------------|-----------|
| | | | | |

4. PROTOCOL VALUE DRIFT SCAN
| Parameter | Source Value | Current Value | Drift? |
|-----------|-------------|---------------|--------|
| | | | |

5. TOPOLOGY ERROR SCAN
[ ] Data flow directions verified
[ ] Logic gates verified
[ ] Dependency trees architecturally compliant

6. PRIOR CONDITION STATUS
| ID | Item | Status |
|----|------|--------|
| | | |

7. DEFERRED ITEMS
| ID | Item | Reason | Required Action |
|----|------|--------|-----------------|
| | | | |

8. FINAL QA DISPOSITION
[ ] APPROVED
[ ] APPROVED WITH CORRECTIONS
[ ] RETURNED FOR REWORK

CORRECTIONS REQUIRED:

SIGNATURE:
Opus (Chief Architect / QA)
P31 SOULSAFE Cognitive Plant Control
=== END WCD-06 ===
```
