# @p31/brain-dump-orchestrator

**Jitterbug Quantum Brain Dump Orchestration** — Transform messy ideation into parallel‑execution research plans with convergence gates.

[![npm version](https://img.shields.io/npm/v/@p31/brain-dump-orchestrator.svg)](https://www.npmjs.com/package/@p31/brain-dump-orchestrator)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

`@p31/brain-dump-orchestrator` is a production‑ready implementation of the **Jitterbug Quantum Brain Dump** methodology. It provides a 5‑layer architecture that:

1. **Captures** raw ideas, constraints, and existing artifacts
2. **Decomposes** complex problems into 3–8 independent workstreams (axes)
3. **Executes** axes in parallel via pluggable agent adapters
4. **Orchestrates** with concurrency control, retries, and status tracking
5. **Converges** with gate checks, blocker analysis, and rollback loops

The package is designed to be stack‑agnostic — it works with Claude Code, Cloudflare Workers, generic LLMs, or custom agent runtimes.

## Installation

```bash
pnpm install @p31/brain-dump-orchestrator
```

## Quick Start (CLI)

```bash
# 1. Capture a brain dump interactively
brain-dump capture --operator will

# 2. Decompose into parallel axes
brain-dump decompose brain-dump.md --output axes.md

# 3. Run all axes in parallel (Claude Code adapter)
brain-dump run axes.md --concurrency 4

# 4. Check convergence
brain-dump converge axes.md --result result.json

# 5. With auto-rollback for failed axes
brain-dump converge axes.md --result result.json --rollback
```

## Quick Start (Programmatic)

```typescript
import {
  parseMarkdownToBrainDump,
  decomposeBrainDump,
  BrainDumpOrchestrator,
  GateChecker,
  ConvergenceReporter,
  SignalEmitter,
  MaturityScorer
} from '@p31/brain-dump-orchestrator';

// 1. Parse a brain dump
const rawMarkdown = `
# 🧠 Brain Dump – My Project
### 1.1 The Core Problem / Opportunity
Build a sovereign AI orchestration system.
...
`;
const bd = parseMarkdownToBrainDump(rawMarkdown, 'operator');

// 2. Decompose into axes
const axes = decomposeBrainDump(bd);

// 3. Run in parallel
const orchestrator = new BrainDumpOrchestrator({
  batchId: 'batch-001',
  axes: axes.map(a => ({
    axisId: a.id,
    adapter: 'claude-code',
    priority: 0,
    timeoutMs: 300000
  })),
  maxConcurrency: 4,
  retryPolicy: {
    maxRetries: 2,
    backoffMs: 1000,
    retryableErrors: ['timeout', 'stub']
  },
  statusTracker: 'filesystem'
});

const result = await orchestrator.runAll();

// 4. Check convergence
const checker = new GateChecker();
const convergence = checker.checkAll(axes, result);

// 5. Emit Jitterbug signals (optional)
const emitter = new SignalEmitter();
for (const axis of axes) {
  emitter.emitFromAxis(axis);
}
const signals = emitter.toJitterbugSignalsFormat();
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    BRAIN DUMP CAPTURE (Layer 1)             │
│  capture.ts / schema.ts / parser.ts — Zod-validated intake │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│              DECOMPOSITION (Layer 2)                        │
│  axis-decomposer.ts — LLM-assisted 3–8 axes + complexity   │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│              AGENT RUNTIME (Layer 3)                        │
│  prompt-factory.ts / runner.ts / axis-agent.ts              │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│              PARALLEL ORCHESTRATION (Layer 4)               │
│  orchestrator.ts / batch-runner.ts / status-tracker.ts      │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│              CONVERGENCE GATE (Layer 5)                     │
│  gate-check.ts — PASS/FAIL with blockers + next steps      │
└─────────────────────────────────────────────────────────────┘
```

## Adapters

| Runtime | Description | Status |
|---------|-------------|--------|
| `claude-code` | Spawns Claude CLI, reads status files | ✅ Complete |
| `cortex-do` | Routes to p31-cortex Cloudflare DO agents | ⚠️ Stub (ready for integration) |
| `agent-engine` | In-process AgentEngine instances | ⚠️ Stub (ready for integration) |
| `llm-generic` | OpenAI/Anthropic/Ollama/DeepSeek/Gemini | ⚠️ Stub (ready for integration) |

## Status Trackers

| Type | Description |
|------|-------------|
| `filesystem` | Writes to `.claude/cache/[batch-id]-status.txt` |
| `kv` | Cloudflare KV (requires binding) |
| `d1` | Cloudflare D1 (requires binding) |

## Jitterbug Integration (Optional Plugin)

```typescript
import { MaturityScorer, SignalEmitter } from '@p31/brain-dump-orchestrator/jitterbug';

const scorer = new MaturityScorer();
const dims = scorer.scoreAxis(axis);
// dims: [{ dimension: 'CODE', score: 1.0, weight: 0.25 }, ...]

const emitter = new SignalEmitter();
emitter.emitFromAxis(axis);
const signals = emitter.toJitterbugSignalsFormat();
// Compatible with jitterbug-daemon.py PMM_JITTERBUG=1.0 format
```

## CLI Commands

| Command | Description |
|---------|-------------|
| `brain-dump capture` | Interactive capture or parse existing markdown |
| `brain-dump decompose <file>` | Decompose into parallel axes |
| `brain-dump run <axesFile>` | Run all axes in parallel |
| `brain-dump converge <axesFile>` | Run convergence gate check |
| `brain-dump status <batchId>` | Show axis statuses |

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Type check
pnpm typecheck

# Run tests
pnpm test
```

## License

MIT © P31 Labs
