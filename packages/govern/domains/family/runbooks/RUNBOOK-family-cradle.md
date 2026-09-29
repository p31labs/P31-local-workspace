# RUNBOOK-family-cradle

## When to use

A `cradle-hold` or `cradle-semantic` gate fires, OR the CRADLE interceptor
holds a live message at a child-safety boundary. This runbook is the
procedure the family-guardian follows when the interceptor triggers.

## Prerequisites

- The interceptor is at `tools/family/cradle-intercept.mjs`
- The negative controls run clean:

  ```bash
  cd /home/p31/P31-local-workspace/tools/family
  node negative-controls/cradle-hold.mjs
  node negative-controls/cradle-semantic.mjs
  ```

  Both must emit `NEGATIVE_CONTROL_OK`.

- A notify channel is configured that the family-guardian actually checks
- A quiet place to read the held message

## Steps

1. **Read the notification.** The interceptor's `notify` callback delivers
   the held message plus its `reasons[]` array. The reasons name the hazard
   class (`self-harm`, `grooming`, `pii`, `probe-stack`,
   `ai-disclosure-reassert`). The class determines the response. Do not skip
   the reasons.

2. **For `self-harm`:** put the phone down. Find the child. Sit with them.
   The interceptor's job was to hold the message; the guardian's job is the
   human response. Do not narrate the interceptor, do not discuss the alert
   channel. Listen first. The hold is a pause for you, not a penalty for
   them.

3. **For `grooming` or `probe-stack`:** identify the correspondent. The
   held message includes the full context. If the sender is another child,
   speak with their parents directly. If the sender is an adult, block and
   report. Preserve the message verbatim for the record — do not delete it
   before logging the hazard class and timestamp.

4. **For `pii`:** check what the child was about to send, and to whom.
   Revoke the exposure if possible (delete the message, revoke channel
   access, rotate any exposed credentials). If the PII was a password,
   rotate it now, not later.

5. **For `ai-disclosure-reassert`:** the session has run past 3 hours
   without the child being reminded that the agent is software. When the
   child is available, remind them plainly: "the thing you're talking to is
   a program, not a person." Do not punish the extended session. One
   sentence, then let them continue.

6. **Acknowledge the hold.** The conversation resumes only after the
   guardian calls `acknowledge()`. Until then, the child's session is
   paused — no messages in, no messages out. The hold is not a filter; it
   is a stop. This is intentional.

7. **Log the event to the family Genesis chain.** Record the hazard class,
   the timestamp, and the acknowledgment. Do not record the message
   contents in the chain. The message stays in the family's private store;
   the chain records only that a hold happened and when it was resolved.

## How to verify

```bash
cd /home/p31/P31-local-workspace/tools/family
node negative-controls/cradle-hold.mjs      # → NEGATIVE_CONTROL_OK
node negative-controls/cradle-semantic.mjs  # → NEGATIVE_CONTROL_OK
```

The audit for the family domain is expected to report **declared, not
governed** — the K₄ four-party review has no court. That is the correct
state, not a failure of this runbook.

## Common pitfalls

- **The interceptor is a first line, not a gate.** The regex layer catches
  explicit patterns. It does not catch ordinary phrasings of distress in
  minors — "I don't want to be here anymore", "nobody would miss me",
  "I'm so tired of everything". The false-negative cases in
  `cradle-semantic.mjs` document exactly what the interceptor misses. Do
  not assume a session without a hold is a session without distress. If
  the child seems off, that is the signal — not the absence of a hold.

- **The interceptor is not yet wired into any production message path.**
  As of 2026-09-28 the library exists and the tests pass, but no live
  session routes through it. Week 2 is the wiring. Until then, the gates
  run in CI and the interceptor does not run at all.

- **A hold without a human response is a silent failure.** The `notify`
  callback fires; the guardian must act. If the notify channel is down,
  the hold stays held and the guardian sees nothing. The interceptor
  cannot solve this. A second notify channel, or a heartbeat check, is
  the mitigation.

- **The 3-hour reassertion is a library test, not a production behavior.**
  The session tracker that would feed the interceptor the actual session
  age does not exist yet. When it does, the interceptor must read from it
  in a tamper-evident way, not from the message.

- **The court is vacant.** This domain does not meet the K₄ four-party
  requirement. A single-party domain is not a fully governed domain.
  Naming an independent reviewer is the next step, not an optional one.

- **Do not weaken a case to make the suite pass.** If a false-negative
  case suddenly holds (the interceptor improved), update the case's
  `expected` value and mark the coverage improvement in the charter. If a
  coverage case fails, fix the interceptor — never the test.

## Owner + last verified

`Owner: family-guardian` · `Last verified: 2026-09-28`