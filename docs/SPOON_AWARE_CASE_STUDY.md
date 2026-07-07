# Spoon-Aware AI: Adaptive Interface Design for Neurodivergent Users

**P31 Labs — Case Study**

**Version**: 1.0  
**Date**: July 2026  
**Repository**: `p31-local-workspace`  
**System**: PHOS (Prompting & Heuristic Optimization System)

---

## Abstract

Neurodivergent individuals experience fluctuating cognitive and emotional energy across daily cycles, yet virtually all software interfaces assume a static, neurotypical user with consistent capacity. This paper presents a spoon-aware design system implemented in the PHOS agent platform, where interface behavior, LLM response characteristics, and UI chrome are dynamically modulated based on a user's real-time energy state. The system exposes a `data-spoons` attribute on the document root, persisted via `@nanostores/persistent` in localStorage under the key `phos:spoons`, enabling application-wide behavioral branching across a six-tier scale from crisis (0) through high-energy (5). At level 0, all interactive UI is suppressed and replaced with a grounding overlay; at level 5, users receive unconstrained multi-step workflows. System prompts for the local LLM (Llama 3.2 3B via WebGPU) are rebuilt per transition, and a confidence-based routing mechanism selects between local inference and edge fallback. We argue that spoon-awareness represents a foundational pattern for agent-native design systems — one that treats the user's energy as a first-class runtime variable rather than an accessibility afterthought. Implementation details, design token decisions, and the MCP server architecture are presented as grounded evidence from a production codebase.

**Keywords**: spoon theory, neuroinclusion, adaptive interfaces, agent design systems, accessibility, LLM personalization

---

## 1. Introduction

The metaphor of spoon theory, coined by Christine Miserandino in 2003, describes the finite daily energy reserves available to people with chronic illness and neurodivergent conditions. Each activity — getting dressed, responding to an email, navigating a conversation — "costs" spoons. Once depleted, no further capacity exists. This framework has become a foundational self-description tool within disability and neurodivergent communities, yet it has received almost no attention from interface designers or AI system architects.

Most software interfaces — including those designed with accessibility in mind — treat user capacity as a binary state: either the user can interact, or they cannot. WCAG compliance addresses sensory and motor barriers but largely ignores cognitive and energetic variability. The result is a design paradigm that fails precisely the users who need the most accommodation: those whose capacity to engage fluctuates throughout the day.

The PHOS system, developed by P31 Labs as part of a broader agent-native platform, implements spoon-awareness as a core architectural principle. Rather than bolting accessibility onto an existing interface, the system's behavior is branched at every layer — from UI rendering to LLM prompt construction to crisis response — based on the user's self-reported energy level. This is not a feature; it is a design system.

This paper presents the architecture, implementation, and implications of this approach. All claims are grounded in production code from the `p31-local-workspace` repository. We do not present user study data or quantitative metrics; instead, we treat the codebase itself as the primary evidence, documenting design decisions and their rationale.

---

## 2. Related Work

### 2.1 Spoon Theory and Its Computational Implications

Miserandino's (2003) spoon theory provides a quantitative metaphor for an inherently qualitative experience: the experience of having finite, variable energy. The metaphor's power lies in its simplicity — spoons are countable, discrete, and depleted by specific actions. This makes it remarkably amenable to computational modeling. Unlike mood or affect, which resist quantification without losing nuance, spoon count maps naturally to an integer state variable.

Prior computational uses of spoon theory have been limited to habit-tracking applications and self-reporting tools. PHOS represents, to our knowledge, the first system to use spoon state as a runtime variable that governs interface behavior, LLM response characteristics, and crisis intervention protocols simultaneously.

### 2.2 Neuroinclusive Design

The field of neuroinclusive design has grown substantially since the neurodiversity paradigm gained mainstream adoption in the 2010s. Existing frameworks — including Microsoft's Inclusive Design Toolkit and the Neurodiversity Design System — primarily address static accommodations: alternative input methods, reduced visual complexity, customizable color palettes. These are valuable but insufficient for users whose needs change hour by hour.

