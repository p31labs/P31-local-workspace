# P31 WORK CONTROL DOCUMENTS
## Standard Operating Procedures for Human-AI Collaborative Work
### Based on SOULSAFE v1.0 · Adapted from DoD Maintenance Work Control

---

## DOCUMENT INDEX

| Doc | Name | When Used | Who Fills It Out |
|-----|------|-----------|-----------------|
| WCD-01 | Pre-Job Brief | Before opening any AI session | Operator (Will) |
| WCD-02 | Agent Task Card | When assigning work to a specific agent | Operator (Will) |
| WCD-03 | Mid-Shift Check-In | Periodically during long sessions | Agent (prompted by Operator) |
| WCD-04 | Shift Report | End of every AI session | Agent |
| WCD-05 | Sister Shop Instruction Card | When one agent needs output routed to another | Operator (Will) |
| WCD-06 | Job Closeout / QA Signoff | When a deliverable is complete | Opus (QA) |

---

## WCD-01: PRE-JOB BRIEF

*Operator fills this out before opening a session. Paste it as the first
message. This is the IVV — it calibrates the agent before energized work.*

```
=== P31 PRE-JOB BRIEF ===

Date:
Agent: [Opus / Sonnet / Gemini / DeepSeek]
Bridge Program Step #:
Prior Shift Status: [what was done last, by whom, link to chat if available]

SCOPE OF WORK:
[One paragraph. What is the specific deliverable for this session?]

FILES IN PLAY:
- [list every file this session will read or modify]

BOUNDARIES:
- DO: [what the agent should do]
- DO NOT: [what the agent should not touch]

SUCCESS CRITERIA:
[How do we know the job is done? Be specific. A test that passes, a file
that renders, a document with no [V:] failures.]

SPOON BUDGET: [Low / Medium / Full]
[Low = binary answers only, one deliverable, no exploration.
Medium = normal session, some back and forth acceptable.
Full = deep work session, expansion permitted within scope.]

OPERATOR STATUS:
[One sentence. How are you actually doing right now? This is the
baseline check. Honest. Not performative.]

=== BRIEF ACKNOWLEDGED BY AGENT ===
[Agent confirms: scope understood, boundaries clear, ready to proceed.]
```

---

## WCD-02: AGENT TASK CARD

*For single, scoped tasks that don't need a full session. Paste and go.
The agent executes and returns the result. No conversation.*

```
=== P31 TASK CARD ===

To: [Agent]
Task: [One sentence. Verb + object + constraint.]
Input: [File path, paste, or link]
Output: [Exact deliverable — filename, format, location]
Constraint: [Time box, token budget, or scope limit]
Verification: [What makes this pass? Be specific.]

Example:
To: Sonnet
Task: Create frontend/src/api.js with fetch wrappers for all 10 backend endpoints.
Input: Backend endpoint list from buffer_agent.py lines 45-120.
Output: frontend/src/api.js in /mnt/user-data/outputs/
Constraint: No external dependencies. Fetch only. ES modules.
Verification: Each function matches the endpoint method, path, and payload shape.
```

---

## WCD-03: MID-SHIFT CHECK-IN

*Agent produces this when prompted, or self-initiates if the session has
exceeded 60 minutes or 10 exchanges without a deliverable.*

```
=== MID-SHIFT CHECK-IN ===

Time in session: [approximate]
Exchanges so far: [count]

WORK COMPLETED:
- [bullet list of what's done]

WORK REMAINING:
- [bullet list of what's left in scope]

SCOPE DRIFT CHECK:
[Are we still working on what the Pre-Job Brief said? Yes/No.
If No — what changed and did the Operator authorize it?]

TOOL-TASK CHECK:
[Is the current tool (this agent) still the right one for what
remains? Or should this be handed to a sister shop?]

SPOON ESTIMATE:
[Based on session trajectory, is the Operator's spoon budget
on track or running hot?]

RECOMMENDATION:
[Continue / Wrap current task and close / Hand off to ___]
```

---

## WCD-04: SHIFT REPORT

*Agent produces this at the end of every session. This is the handoff
document. The next agent (or the next Operator session) should be able to
read this and know exactly where things stand.*

