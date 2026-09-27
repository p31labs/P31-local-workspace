# Changelog: @p31/brain-dump-orchestrator

## [0.1.0-alpha.0] — 2026-06-22

### Added
- Initial release of `@p31/brain-dump-orchestrator`
- 5‑layer architecture: Brain Dump Capture → Decomposition → Agent Runtime → Parallel Orchestration → Convergence Gate
- Zod schemas for all types with runtime validation
- Markdown parser with section detection and bullet processing
- Decomposition engine with rule‑based focus area detection (legal, security, frontend, backend, QA)
- `ClaudeCodeRunner` adapter (spawns `claude -p -f`)
- `BrainDumpOrchestrator` with concurrency control, timeouts, and retry policies
- `FileSystemStatusTracker`, `KVStatusTracker`, `D1StatusTracker`
- `GateChecker` with PASS/FAIL evaluation and blocker categorisation
- `ConvergenceReporter` for human‑readable markdown reports
- Jitterbug plugin: `MaturityScorer`, `SignalEmitter`, `StageTransitionTracker`
- CLI commands: `capture`, `decompose`, `run`, `converge`, `status`
- Templates: brain‑dump, axes, axis‑prompt, convergence, deep‑research
- Test suite: 23 tests passing (Vitest)
- TypeScript strict mode — zero compilation errors

### Known Issues
- `CortexDOAdapter` and `AgentEngineAdapter` are stubs (ready for integration)
- `GenericLLMRunner` is a stub (ready for implementation)
- Signal persistence to `jitterbug-signals.json` is not yet implemented (in‑memory only)

### Next Steps
- Implement `CortexDOAdapter` with Cloudflare Durable Object bindings
- Implement `AgentEngineAdapter` with `@p31ca/agent-engine` import
- Add `--dry-run` flag to `run` command
- Add signal file persistence to repository root
- Improve CLI to auto‑detect `.json` vs `.md` axes input
