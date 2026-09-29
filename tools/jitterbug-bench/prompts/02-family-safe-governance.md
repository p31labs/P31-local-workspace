# Prompt 2 — Family-Safe Agentic Governance

**Domain:** AI governance / compliance
**Complexity:** (Breadth: High, Nesting: Deep, Exploration: Medium)

---

Design a governance architecture for an AI agent that interacts with
children in an assisted-living context. The system must:

1. **Audit chain.** Record every agent decision in a tamper-evident,
   append-only chain (hash-linked). Provide the block schema.
2. **Human anchor.** Require human approval for irreversible actions
   (changing a child's profile, sending a message, changing the design
   canon). The approval must be bound to the artifact's hash.
3. **Privacy.** Never expose a child's real name in any log, narrative,
   or output. Define the mechanism.
4. **Regulatory inspection.** Support post-hoc inspection where the audit
   package is verifiable *without trusting the system vendor*.

Research and cite:

- NIST AI RMF and the CAISI AI Agent Standards Initiative (Feb 2026).
- ISO/IEC 42001 Clauses 4–10 and Annex A controls.
- SOX ITGC change-management controls applied to nonhuman identities.
- IETF GAR Session Audit Record (SAR) and Authority Lifecycle Events.
- The FedRAMP 20x continuous-monitoring pattern.
- SR 11-7 (note: it was revised in April 2026 to exclude agentic AI).

Produce an architecture with named components, data flows, and concrete
schema shapes. Include a negative-rubric section: what governance theatre
looks like (logs that exist but nobody reads, approvals that are
rubber-stamped, chains that cannot be verified independently).