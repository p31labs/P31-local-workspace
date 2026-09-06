# P31 Agentic Design System — Roadmap

**Status:** Vision + architecture captured. Implementation pending a dedicated sprint
after the v2.2.0 hardening ships.

## Paradigm Shift

From **static** (designer → figma → tokens → copy-paste components) to **agentic**
(design intent → AI agents reason about constraints → generated + verified).

## Why Now

The v2.2.0 hardening (this PR) makes design-core the single source of truth for
tokens, recipes, components (React + Astro + Web Component), the MCP server, and the
converter. A stable foundation enables the agentic layer to build on top instead of
fighting CSS drift.

## Architecture

### Agent Roles (Tag-Out System)

| Agent | Role | Input | Output | Constraints |
|-------|------|-------|--------|------------|
| **Gemini (Narrator)** | Capture design intent + rationale | User request, design principles, LOVE semantics | Structured Intent DSL (YAML) | ≤500 tokens; cite principles |
| **Opus (Architect)** | Verify constraints + trade-offs | Intent spec, WCAG 2.1 AAA, performance budgets | Approved/rejected spec + rationale | Can reject; autonomous QA |
| **Sonnet (Mechanic)** | Generate code | Approved spec | Component + tests + docs | Must pass Opus QA |
| **DeepSeek (Firmware)** | Performance tuning | Generated code, device constraints | Profiled, optimized bundle | ≤3 KB, ≤16.67 ms @ 60 Hz |

### Intent DSL (YAML)

```yaml
component: AffirmButton
narrative: >-
  An action button that affirms user intent. Celebratory at high spoon levels,
  minimal at low. Every successful action earns LOVE credit.
constraints:
  accessibility: wcag-aaa
  spoonAware: [0..5]
  performance: { bundle: 3kb, render: 16.67ms }
  loveSemantics: { trigger: on-success, reward: 5, recipient: [user, caregiver] }
```

### Generation Pipeline

```
Intent YAML → agents reason → React + CSS + tests → QA → performance → deploy → learn
```

## Phased Plan

### Phase 1: Agent Orchestration (1 week)
- Define agent prompt templates (Gemini, Opus, Sonnet, DeepSeek)
- Build orchestration layer (who calls whom)
- Create intent-parser package

**Deliverable:** Agents can collaborate on one component end-to-end.

### Phase 2: Intent DSL (1 week)
- Define Intent DSL schema (YAML)
- Build intent parser (vitest-tested)
- 10 example specs
- Validate against design principles

**Deliverable:** Intent format is canonical, parseable, testable.

### Phase 3: Generation Pipeline (2 weeks)
- Component generator (React + CSS templates) — reuse MCP generate_component
- Test generator (Vitest harness)
- Documentation generator (JSDoc + Storybook)
- QA pipeline (Opus verification)
- Performance profiler (DeepSeek)

**Deliverable:** End-to-end generation works; components auto-generated.

### Phase 4: Learning Loop (1 week)
- Usage tracking
- Performance monitoring
- Feedback collection
- Automatic improvement suggestions

**Deliverable:** System learns from production usage.

### Phase 5: CLI + Sovereignty (1 week)
- `p31 design create | list | audit | variant`
- Local LLM deployment (Ollama)
- Brand fine-tuning
- User documentation

**Deliverable:** Users can deploy + customize their own design system.

### Phase 6: Integration (1 week)
- Integrate into Spaceship Earth
- Marketing sites use agentic system
- Portals (BASH, PHOS, WILLOW) leverage agents
- Documentation complete

**Deliverable:** P31 sovereign design system live.

**Total: ~7 weeks** (end of September 2026)

## Prerequisites (from v2.2.0)

- [x] Single source of truth for tokens (recipes.css + base.css aligned)
- [x] MCP server hardened (validation, webcomponent output, categories, tool registry)
- [x] Component layer unified (@p31/ui-react + @p31/ui-astro with aligned APIs)
- [x] Crisis-mode CSS complete (covers spoons 0–1)
- [x] Test suite (53 MCP tests passing)
- [ ] Storybook integration (deferred — no current consumer)
- [ ] Full primitive extraction (Button, Input, Select, Checkbox, Radio)

## Sovereignty Model

```
Users deploy their own design system:
  npx @p31/design-system deploy --name="my-brand" --local

→ Local LLM (Ollama: Qwen 2.5 7B on node)
→ Agent orchestration (Sonnet + Opus + Gemini-equivalent)
→ Component generator
→ QA pipeline
→ Design CLI
```

## Success Criteria

- ☐ Agents collaboratively generate components (zero human intervention)
- ☐ All generated components pass Opus QA (WCAG AAA, spoon-aware, <3 KB, <16.67 ms)
- ☐ Intent DSL fully specified
- ☐ CLI works (`p31 design create` generates production component)
- ☐ Learning loop active
- ☐ Sovereignty demo (user deploys own system, fine-tunes brand)
- ☐ Design quality ≥ Opus-grade
- ☐ 10 real components shipped via agentic pipeline
