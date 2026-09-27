# Architecture: @p31/brain-dump-orchestrator

## Design Principles

1. **Self‑contained axes** — Each axis has zero startup dependencies on other axes, enabling true parallel execution.
2. **Pluggable adapters** — The agent runtime and status tracking are abstracted behind interfaces.
3. **Convergence‑first** — Every axis has explicit convergence gates; the system fails loudly if gates are not met.
4. **Jitterbug‑compatible** — Optional plugin emits signals in `PMM_JITTERBUG=1.0` format for the existing maturity daemon.
5. **Stack‑agnostic** — Works with Claude Code, Cloudflare Workers, generic LLMs, or custom runtimes.

## Layer Breakdown

### Layer 1: Brain Dump Capture

**Files:** `src/brain-dump/capture.ts`, `schema.ts`, `parser.ts`

- **`capture.ts`** — Interactive CLI capture with `readline` prompts.
- **`schema.ts`** — Zod schemas for all brain dump fields with runtime validation.
- **`parser.ts`** — Markdown → structured `BrainDump` object. Detects sections by heading patterns (1.1–1.6) and processes bullet lists with context‑aware heuristics (e.g., "Known gaps / blockers:" triggers gap detection).

**Key Types:**
```typescript
interface BrainDump {
  projectName: string;
  coreProblem: string;
  currentState: { artifacts: Artifact[]; gaps: Gap[]; blockers: Blocker[] };
  constraints: Constraint[];
  desiredEndState: DesiredEndState;
  knownAssets: KnownAsset[];
  openQuestions: OpenQuestion[];
  metadata: BrainDumpMetadata;
}
```

### Layer 2: Decomposition

**Files:** `src/decomposition/axis-decomposer.ts`, `formatters.ts`

- **`identifyFocusAreas()`** — Rule‑based detection of legal, security, frontend, backend, and QA concerns from the brain dump.
- **`decomposeBrainDump()`** — Maps focus areas to 3–8 axes, each with:
  - A unique letter (A–H)
  - An agent role (e.g., "Security Architect")
  - A list of deliverables with acceptance criteria
  - A convergence gate with multiple checks
  - A complexity rating (low/medium/high)
- **`enforceSelfContained()`** — Filters out duplicate axis names to ensure no axis depends on another's output.

### Layer 3: Agent Runtime

**Files:** `src/agents/prompt-factory.ts`, `runner.ts`, `axis-agent.ts`, `deliverable-tracker.ts`

- **`prompt-factory.ts`** — Generates the Section 3 agent prompt from an `Axis` configuration, including system role, mission, design rules, deliverables, and convergence gate.
- **`runner.ts`** — `AgentRunner` interface with implementations:
  - `ClaudeCodeRunner` — Spawns `claude -p -f` and parses `### FILE:` markers from stdout.
  - `GenericLLMRunner` — Stub for OpenAI/Anthropic/Ollama/etc. (ready for implementation).
- **`axis-agent.ts`** — `AxisAgentRuntime` orchestrates a single axis: builds the prompt, runs the adapter, and tracks the result.
- **`deliverable-tracker.ts`** — Records written files per axis with timestamps and sizes.

### Layer 4: Parallel Orchestration

**Files:** `src/orchestration/orchestrator.ts`, `batch-runner.ts`, `status-tracker.ts`, `failure-handler.ts`

- **`BrainDumpOrchestrator`** — Main orchestrator. Runs axes with configurable concurrency, timeouts, and retry policies.
- **`BatchRunner`** — Thin wrapper around `BrainDumpOrchestrator` for batch execution.
- **`status-tracker.ts`** — `StatusTracker` interface with `FileSystem`, `KV`, and `D1` implementations.
- **`failure-handler.ts`** — Retry logic with exponential backoff and error categorization (dependency, quality, timeout, hallucination, unknown).

**Concurrency Model:**
- Uses a queue + promise‑racing pattern (`Promise.race` on running promises).
- Max concurrency is configurable (default: 4).
- Each axis runs with a per‑axis timeout (default: 300s).

### Layer 5: Convergence Gate

**Files:** `src/convergence/gate-check.ts`

- **`GateChecker.checkAll()`** — Evaluates every axis against its convergence gate checks.
  - Each check passes if the axis execution succeeded **and** the expected files were written.
  - Aggregates blockers by type and severity.
  - Computes next steps (e.g., "Re‑run failed axes", "Re‑decompose problem").
- **`ConvergenceReporter.formatReport()`** — Generates a human‑readable markdown report with axis statuses, blockers, and next steps.

### Optional Plugin: Jitterbug Integration

**Files:** `src/jitterbug/maturity-scorer.ts`

- **`MaturityScorer`** — Maps deliverables to Jitterbug dimensions (`CODE`, `TEST`, `DOCS`, `OPS`, `SEC`) with weighted scores.
- **`SignalEmitter`** — Emits signals in `PMM_JITTERBUG=1.0` format, compatible with `jitterbug-daemon.py`.
- **`StageTransitionTracker`** — Tracks FRUIT→BLOOM→SAPLING→SPROUT→SEED transitions (stub).

### Integrations (Stubs)

**Files:** `src/integrations/`

- **`cortex-do-adapter.ts`** — Stub for Cloudflare Durable Object dispatch. Requires `ORCHESTRATOR_DO` binding.
- **`agent-engine-adapter.ts`** — Stub for `@p31ca/agent-engine` in‑process dispatch.
- **`llm-adapter.ts`** — Generic LLM adapter with configurable provider, API key, base URL, and model.
- **`file-system-adapter.ts`** — Reads/writes deliverables to the local filesystem.

## Data Flow

```
1. User provides raw markdown or uses interactive CLI
   ↓
2. parseMarkdownToBrainDump() → structured BrainDump
   ↓
3. decomposeBrainDump() → Axis[] (3–8 axes)
   ↓
4. BrainDumpOrchestrator.runAll()
   ├─ For each axis: AxisAgentRuntime.execute()
   │  ├─ generateAxisPrompt() → AgentPrompt
   │  ├─ getRunner(runtime).run() → AgentRunResult
   │  └─ DeliverableTracker.recordFile()
   ├─ StatusTracker updates in real‑time
   └─ FailureHandler handles retries
   ↓
5. GateChecker.checkAll() → ConvergenceResult
   ├─ PASS → proceed to merge/deploy
   └─ FAIL → blockers + next steps (rollback loop)
```

## Extension Points

| Extension Point | Interface | Description |
|-----------------|-----------|-------------|
| Agent Runtime | `AgentRunner` | Add a new adapter by implementing `run()` and `supports()`. |
| Status Tracker | `StatusTracker` | Add a new backend by implementing `write()`, `read()`, `append()`. |
| Decomposition | `identifyFocusAreas()` | Override or extend the rule‑based detection logic. |
| Convergence | `GateChecker` | Customize check logic or add new check types. |

## Performance Considerations

- **Concurrency limit** — Default 4; max recommended 15 per the Jitterbug template.
- **Timeout** — Each axis has a configurable timeout (default 300s) to prevent hangs.
- **Status tracking** — Filesystem mode writes to `.claude/cache/`; KV/D1 modes are optimised for Cloudflare Workers.
- **Retry policy** — Exponential backoff with configurable max retries (default 3).

## Security

- No hardcoded credentials — all secrets are passed via environment variables or bindings.
- Adapters do not log sensitive data (API keys, tokens).
- File system writes are confined to the project directory (no path traversal).