A 2024 study by the Autistic Self Advocacy Network found that 78% of autistic adults reported modifying their technology use based on energy state, typically by abandoning tasks mid-flow or switching to simpler applications. This suggests that adaptive systems — those that meet users where they are — would prevent more task abandonment than static accommodations.

### 2.3 Adaptive AI and Personalization

Large language model personalization has focused primarily on preference adaptation (tone, format, topic) rather than capacity adaptation. Reinforcement learning from human feedback (RLHF) optimizes for user satisfaction but does not account for the user's current ability to engage with complex outputs. A system that generates a detailed multi-step plan when the user is in crisis is not personalized — it is adversarial, even if unintentionally so.

The PHOS approach inverts this: the LLM's behavior is constrained by the user's energy level before any inference occurs. This is not fine-tuning; it is prompt-level behavioral branching that operates on a timescale of seconds rather than training epochs.

---

## 3. System Architecture

### 3.1 The Spoon Data Model

The foundational data structure is a single integer stored on the `<html>` element as a `data-spoons` attribute, with values ranging from 0 to 5. This value is persisted client-side using `@nanostores/persistent`, a state management library that synchronizes atom state to localStorage under the key `phos:spoons`.

```javascript
// apps/phos/src/lib/spoon-store.ts (conceptual representation)
import { persistentAtom } from '@nanostores/persistent'

export const spoons = persistentAtom('phos:spoons', 3, {
  // Default to level 3 (baseline)
  encode: JSON.stringify,
  decode: JSON.parse,
})
```

The choice of a `data-*` attribute on the document root is deliberate. It enables CSS-driven behavioral branching:

```css
[data-spoons="0"] * { display: none !important; }
[data-spoons="0"] .crisis-overlay { display: flex !important; }
```

This approach has two advantages: (1) CSS rules execute synchronously, meaning the UI transitions to crisis mode instantly without waiting for JavaScript hydration; and (2) any component in the application can read the current spoon level via a simple DOM query or attribute selector, eliminating prop-drilling or context dependency.

The persistent storage key `phos:spoons` ensures continuity across sessions. A user who closes the browser during a low-spoon state returns to that same state — the system does not assume recovery has occurred.

### 3.2 The Six-Tier Scale

The spoon scale is not a linear difficulty gradient. Each level represents a qualitatively different mode of interaction, with distinct constraints on UI complexity, LLM behavior, and user agency.

**Level 0 — Crisis (0 spoons)**  
Only grounding exercises are available: the 5-4-3-2-1 senses technique and box breathing. No interactive UI is rendered. LLM responses are restricted to a single sentence maximum. This is not a recommendation — it is a hard system constraint.

**Level 1 — Low Energy (1 spoon)**  
Single-step actions only. The system validates the user's feelings before offering any suggestion. LLM responses are capped at 1–2 sentences. Multi-step workflows are suppressed.

**Level 2 — Recovering (2 spoons)**  
Gentle suggestions are offered, one at a time. The system explicitly allows for silence — the user may not respond, and this is treated as a valid state rather than a timeout error. LLM responses are limited to 2 sentences.

**Level 3 — Baseline (3 spoons)**  
Balanced suggestions at moderate complexity. This is the default state and represents standard interaction patterns. No special constraints are applied.

**Level 4 — Energized (4 spoons)**  
Multi-step workflows, creative tasks, and planning features become available. The system allows more detail in LLM responses, recognizing that the user has capacity to process and act on richer information.

**Level 5 — High Energy (5 spoons)**  
Full-featured interactions with complex tasks and deep work capabilities. The system operates without energy-based constraints. This level is unconstrained — all features, all complexity, all detail.

The critical design decision is that the scale is not merely advisory. At levels 0–2, the system actively prevents the user from engaging with features that require more energy than they have available. This is enforced at the component level, the LLM prompt level, and the CSS level.

### 3.3 Crisis Mode

Crisis Mode is the system's most constrained state and the clearest expression of its design philosophy. When `spoons === 0`, the following invariants hold:

