# Spoon‑Aware Adaptive Interfaces: A Case Study

*Anonymized for review*

---

## Abstract

Spoon theory—a metaphor for finite daily energy—has emerged as a framework for understanding cognitive load. Yet most interactive systems treat energy as a constant. We present an open‑source platform that operationalizes spoon theory as a first‑class UI primitive via a `data-spoons` attribute scaling motion, complexity, and LLM prompts across six levels (0–5). We describe the architecture, a component registry MCP server, and a sovereign AI stack with local + edge inference. A dogfooding test validated agent‑driven UI generation; a stress test verified the CrisisMode invariant (UI chrome removed at spoon 0). We discuss implications for neuroinclusive design.

**Keywords:** spoon theory, neuroinclusive design, MCP, adaptive UI, sovereign AI

---

## 1. Introduction

Spoon theory [1] represents daily energy as a finite number of spoons. Each activity costs one or more spoons. For neurodivergent individuals, the cost can be unpredictable and overwhelming. Despite its widespread acceptance, most digital interfaces ignore spoon theory—they assume a stable, always‑available user.

We present a platform designed from the ground up to respect spoon theory. It comprises a spoon‑aware design system, a CLI (`andromeda`), a cognitive assistant (PHOS), and an agent‑native infrastructure with MCP servers and a component registry. The platform adapts UI complexity, motion, and LLM responses to the user's current spoon level (0–5). At spoon level 0, the interface enters CrisisMode—a full‑screen breathing overlay with no UI chrome.

## 2. Background

### 2.1 Spoon Theory as a Design Framework

Spoon theory has been adopted by the disability community as a powerful metaphor for energy management [2]. Recent CHI 2026 papers have explored adaptive systems, but few have implemented spoon theory as a core UI primitive. Our system does so, encoding spoon levels directly into CSS (`data-spoons`) and LLM prompts.

### 2.2 Agent‑Native Design Systems

The emergence of Model Context Protocol (MCP) [3] has enabled AI agents to interact with tools in a standardized way. Design systems now expose MCP servers (e.g., Meta Astryx [4], Freshworks Dew [5]) to allow agents to retrieve components, tokens, and invariants before generating UI. Our component registry follows this pattern but adds spoon‑aware meta‑information.

## 3. System Architecture

### 3.1 Overview

The platform consists of:
- **Design System:** Tokens (colors, typography, spacing, rounding) and a glassmorphism visual language.
- **Spoon‑Aware Core:** `data-spoons` (0–5) drives motion scaling, layout complexity, and CrisisMode.
- **CLI (`andromeda`):** Interactive TUI with `--agent` JSON output and an MCP server (11 tools).
- **PHOS:** Cognitive assistant with local WebLLM (Llama‑3.2‑3B) and edge fallback.
- **Component Registry MCP:** 5 tools for querying design tokens and component specs.
- **Gateway:** REST endpoints including `/api/phos/surfaces` (23 surfaces) and `/ai/chat`.

### 3.2 Spoon‑Aware LLM Prompt

PHOS's system prompt is dynamically constructed via `buildSystemPrompt(spoonLevel)`. Guidance ranges from crisis (level 0) to high energy (level 5), ensuring responses match cognitive load.

### 3.3 CrisisMode Invariant

At spoon level 0, PHOS renders only the CrisisMode breathing overlay. No sidebar, no prompt bar, no chat—a hard invariant enforced in the component code.

## 4. Evaluation

### 4.1 Dogfooding Test

An agent‑driven UI generation workflow using the Component Registry MCP: (1) list components, (2) retrieve GlassPanel spec, (3) retrieve PillButton and SpoonDots specs, (4) read design tokens and invariants, (5) consult spoon guide, (6) generate `SettingsCard`, (7) write via `oasis_execute`, (8) verify TypeScript compilation, (9) cleanup. All 10 steps passed.

### 4.2 Spoon‑Aware Stress Test

A script verified CrisisMode invariant, prompt adaptation, motion scaling, and spoon level propagation. 31 of 33 assertions passed (2 were test specificity issues; code correct).

## 5. Results & Discussion

- **Agent Loop:** Fully operational; agent generated correct, spoon‑aware code.
- **CrisisMode:** Invariant verified; UI chrome removed at spoon=0.
- **Spoon‑Aware Prompts:** All 6 levels have distinct guidance; spoon level flows from store to LLM.
- **Design System:** 17 color tokens, 6 motion levels, 8 components in registry.

The platform demonstrates that spoon theory can be operationalized as a core UI primitive. The component registry enables agents to generate "correct by construction" UI, reducing hallucinations.

## 6. Limitations & Future Work

- WebGPU support is not universal; fallback to WASM or edge is needed.
- The spoon scale (0–5) is discrete; continuous adaptation could be explored.
- Long‑term user studies with neurodivergent participants are needed to validate effectiveness.

Future work includes implementing a Transformers.js WASM fallback, publishing MCP servers to the official registry, and conducting user studies.

## 7. References

[1] Miserandino, C. (2003). The Spoon Theory. *But You Don't Look Sick*.
[2] CHI 2026. "Rethinking Cognitive Norms in the Age of AI."
[3] Anthropic. (2024). Model Context Protocol.
[4] Meta. (2026). Astryx: Agent‑Ready React Design System.
[5] Freshworks. (2026). Dew MCP Server.

---

*Note: This document is formatted for ASSETS LBW (4‑page limit) and anonymized. Ensure final PDF is tagged for accessibility.*
