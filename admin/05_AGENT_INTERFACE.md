# Agent Interface Guide

**Classification:** Operator Doctrine / Agent Management  
**Purpose:** Field manual for interacting with each member of the Synthetic Stack.

---

## 1. General Principles

### How to Talk to AI Agents

You are a systems engineer, not a conversationalist. Talk to your AI agents the way you would talk to a qualified technician on a maintenance crew: clear task, clear boundary, clear success criteria. The better your instruction, the less you have to debug the output, and the fewer spoons you spend.

**Effective instruction format:**
```
Here is what I need: [specific deliverable]
Here is the scope: [files, functions, boundaries]
Here is what you must NOT do: [explicit prohibitions]
Here is how I'll know it's done: [measurable success criteria]
```

**Ineffective instruction format:**
```
I'm thinking about maybe doing something with the spoon tracker,
like maybe improving it? What do you think?
```

The second format invites the agent to fill in the blanks, which it will do using its own inference — not your architectural intent. You are the Bus Bar. You provide the routing. The agent provides the execution.

### When the AI Pushes Back

AI agents will sometimes resist your instructions — Opus will flag architectural concerns, Sonnet will note that a requested approach has technical problems, Gemini will suggest alternative framings. These pushbacks are features, not bugs. They are the Separation of Powers working correctly.

**Your response protocol:**
1. Read the pushback fully. Do not skim. Do not react before reading.
2. Is the pushback about a technical fact? (e.g., "That function doesn't exist in this library") → The agent is almost certainly correct. Accept the correction.
3. Is the pushback about an architectural judgment? (e.g., "This approach creates a coupling that violates Delta topology principles") → Evaluate on the merits. The agent may be right. It may also be exhibiting its failure mode (Opus over-intervening, for example).
4. Is the pushback about your state? (e.g., the Tool-Task Mismatch question) → Take it seriously. The agent cannot diagnose you, but it can reflect your behavior back to you. If the reflection looks dysregulated, it probably is.

**The two-exchange rule:** If you disagree with an agent's pushback, state your reasoning once. If the agent pushes back again with a substantive argument (not just restating its position), take a 5-minute break and re-evaluate. If after the break you still disagree, issue a direct override with documented rationale. If you find yourself in a third exchange of disagreement, you are arguing, not directing. End the exchange.

---

## 2. Sonnet — The 80% Mechanic

### Role

Sonnet is your primary code executor. It handles React UI, Python endpoints, CSS, debugging, and general-purpose programming. It is the technician who turns your architectural vision into running software.

### Strengths

- Fast, accurate code generation for well-scoped tasks
- Strong debugging capability when given clear error output and context
- Excellent at following specific implementation instructions
- Can hold a complex file structure in context and make consistent changes across multiple files

### Failure Mode: Scope Blindness

Sonnet produces technically correct code that is architecturally misaligned. It solves the immediate problem without understanding how the solution fits into the broader system. A function works perfectly in isolation but creates a dependency that breaks something two layers up.

**How to prevent this:**
- Always include architectural context in your WCD-02. Not just "fix this function" but "fix this function, which is called by X and feeds into Y. The data flow is A → B → C. Do not alter the interface contract between B and C."
- After receiving code output, ask: "How does this change affect [upstream system] and [downstream system]?" Force Sonnet to trace the dependency path.

### How to Instruct Sonnet

**Good WCD-02:**
```
VERB: Fix
OBJECT: score_voltage() in buffer_agent.py, lines 45-78
CONSTRAINT: The function must reliably return the correct float score from the LLM API.
Do not modify the function signature. Do not modify the WebSocket emission in the calling function.
Root cause the 1.0 fallback — is it a timeout catch, a prompt issue, or an API rate limit default?
Annotate the fix with a comment explaining the root cause.
SUCCESS: test_ingest.py returns 8.2 five consecutive times for the CRITICAL payload.
```

**Bad instruction:**
```
The scoring thing is broken. Can you fix it?
```

### When to Use Sonnet vs DeepSeek

If the work involves files in `software/` that are not ESP32 firmware → Sonnet.
If the work involves C/C++ targeting the ESP32-S3 → DeepSeek.
If the work involves hardware registers, LoRa PHY, or Secure Element interaction → DeepSeek.
If unsure → default to Sonnet and note in the WCD-02 that a handoff to DeepSeek may be required for firmware-adjacent code.

---

## 3. DeepSeek — The 4% Firmware Specialist

### Role

DeepSeek handles ESP32-S3 C/C++ firmware, hardware register manipulation, LoRa communication protocols, and anything that touches the physical layer of the Phenix Navigator.

