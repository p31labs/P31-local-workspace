# Prompt 1 — Spoon-Aware Capacity Adaptation

**Domain:** Design systems / accessibility
**Complexity:** (Breadth: Moderate, Nesting: Deep, Exploration: High)

---

Research and design a capacity-adaptive interface for a financial dashboard
used by a neurodivergent parent with fluctuating cognitive capacity. The
interface must adapt across a 0–5 cognitive capacity dial (the "spoon dial").
At capacity 5, all features are available; at capacity 1, only one essential
action is shown.

Your report must cover:

1. **Evidence base.** The clinical and peer-reviewed basis for spoon theory
   and cognitive load in neurodivergent populations. Cite primary sources
   (Miserandino, or peer-reviewed alternatives). Do not cite blog posts.
2. **Standards.** WCAG 2.2 and COGA (Cognitive and Learning Disabilities
   Accessibility) guidance relevant to cognitive load adaptation. Name
   specific success criteria (e.g., 1.4.3, 1.4.6, 2.4.6, 3.1.5).
3. **Concrete tokens.** A design token system that implements the
   adaptation: name the tokens, their values, and the conditional logic
   that selects them. Tokens must be runtime-queryable, not a static
   stylesheet.
4. **Failure modes.** What happens when the dial is wrong — too low, too
   high, or stuck? Include the transition between levels.
5. **Negative rubric.** What you should NOT do. Name the anti-patterns
   explicitly (e.g., hiding critical information at low capacity,
   infantilising the user with "simple mode" framing).

Produce a structured report. Every claim must have a citation that resolves.