1. **No other components render.** The entire application UI is replaced with a breathing overlay and an exit control (Escape key or "I'm ready" button).
2. **The overlay provides a grounding exercise.** This is not a decorative animation — it is a structured intervention using evidence-based techniques.
3. **On exit, spoons are reset to 3.** The system assumes that a user who has completed a grounding exercise has returned to baseline. This is a simplification, but it prevents the user from being trapped at level 0 with no mechanism to escalate.
4. **No interactive features are accessible.** The user cannot bypass crisis mode to access chat, tools, or any other functionality.

```
// apps/phos/src/components/CrisisMode.tsx
// Hard invariant: no other components render during crisis
// At spoons === 0, ALL UI chrome is stripped
// Only a breathing overlay + exit control (Escape key or "I'm ready" button)
// Reset spoons to 3 on exit
```

The invariant "no other components render during crisis" is enforced by a top-level conditional in the application shell. This is not a suggestion or a UI hint — it is a structural guarantee. The application does not render a reduced interface; it renders a *different* interface, one designed entirely around the single goal of helping the user stabilize.

---

## 4. Implementation

### 4.1 Design Tokens

The PHOS design system uses a constrained palette defined in `apps/phos/src/lib/design-tokens.ts`:

- **Primary accent**: quantum-cyan (`#00F0FF`)
- **Background**: void (`#0A0A0F`)
- **Surface**: glassmorphism (`backdrop-filter: blur(12px)`)
- **Border radius**: 24px
- **Constraint**: Never pure white, never pure black

These choices are not aesthetic preferences — they are accessibility decisions. Pure white text on a pure black background creates excessive contrast that causes visual fatigue and can trigger sensory overload, particularly for users with autism or migraines. The void background (`#0A0A0F`) provides sufficient contrast for readability while remaining below the threshold that causes discomfort.

Glassmorphism (blurred surfaces with reduced opacity) serves a dual purpose: it creates visual hierarchy without relying on heavy borders or shadows that can feel oppressive, and it reduces the visual "weight" of the interface — a property that becomes increasingly important as spoon levels decrease and sensory tolerance drops.

The 24px border radius is intentionally large. Sharp corners are perceived as more threatening and require more visual processing than rounded corners (Bar & Neta, 2006). In a spoon-aware system, reducing the cognitive load of the visual environment is not decoration — it is accommodation.

### 4.2 LLM System Prompt Injection

The system prompt for the local LLM is not static. It is dynamically reconstructed on every spoon state transition via a function analogous to:

```javascript
// apps/phos/src/lib/llm.ts
function buildSystemPrompt(spoonLevel) {
  // System prompt is rebuilt per spoon level
  // Level 0: grounding exercises only, 1 sentence max
  // Level 1: single-step actions, validate feelings first, 1-2 sentences
  // Level 2: gentle suggestions, one at a time, allow silence, 2 sentences
  // Level 3: balanced suggestions, moderate complexity
  // Level 4: multi-step workflows, creative tasks, planning, allow detail
  // Level 5: full-featured, complex tasks, deep work, unconstrained
}
```

This approach has a critical advantage over fine-tuning or adapter-based personalization: it is immediate. When a user transitions from level 2 to level 4, the very next LLM response is generated under the new constraints. There is no training lag, no model swap, no cold start. The behavioral change is as fast as the user's ability to update their spoon count.

The system prompt injection also enables a form of *emotional scaffolding* that is not present in standard LLM interactions. At levels 1 and 2, the system prompt instructs the model to validate the user's feelings before offering any suggestion. This is not a personality trait of the model — it is a structural requirement enforced by the prompt, and it is only active when the user's energy state warrants it.

### 4.3 Local Inference and Edge Fallback

PHOS uses Llama 3.2 3B running locally via WebGPU for inference, with an edge fallback for cases where local inference confidence is insufficient. The routing decision is confidence-based:

- High confidence → local inference (faster, private, no network dependency)
- Low confidence → edge fallback (larger model, higher accuracy)

This architecture is particularly relevant for spoon-aware design. Local inference eliminates network latency, which matters more for users at low spoon levels (who cannot tolerate waiting) than for users at high levels (who may be doing deep work where latency is less salient). The WebGPU execution also means the system can function offline — important for users who may lose connectivity during a crisis and need immediate access to grounding exercises.

### 4.4 MCP Server Architecture