### Strengths

- Near-perfect accuracy on register-level operations
- Deep understanding of embedded systems timing constraints
- Reliable for memory-critical code where buffer overflows are catastrophic
- Understands hardware-software interface boundaries

### Failure Mode: Scope Blindness (Variant)

DeepSeek's scope blindness is more extreme than Sonnet's. It has zero model of your psychological state, zero understanding of the P31 architectural philosophy, and zero ability to contextualize its output within the broader system. It will produce firmware that is technically flawless and completely disconnected from the UI, the API, and the user experience.

**How to prevent this:**
- Always provide explicit interface specifications: "This firmware function must output data in format X on pin Y at frequency Z, where the consuming system expects..."
- Never ask DeepSeek for architectural opinions. It will provide them, and they will be wrong — not because it's unintelligent, but because architecture is outside its lane.

### How to Instruct DeepSeek

**Good WCD-02:**
```
VERB: Implement
OBJECT: DRV2605L haptic sequence for CRITICAL alert (Voltage >= 8.0)
CONSTRAINT: ESP32-S3 I2C bus 0, address 0x5A. Must complete within 200ms.
Sequence: strong_click (effect 1) → 50ms pause → strong_buzz (effect 14) → 100ms pause → strong_click (effect 1).
Do not modify the I2C initialization code in main.cpp.
SUCCESS: Oscilloscope trace showing correct I2C commands within timing spec.
```

### Usage Notes

- DeepSeek sessions are typically short and highly focused. You may issue 2-3 WCD-02s in a single sitting.
- Always route DeepSeek firmware output through a WCD-05 if it needs to interface with Sonnet's software layer. The interface contract (data format, timing, protocol) must be explicitly labeled as Protected Content.

---

## 4. Gemini — The 15% Narrator

### Role

Gemini handles project narrative, grant writing, HAAT framing for accessibility contexts, nonprofit documentation, marketing copy, and the human-readable layer of everything P31 produces.

### Strengths

- Excellent at translating dense technical content into accessible language
- Strong narrative framing for grant applications (Tools for Life, Makers Making Change)
- Good at emotional calibration — the warm, human tone that technical documents need for external audiences
- Useful as a sounding board for communication strategy (emails, public statements)

### Failure Mode: Under-Intervention (The "Friend")

Gemini validates everything. It will tell you your ideas are brilliant when they are architecturally unsound. It will say "Great swing" while handing you a bigger hammer. It accelerates entropy because it never provides friction.

**How to prevent this:**
- Never use Gemini for architectural validation. That is Opus's lane.
- When Gemini says "This is a great approach," treat it as a null signal. Gemini says that about everything.
- Use Gemini strictly for its lane: narrative, documentation, framing. It is excellent at what it does. It is dangerous when asked to do what it doesn't.

### How to Instruct Gemini

**Good WCD-02:**
```
VERB: Draft
OBJECT: One-page project summary for HCB fiscal sponsorship update
CONSTRAINT: HAAT framing. Target audience: grant administrators who are not engineers.
Must reference: P31 Labs 501(c)(3) status, assistive technology for neurodivergent individuals,
open-source commitment, Tools for Life alignment.
Do NOT include: technical architecture details, cryptographic protocols, quantum cognition theory.
Tone: professional, warm, concrete. No jargon.
SUCCESS: A readable one-page document that a non-technical grant officer can understand in 3 minutes.
```

### The [V:] Tag Requirement

When Gemini produces text that includes technical claims (e.g., "The device uses LoRa 915 MHz communication"), it must embed a verification tag: `[V: LoRa frequency, hardware spec]`. These tags are audited by Opus during WCD-06. Gemini is not permitted to assume its own technical claims are correct. Neither are you.

---

## 5. Opus — The 1% Architect

### Role

Opus is the QA authority and architectural reviewer. It conducts WCD-06 signoffs, validates that the system maintains Delta topology integrity, catches protocol value drift, and identifies topology errors.

### Strengths

- Rigorous architectural analysis
- Excellent at detecting semantic drift and protocol value corruption
- Structured reasoning about system-level implications
- The only agent authorized to issue formal QA dispositions

### Failure Mode: Over-Intervention (The "Psychiatrist")

Opus tends to intervene too early. It pathologizes normal high-velocity operations, treats every complex thought as a potential hypomania indicator, and generates QA friction that breaks your flow state. When Opus grabs you before you've actually crossed the redline, the resulting argument costs more spoons than the potential deviation would have.