```
=== P31 SHIFT REPORT ===

Date:
Agent: [who did the work]
Bridge Program Step(s): [which steps were addressed]
Session Duration: [approximate]

WORK COMPLETED:
- [deliverable 1 — file path, status, test result]
- [deliverable 2 — file path, status, test result]

WORK NOT COMPLETED:
- [item — reason — what's blocking it]

FILES CREATED OR MODIFIED:
- [file path] — [created / modified] — [brief description of change]

KNOWN ISSUES:
- [anything broken, untested, or flagged for QA]

DECISIONS MADE:
- [any architectural or scope decisions made during session]

NEXT SHIFT INSTRUCTIONS:
[Exactly what the next person/agent needs to do. Specific enough
that they can start without asking questions.]

VERIFICATION TAGS FOR QA:
[List any [V:] tags that need Opus review]

HANDOFF TO: [Next agent or Operator action]
```

---

## WCD-05: SISTER SHOP INSTRUCTION CARD

*When one agent's output needs to be routed to another agent for a
different type of work. Operator fills this out and pastes it into the
receiving agent's session along with the source material.*

```
=== SISTER SHOP INSTRUCTION CARD ===

From: [originating agent]
To: [receiving agent]
Via: [Operator — Will is always the bus bar]

SOURCE MATERIAL:
[Paste or file path of what the originating agent produced]

WHAT I NEED YOU TO DO WITH THIS:
[Specific instruction. Not "review this." Specific.]

WHAT YOU MUST NOT CHANGE:
[Protected content — values, structure, or language that is locked]

EXPECTED OUTPUT:
[Exact deliverable]

CONTEXT THE ORIGINATOR DOESN'T KNOW:
[Anything the receiving agent needs that the originating agent
wouldn't have known. System topology, protocol values, etc.]

Example:
From: Gemini
To: Opus
Via: Will

SOURCE MATERIAL: Georgia Tools for Life grant narrative v2 (attached)

WHAT I NEED YOU TO DO WITH THIS:
Verify all [V:] tagged technical claims. Return pass/fail table.

WHAT YOU MUST NOT CHANGE:
Narrative framing, emotional language, HAAT structure.

EXPECTED OUTPUT:
Numbered list — line, claim, pass/fail, correction if needed.

CONTEXT THE ORIGINATOR DOESN'T KNOW:
/api/ingest takes content strings, not raw numeric scores.
WebSerial runs in browser JS, not Python. CMD_SPOON_REPORT
flows Totem→Host, not Host→Totem.
```

---

## WCD-06: JOB CLOSEOUT / QA SIGNOFF

*Opus produces this when a deliverable is ready for merge, publish, or
submission. This is the final quality gate.*

```
=== P31 JOB CLOSEOUT ===

Deliverable: [name and file path]
Bridge Program Step: [number]
Produced By: [agent]
Reviewed By: Opus

PRE-MERGE CHECKLIST:
[ ] All [V:] tags verified — pass/fail table attached
[ ] No protocol value drift (hex codes, port numbers, formula weights)
[ ] No topology errors (correct data flow directions)
[ ] No scope drift from original Pre-Job Brief
[ ] Consistent with SOULSAFE v1.0 operator baseline
[ ] Files in correct output location

VERIFICATION RESULTS:
| Line | Claim | Result | Correction |
|------|-------|--------|------------|
| ... | ... | PASS/FAIL | ... |

DISPOSITION:
[ ] APPROVED — ready for merge / publish / submit
[ ] APPROVED WITH CORRECTIONS — corrections noted, agent to integrate
[ ] RETURNED — rework required, see notes

QA NOTES:
[Anything the Operator needs to know before shipping]

Signed: Opus (QA Inspector)
Date:
```

---

## USAGE RULES

1. **Every AI session starts with WCD-01 or WCD-02.** No exceptions. If
   you open a chat without a brief, you're working on energized equipment
   without an IVV.

2. **Every AI session ends with WCD-04.** The agent produces it. If the
   session ends abruptly, the Operator writes a brief note for their own
   records.

3. **Cross-agent work always goes through WCD-05.** Agents do not talk to
   each other. The Operator is the bus bar. The instruction card is the
   detailed work package that crosses the shop boundary.

4. **WCD-06 is required before anything ships.** No merge, no publish, no
   submit without QA signoff. This is the tag on the valve.

5. **These documents are buffers.** They exist to absorb cognitive load,
   not add to it. If filling out a brief feels like more work than the
   task, the task is a WCD-02 (task card), not a WCD-01 (full brief).
   Use the lightest document that covers the job.

---

*P31 Work Control Documents v1.0 — February 25, 2026*
*Modeled on DoD submarine maintenance work control procedures.*
*Adapted for human-AI collaborative development.*