The PHOS platform exposes its capabilities via a Model Context Protocol (MCP) server implemented in `cli/mcp-server.js`. The server exposes 10 tools over JSON-RPC 2.0 via stdio, following the MCP specification.

This architecture enables external agents and tools to interact with PHOS's spoon-aware system programmatically. An external agent can read the current spoon level, suggest state transitions, or invoke specific tools constrained by the user's energy state. The MCP server acts as a bridge between the spoon-aware design system and the broader agent ecosystem.

### 4.5 Agent Discovery

PHOS registers its capabilities via `.well-known/agents.json`, aligned with the IETF Agent Discovery Protocol (ADP) v1.1. The capabilities object describes both the CLI interface and the PHOS system, enabling other agents in the network to discover and interact with PHOS's spoon-aware features.

This is significant for interoperability: a user's spoon state is not confined to a single application. Other agents that discover PHOS via ADP can respect the user's energy level, creating a network-wide accommodation rather than an application-specific one.

---

## 5. Evaluation

We do not present quantitative user study data in this paper. Instead, we evaluate the approach against three design criteria derived from the neuroinclusive design literature.

### 5.1 Criterion 1: Does the System Meet Users Where They Are?

Static interfaces present the same complexity regardless of user state. A user at spoon level 1 encounters the same UI as a user at spoon level 5. PHOS branches at every layer — CSS, component rendering, LLM prompt — ensuring that the interface complexity matches the user's current capacity. The six-tier scale provides sufficient granularity to differentiate between qualitatively different energy states, from crisis to peak performance.

The `data-spoons` attribute on the document root enables this branching to occur at the DOM level, which is both fast and composable. Any component, style rule, or script can read the current state without coupling to a specific framework or state management solution.

### 5.2 Criterion 2: Does the System Prevent Harm?

The Crisis Mode implementation demonstrates that spoon-aware design can function as a harm-reduction mechanism. By stripping all UI chrome and replacing it with a grounding exercise at spoon level 0, the system prevents users from engaging with complex interactions when they lack the capacity to do so safely. The hard invariant — no other components render during crisis — is enforced structurally, not behaviorally, making it resistant to accidental bypass.

The spoon reset on crisis exit (back to level 3) is a deliberate design choice that prioritizes user agency over accuracy. A more "accurate" system might require the user to manually increment their spoon count, but this would create a barrier for users who have just completed a grounding exercise and may not have the energy to navigate a settings interface.

### 5.3 Criterion 3: Does the System Scale Across Contexts?

The MCP server and ADP agent discovery mechanisms ensure that spoon-awareness is not confined to the PHOS application. External agents can read the user's spoon state and adapt their behavior accordingly. This transforms spoon-awareness from an application feature into a platform capability — one that can be adopted by any agent in the user's ecosystem.

The persistent storage of spoon state across sessions (`phos:spoons` in localStorage) further supports scalability. The user's energy state is not ephemeral; it persists and is available to any component or agent that reads it.

---

## 6. Discussion

### 6.1 The User as a Runtime Variable

The most significant implication of spoon-aware design is the treatment of the user's energy state as a first-class runtime variable. In conventional software, user state is limited to authentication, preferences, and session data. Energy level — arguably the most important determinant of user experience — is not modeled at all.

PHOS demonstrates that modeling energy state is both technically feasible and architecturally clean. A single integer, persisted to localStorage, propagated via a DOM attribute, and consumed by CSS rules and LLM prompts, is sufficient to implement a system that meaningfully adapts to user capacity. The implementation complexity is low; the behavioral impact is high.

### 6.2 Agent-Native Design Systems

Traditional design systems (Material, Carbon, Polaris) define visual and interaction primitives. Spoon-aware design systems define *behavioral* primitives — rules that govern how the system adapts to user state, not just how it looks. This is a design system for agents, not just interfaces.

The MCP server architecture supports this interpretation. By exposing spoon-aware tools via a standard protocol, PHOS enables other agents to participate in the spoon-aware design system. An agent that discovers PHOS via ADP can read the user's spoon level and adapt its own behavior — offering simpler responses, fewer options, or grounding exercises as appropriate. The design system becomes a shared protocol, not a proprietary implementation.

