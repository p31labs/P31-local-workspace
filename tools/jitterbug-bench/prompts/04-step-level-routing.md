# Prompt 4 — Step-Level Model Routing for Agentic Design

**Domain:** AI systems / routing
**Complexity:** (Breadth: High, Nesting: Deep, Exploration: High)

---

Design a pipeline that routes design tasks to different language models
based on each task's capability requirements. The pipeline has four stages:

1. **Intent extraction.** Translate a human request into a structured spec.
2. **Gate judgment.** Evaluate the spec against accessibility rules.
3. **Code generation.** Produce a React component from the spec.
4. **Performance profiling.** Measure the component against a budget.

Research and cite:

- Step-level vs. per-query routing (AgentRouter, ICML 2026).
- The Constraint Tax: why hard schema decoding lowers accuracy while
  raising validity (arXiv:2605.26128).
- Conformal prediction for cascade deferral (arXiv:2607.25018).
- Schema-validation retry with cross-step error accumulation.
- Registry-based generation for design-system compliance (CHI EA '26).

Produce:

- A routing table (stage → tier → model class).
- The escalation rule (when to escalate from a cheap model to a
  frontier model, and when not to).
- The validation contract (schema + semantic checks per stage).
- A negative-rubric section: what a *broken* router looks like
  (routing that never escalates, schemas that accept wrong-valid
  output, cost that explodes without quality gain, raw confidence
  as the deferral rule).