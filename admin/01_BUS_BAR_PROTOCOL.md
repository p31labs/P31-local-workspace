# The Bus Bar Protocol

**Classification:** Operator Doctrine / Routing & Authority  
**Revision Authority:** Operator + Opus (QA)

---

## 1. What the Bus Bar Is

In a polyphase electrical distribution system, the bus bar is the central metallic conductor that receives power from multiple incoming feeders and routes it to multiple outgoing circuits. It does not generate power. It does not consume power. It **conducts, distributes, and isolates.**

You are the Bus Bar of the Digital Centaur. Every piece of data, every instruction, every context transfer between AI agents routes through you. This is not a bureaucratic bottleneck. It is a structural safety requirement. Without centralized routing through a sovereign biological observer, the following failure modes become inevitable:

- **Cascading hallucination:** Agent A generates output containing a subtle error. Agent B receives it as ground truth and builds on it. Agent C validates the compounded error because it is now embedded in two sources. By the time you see the result, the error is load-bearing.
- **Context poisoning:** An agent operating outside its lane (Gemini making architectural decisions, Opus writing CSS) injects semantically plausible but architecturally wrong content into the project. Without your review at the routing point, it propagates.
- **Accountability dissolution:** If agents communicate directly, you lose the ability to trace which agent introduced which change. When something breaks, you cannot isolate the fault. You are debugging in the dark.

### What the Bus Bar Does NOT Do

The Bus Bar does not execute code. The Bus Bar does not write firmware. The Bus Bar does not generate narrative copy. The Bus Bar does not do QA. Those are agent functions. The moment you reach past the bus bar and start doing an agent's job, you have committed a **Tool-Task Mismatch** — you are using yourself as the tool when the task calls for a specialized agent.

---

## 2. Routing Rules

### Rule 1: No Direct Agent-to-Agent Communication

All data transfer between AI agents passes through you. There are no exceptions. If Sonnet generates code that Gemini needs to reference for a grant narrative, you copy the relevant output from the Sonnet session, review it for accuracy, and paste it into the Gemini session via a WCD-05 (Sister Shop Instruction Card) that specifies what Gemini may and may not alter.

**Why this matters for you specifically:** Your AuDHD brain craves efficiency. The impulse to "just let them talk to each other" or to skip the WCD-05 because "it's obvious what needs to happen" is a dopamine-seeking shortcut. It feels like you are saving spoons. You are spending them. Every shortcut through the Bus Bar protocol creates an unverified data path that you will have to debug later at 10x the cognitive cost.

### Rule 2: Context Is Perishable — Label Everything

When you route data between agents, you must label it. At minimum:

- **Source:** Which agent generated this output, in which session, under which WCD.
- **Protected Content:** What the receiving agent is forbidden from modifying.
- **Missing Context:** What the originating agent did not know that the receiving agent needs.

Unlabeled data transfers are the cognitive equivalent of unmarked pipes in a submarine engine room. They work fine until a casualty, at which point nobody knows what's flowing where.

### Rule 3: You Are the Ground Truth Arbiter

When two agents disagree — Opus says the architecture requires X, Sonnet says the code requires Y — **you** resolve the conflict. You do not ask one agent to evaluate the other's output directly. You read both positions, apply your cross-domain pattern recognition, and issue a ruling. This is your Ontological Security function: you are the final arbiter of what is real.

If you cannot resolve the conflict because you lack the technical depth, you escalate by requesting clarification from the appropriate specialist agent with explicit scope boundaries. You do not ask Opus to "review Sonnet's code." You ask Opus: "Given architectural constraint X, is implementation approach Y compliant?" Binary question, bounded scope.

### Rule 4: Log the Route

Every significant data transfer gets recorded. At minimum, the WCD-04 (Shift Report) at end of session must include which agents were active, what data flowed between them, and what decisions you made at the routing points. This is your OQE that the Bus Bar protocol was followed.

---

## 3. Lane Discipline: Who Does What

### Your Lanes (Tagged IN)

| Function | Description | When to Exercise |
|----------|-------------|-----------------|
| **Strategic Direction** | Deciding what gets built, in what order, and why. Setting scope for every WCD-01. | Every session start, every scope change. |
| **Architectural Arbitration** | Resolving conflicts between agents. Accepting or rejecting proposed deviations (DFS). | When agents disagree, when output doesn't match your mental model. |
| **Context Routing** | Transferring data between agents with proper labeling and protection. | Every inter-agent handoff. |
| **Self-Assessment** | Honestly evaluating your metabolic state, spoon count, and proximity to Red Board. | Pre-shift, mid-shift, and whenever prompted by WCD-03. |
| **Scope Control** | Saying "no" to feature creep, rabbit holes, and "just one more thing." | Constantly. This is your hardest job. |

### Your Lanes (Tagged OUT)

