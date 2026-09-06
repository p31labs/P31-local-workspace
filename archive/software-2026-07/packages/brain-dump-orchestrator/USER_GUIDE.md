# User Guide: @p31/brain-dump-orchestrator

## What is the Jitterbug Quantum Brain Dump?

The Jitterbug Quantum Brain Dump is a methodology for transforming messy, high‑context problems into parallel‑execution research plans. It is designed for solo operators or small teams who need to decompose complex projects (codebase uplifts, market launches, grant strategies, legal preparations) into independent workstreams that can run simultaneously.

The name "Jitterbug" in this context refers to the **oscillation between chaos and structure** — the process of dumping raw thoughts, then converging them into ordered, executable axes. It is **not** related to the iOS debugging tool, Go ticker library, or bug tracking system that share the same name.

## When to Use This Package

- You have a complex, multi‑faceted problem and want to avoid sequential back‑and‑forth with an AI.
- You want to decompose a project into 3–8 independent workstreams that can run in parallel.
- You need a structured way to capture constraints, assets, and open questions before engaging agents.
- You want convergence gates to ensure all pieces fit together before merging.

## Step‑by‑Step Workflow

### Step 1: Capture a Brain Dump

Start by capturing your raw thoughts. You can do this interactively or from an existing markdown file.

**Interactive:**
```bash
brain-dump capture --operator will
```
You'll be prompted for:
- Project name
- Core problem
- Current state artifacts
- Constraints & non‑negotiables
- Desired end state (FRUIT target)
- Known assets
- Open questions

**From file:**
```bash
brain-dump capture --file ideas.md --output brain-dump.md
```

The input file should follow the Jitterbug template format (see `templates/brain-dump-template.md`).

### Step 2: Decompose into Axes

Once you have a structured brain dump, decompose it into parallel axes:

```bash
brain-dump decompose brain-dump.md --output axes.md
```

This generates:
- A table of axes (A, B, C, ...) with focus areas, agent roles, deliverables, and convergence gates.
- Detailed per‑axis prompts (ready to copy‑paste into your agent).

**Output formats:**
```bash
brain-dump decompose brain-dump.md --format json   # JSON output
brain-dump decompose brain-dump.md --format markdown  # Markdown output (default)
```

### Step 3: Run Axes in Parallel

Launch all axes simultaneously:

```bash
brain-dump run axes.md --concurrency 4 --adapter claude-code
```

**Options:**
- `--concurrency N` — Max parallel agents (default: 4, max recommended: 15).
- `--adapter <type>` — Agent runtime: `claude-code`, `cortex-do`, `llm-generic` (default: `claude-code`).
- `--timeout <ms>` — Per‑axis timeout (default: 300000ms).

**What happens:**
- Each axis gets its own agent with a role‑specific prompt.
- Agents write deliverables to the specified file paths.
- Status is tracked in `.claude/cache/[batch-id]-status.txt`.

### Step 4: Check Convergence

After all axes complete, run the convergence gate:

```bash
brain-dump converge axes.md --result result.json
```

This produces a report with:
- Overall PASS/FAIL status
- Per‑axis status with gate check results
- Blockers (if any)
- Recommended next steps

**With auto‑rollback:**
```bash
brain-dump converge axes.md --result result.json --rollback
```
Failed axes are automatically re‑run with focused feedback.

### Step 5: Check Status (Optional)

Monitor running axes:

```bash
brain-dump status batch-1734567890123
```

## Example: End‑to‑End

```bash
# 1. Capture
brain-dump capture --operator will
# (follow prompts)

# 2. Decompose
brain-dump decompose brain-dump.md --output axes.md

# 3. Run
brain-dump run axes.md --concurrency 4

# 4. Converge
brain-dump converge axes.md --result result.json

# 5. If failed, rollback
brain-dump converge axes.md --result result.json --rollback
```

## Integrating with Jitterbug Daemon

If you use the existing `jitterbug-daemon.py` maturity oscillator, you can emit signals from the orchestrator:

```typescript
import { SignalEmitter } from '@p31/brain-dump-orchestrator/jitterbug';

const emitter = new SignalEmitter();
for (const axis of axes) {
  emitter.emitFromAxis(axis);
}
const signals = emitter.toJitterbugSignalsFormat();
// Write to jitterbug-signals.json
```

The signals are emitted in `PMM_JITTERBUG=1.0` format, compatible with the daemon's signal processing.

## Customising the Decomposition

The decomposition engine uses rule‑based heuristics to identify focus areas. You can extend or override `identifyFocusAreas()` in your own code:

```typescript
import { identifyFocusAreas, decomposeBrainDump } from '@p31/brain-dump-orchestrator';

const customAreas = identifyFocusAreas(bd);
// Add custom logic here
const axes = decomposeBrainDump(bd);
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `claude: command not found` | Install Claude Code or use a different adapter (`cortex-do`, `llm-generic`). |
| Timeout errors | Increase `--timeout` or reduce `--concurrency`. |
| No files written | Check that the agent output includes `### FILE: path/to/file` markers. |
| Convergence fails | Review the convergence report for specific blockers and re‑run failed axes with `--rollback`. |
| Status file not found | Ensure the batch ID matches a previous `run` command. |

## Advanced: Custom Adapters

You can add your own agent runtime by implementing the `AgentRunner` interface:

```typescript
import { AgentRunner, AgentRunResult, AgentPrompt } from '@p31/brain-dump-orchestrator';

class MyCustomRunner implements AgentRunner {
  supports(runtime: string): boolean {
    return runtime === 'my-custom';
  }

  async run(agent: AxisAgent, prompt: AgentPrompt): Promise<AgentRunResult> {
    // Your custom logic here
    return {
      success: true,
      filesWritten: ['output.md'],
      statusLine: 'Custom runner succeeded',
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString()
    };
  }
}
```

Then register it with the runner registry (future enhancement).

## Performance Tips

- **Concurrency** — Start with `--concurrency 4` and increase up to 15 if your system can handle it.
- **Timeout** — Set `--timeout` to at least 2× the expected agent execution time.
- **Retries** — The default retry policy (2 retries, 1s backoff) works for most cases. Increase for flaky networks.
- **Status tracking** — Use `filesystem` for local development; use `kv` or `d1` for Cloudflare Workers.