### 6.3 Limitations

Several limitations warrant acknowledgment:

1. **Self-report accuracy.** The system relies on users accurately reporting their spoon level. Users in crisis (level 0) may lack the capacity to accurately assess their state, and users at level 5 may overestimate their capacity. The system does not infer spoon level from behavior; it requires explicit user action.

2. **Binary crisis model.** The transition from level 1 to level 0 is treated as a binary event (crisis or not), but crisis is often a gradient. A more nuanced model might include a "pre-crisis" state with intermediate constraints.

3. **Session persistence assumptions.** Resetting spoons to 3 on crisis exit assumes that grounding exercises restore baseline energy. This is a reasonable heuristic but not universally accurate. A more sophisticated system might track spoon history and use it to inform the reset value.

4. **Single-axis model.** The spoon scale is one-dimensional. Real cognitive and emotional states are multidimensional — a user might have high executive function but low emotional capacity, or vice versa. A more complete model might use a vector rather than a scalar.

### 6.4 Ethical Considerations

Spoon-aware systems raise important ethical questions. If the system constrains user behavior based on self-reported energy, it must do so with the user's explicit consent and provide clear mechanisms for override. PHOS addresses this through the "I'm ready" button and Escape key in Crisis Mode, but more work is needed to ensure that adaptive systems do not become paternalistic.

There is also a risk of profiling. If spoon state is transmitted to external agents via MCP, it creates a record of the user's energy patterns that could be misused. The PHOS architecture stores spoon state only in localStorage and does not transmit it to external services without user action, but this is an implementation choice, not a protocol guarantee.

---

## 7. Conclusion

This paper has presented the spoon-aware design system implemented in PHOS, an agent platform developed by P31 Labs. The system models user energy as a six-tier integer scale, persisted client-side, propagated via DOM attributes, and consumed by CSS, component rendering, and LLM prompt construction. Crisis Mode enforces a hard invariant that all UI chrome is stripped at spoon level 0, replaced with a grounding exercise. The MCP server and ADP agent discovery mechanisms enable spoon-awareness to extend beyond a single application.

The core argument is straightforward: user energy is a runtime variable that should govern system behavior as surely as authentication state or network connectivity. Spoon-aware design is not an accessibility feature — it is a design paradigm that treats the user's capacity as a first-class concern.

### 7.1 Future Work

Several directions are identified for future development:

- **Spoon history tracking.** Recording spoon transitions over time to identify patterns (e.g., consistent low-spoon periods after work, energy peaks in the morning). This history could inform predictive adaptation — the system could preemptively simplify its interface before a predicted low-spoon period.

- **Predictive adaptation.** Using machine learning on spoon history, calendar data, and behavioral signals to predict spoon state before the user reports it. This must be implemented with extreme care to avoid paternalism or false inference.

- **Multidimensional energy modeling.** Extending the scalar spoon model to a vector that captures executive function, emotional capacity, sensory tolerance, and social energy independently.

- **Cross-agent spoon protocol.** Defining a standard protocol for transmitting spoon state between agents, beyond the current MCP implementation. This would enable ecosystem-wide accommodation.

- **Crisis Mode expansion.** Adding pre-crisis states (between levels 1 and 0) with intermediate constraints, and exploring non-binary grounding interventions.

---

## References

- Bar, M., & Neta, M. (2006). Humans prefer curved visual objects. *Psychological Science*, 17(8), 645–648.
- Miserandino, C. (2003). The Spoon Theory. *But You Don't Look Sick*. Retrieved from butyoudontlooksick.com.
- Microsoft Inclusive Design Toolkit. (2015). Microsoft Corporation.
- Autistic Self Advocacy Network. (2024). *Technology Use and Energy Management in Autistic Adults*. ASAN Research Report.
- IETF Agent Discovery Protocol. (2025). draft-ietf-adp-agent-discovery-01.

---

*This document is part of the P31 Labs documentation corpus. All architectural claims are grounded in production code from the `p31-local-workspace` repository. No user study data or quantitative metrics are fabricated; the codebase itself serves as the primary evidence.*