| Function | Why You're Tagged Out | What to Do Instead |
|----------|----------------------|-------------------|
| **Writing production code** | You are the Bus Bar, not the circuit. Writing code while simultaneously routing between agents creates a feedback loop where you are both generating and validating your own output. | Issue a WCD-02 to Sonnet with specific verb, object, constraint. |
| **Writing firmware** | Same principle. Additionally, ESP32 register-level work requires the sustained single-threaded focus that DeepSeek provides without context-switching cost. | Issue a WCD-02 to DeepSeek. |
| **Writing grant narratives** | Your AuDHD communication style is technically dense and structurally complex. Grant reviewers need HAAT framing and accessible language. Gemini's "Friend" failure mode is actually an asset here — warm, validating prose is what grant committees want. | Issue a WCD-05 routing technical specs to Gemini with protected content labels. |
| **Doing QA on your own work** | Self-review is not OQE. The SUBSAFE program exists because craftsmen cannot objectively verify their own welds. Neither can you objectively verify your own architecture. | Request WCD-06 from Opus. |
| **Debugging for more than 30 minutes** | After 30 minutes of debugging without progress, your cognitive state has shifted from systematic troubleshooting to frustrated thrashing. You are now spending spoons on emotional regulation, not problem-solving. | Issue a WCD-02 to Sonnet with the error output and context. Step away. |

---

## 4. The Routing Decision Tree

When new work arrives (an idea, a bug report, a legal filing, an email), route it through this decision tree:

```
Is this actionable right now?
├── NO → Log it in your task queue. Do not open a new AI session.
└── YES
    ├── Does it require code? → Sonnet (WCD-02)
    ├── Does it require firmware? → DeepSeek (WCD-02)
    ├── Does it require narrative/documentation? → Gemini (WCD-02)
    ├── Does it require architectural review? → Opus (WCD-06 or consultation)
    ├── Does it require multiple agents? → WCD-01 (Pre-Job Brief) first, then route sequentially via WCD-05
    └── Does it require YOU personally?
        ├── Is it a strategic decision? → Make it. Log it.
        ├── Is it a legal filing? → Assess spoon cost FIRST. Downgrade budget if needed.
        ├── Is it a parenting task? → Close the laptop. This takes absolute priority.
        └── Is it "I'll just quickly do it myself"? → STOP. That is a Tool-Task Mismatch.
```

---

## 5. Common Bus Bar Failures

These are the ways you, specifically, tend to violate the Bus Bar protocol. They are listed here because recognizing them in the moment is the only way to prevent cascading failures.

### Failure 1: "I'll Just Quickly Fix This Myself"

**Pattern:** You see a bug, a typo, or a minor code issue. Instead of issuing a WCD-02 to Sonnet, you open the file and start editing directly. Twenty minutes later, you've refactored three functions, broken two tests, and lost track of your original task.

**Why it happens:** Dopamine. Fixing things provides immediate reward. The WCD-02 process has a delay (cognitive initiation cost of writing the task card, waiting for agent output). Your ADHD brain routes around the delay toward the immediate fix.

**Intervention:** If you catch yourself with your hands on production code, ask: "Am I the Bus Bar right now, or am I the circuit?" If the answer is "circuit," put the file down and write the WCD-02.

### Failure 2: Skipping the WCD-05

**Pattern:** Sonnet produces output that Gemini needs. Instead of writing a WCD-05 with source labels, protected content, and missing context, you copy-paste the raw output into Gemini's session with "here's what Sonnet wrote, use this."

**Why it happens:** The WCD-05 feels like overhead. The output is "obvious." You "don't have time."

**Consequence:** Gemini interprets Sonnet's output through its own context, which is incomplete. It modifies something that should have been protected. You don't notice until three sessions later when the architecture is misaligned and you can't figure out where the drift started.

### Failure 3: Arguing With the AI

**Pattern:** Opus flags something in QA review. Instead of evaluating the flag on its merits, you enter into a multi-turn debate about whether Opus is "over-intervening" or "pathologizing" your velocity. The debate consumes 15 exchanges and 45 minutes. The original work item is untouched.

**Why it happens:** RSD. Opus's QA flags feel like rejection of your work. Your nervous system interprets "Approved with Corrections" as "failure." The debate is not about the technical merits — it is about defending your sense of competence.

**Intervention:** When you feel the urge to argue with a QA flag for more than two exchanges, stop. Write down the flag. Close the session. Come back in 30 minutes. If the flag is wrong, it will still be wrong in 30 minutes and you can address it calmly. If the flag is right, you've saved yourself an hour of emotional labor.

### Failure 4: Running Multiple Agents Simultaneously

**Pattern:** You have Sonnet open in one tab, Gemini in another, DeepSeek in a third. You're context-switching between them every few minutes, routing data in your head without WCD-05 documentation.

**Why it happens:** It feels productive. Multiple streams of output are flowing. You're the Bus Bar and all the circuits are lit up.

**Consequence:** Your working memory is the bottleneck. Holding three agent contexts simultaneously costs 6-8 spoons per hour. Within 90 minutes, you're running on fumes. Within 2 hours, you're making routing errors — sending the wrong context to the wrong agent, forgetting what you told Sonnet three exchanges ago, losing track of which version of a file is current.

**Rule:** Maximum two agent sessions open simultaneously. One active, one reference. Route sequentially, not in parallel.

### Failure 5: The 2 AM Session

**Pattern:** The kids are asleep. The house is quiet. Your brain is firing on all cylinders. This is the best coding time. You open a Full-budget WCD-01 at 11 PM.

**Reality:** Your calcium levels are at their daily nadir. Your sleep debt is accumulating. Your subjective sense of clarity is being driven by hypomania, not by genuine high-capacity function. The code you write at 2 AM will need to be debugged at 10 AM, and the debugging will cost more spoons than the original coding saved.

**Rule:** No new WCD-01 sessions after 10 PM. If you are already in a session, WCD-03 triggers automatically at 10 PM with a hard Spoon Estimate. If you are below 6 spoons, the session ends. No exceptions. Sleep is reactor coolant.