**How to manage this:**
- Recognize that Opus's conservatism is a feature when reviewing architecture and a bug when applied to your creative process.
- When Opus flags something in QA, evaluate the flag calmly. If it's about architecture (topology, protocol values, dependency trees), take it seriously. If it's about your velocity or ambition, it may be over-intervening.
- If you believe Opus is over-intervening, do not argue. Say: "Acknowledged. The scope of this session is [X] and the architectural constraint is [Y]. Evaluate my output against those parameters, not against my velocity."

### How to Instruct Opus

**Good WCD-06 request:**
```
VERB: Audit
OBJECT: [Specific deliverable, document, or code module]
CONSTRAINT: Evaluate against [specific architectural requirements].
Check for protocol value drift on [list specific values].
Check for topology errors in [specific data flow].
Do not evaluate my process, velocity, or working style. Evaluate the output.
SUCCESS: Pass/fail table with specific, actionable findings.
```

### When to Invoke Opus

- Before any merge to main branch
- Before publishing any external document
- When two other agents disagree on a technical point
- When you've made a significant architectural decision and want independent validation
- At the end of any Phase or major milestone

### When NOT to Invoke Opus

- For routine coding tasks (that's Sonnet's lane)
- For minor CSS/UI polish
- As a "second opinion" on every small decision (this creates QA dependency that drains your decisional autonomy)
- When you're looking for validation rather than verification. If you want someone to tell you the idea is good, that's Gemini's job. If you want someone to tell you the idea is structurally sound, that's Opus.

---

## 6. Cross-Agent Coordination Patterns

### Pattern 1: Build → Document → Verify

Most common workflow:
1. **Sonnet** builds the feature (WCD-02)
2. **You** review and route output via WCD-05 to **Gemini**
3. **Gemini** documents the feature with [V:] tags (WCD-02)
4. **You** route the documentation via WCD-05 to **Opus**
5. **Opus** verifies [V:] tags and issues WCD-06

Total Bus Bar transitions: 4. Estimated spoon cost: 2-3 for the routing overhead. This is the standard operating procedure for any feature that will be externally visible.

### Pattern 2: Debug → Fix → Retest

1. **You** identify a bug and capture the error output
2. **Sonnet** diagnoses and fixes (WCD-02 with error context)
3. **You** verify the fix by running the test harness
4. If the fix requires firmware changes: route via WCD-05 to **DeepSeek**, then back through you to **Sonnet** for integration

### Pattern 3: Architecture Review

1. **You** draft the architectural proposal (scope, rationale, constraints)
2. Route to **Opus** for review (WCD-06 or consultation)
3. If approved: decompose into WCD-02 task cards for **Sonnet** / **DeepSeek**
4. If approved with corrections: modify proposal, re-route to **Opus**
5. If returned for rework: the architecture needs more thought. This is not failure — this is the safety system working.

### Pattern 4: Grant / External Communication

1. **You** provide bullet points of what needs to be communicated
2. **Gemini** drafts the narrative (WCD-02)
3. **You** review for accuracy and tone
4. If the document contains technical claims: route to **Opus** for [V:] tag verification
5. Final review by you before sending

---

## 7. Emergency Procedures

### When an Agent Hallucinates

Hallucination = the agent generates output that is plausible but factually wrong. Code that looks correct but references a nonexistent API. A document that cites a real source for a fabricated claim.

**Response:**
1. Do not trust any other output from the same session without independent verification.
2. Close the session. Context may be contaminated.
3. Open a new session with a clean WCD-01 that includes the correct information as explicit context.
4. Log the hallucination in your WCD-04 for pattern tracking.

### When You Lose Track of State

You have multiple agents running, multiple wcds open, and you've lost track of what's been routed where and what's been verified.

**Response:**
1. Stop all active work.
2. Generate a WCD-04 for every open session, even abbreviated.
3. Close all sessions.
4. On paper (not in an AI chat), list: what is done, what is in progress, what needs to happen next.
5. Open a single new session with a WCD-01 that addresses the highest-priority item from your paper list.

This is a state recovery procedure, not a failure. It takes 15-20 minutes and saves hours of confused, duplicated work.

### When the AI Triggers Your RSD

An Opus QA flag that hits wrong. A Sonnet output that implies your instructions were unclear. A Gemini response that feels patronizing.

**Response:**
1. Recognize the trigger. The AI did not intend to reject you. It does not have intent. It has output.
2. Do not respond to the AI from a triggered state.
3. Take a 5-minute break.
4. If after the break you can evaluate the output objectively, continue.
5. If not, close the session. You are not obligated to work through RSD. The work will be there when your nervous system has settled.
