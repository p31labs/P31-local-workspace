# API Reference: @p31/brain-dump-orchestrator

## Core Types

### BrainDump

```typescript
interface BrainDump {
  projectName: string;
  coreProblem: string;
  currentState: CurrentState;
  constraints: Constraint[];
  desiredEndState: DesiredEndState;
  knownAssets: KnownAsset[];
  openQuestions: OpenQuestion[];
  metadata: BrainDumpMetadata;
}
```

### Axis

```typescript
interface Axis {
  id: string;                    // e.g., "my-project-axis-a"
  letter: string;                // "A", "B", "C", ...
  name: string;
  focusArea: string;
  agentRole: string;
  deliverable: Deliverable[];
  convergenceGate: {
    checks: ConvergenceGateCheck[];
    overallCriteria: string;
  };
  complexity: 'low' | 'medium' | 'high';
  dependencies: string[];
  status: 'pending' | 'running' | 'completed' | 'failed' | 'blocked';
}
```

### OrchestrationConfig

```typescript
interface OrchestrationConfig {
  batchId: string;
  axes: AxisConfig[];
  maxConcurrency: number;
  retryPolicy: RetryPolicy;
  statusTracker: 'filesystem' | 'kv' | 'd1';
  statusPath?: string;
}
```

### AgentRunResult

```typescript
interface AgentRunResult {
  success: boolean;
  filesWritten: string[];
  statusLine: string;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  error?: string;
}
```

### ConvergenceResult

```typescript
interface ConvergenceResult {
  overall: 'PASS' | 'FAIL';
  checkedAt: string;
  axes: AxisConvergenceStatus[];
  blockers: ConvergenceBlocker[];
  nextSteps: string[];
}
```

## Functions

### parseMarkdownToBrainDump()

```typescript
function parseMarkdownToBrainDump(markdown: string, operatorName: string): BrainDump
```

Parses a markdown file following the Jitterbug brain dump template into a structured `BrainDump` object.

**Example:**
```typescript
const bd = parseMarkdownToBrainDump(rawMarkdown, 'will');
console.log(bd.projectName); // "My Project"
```

### decomposeBrainDump()

```typescript
function decomposeBrainDump(
  bd: BrainDump,
  config?: { minAxes?: number; maxAxes?: number; requireSelfContained?: boolean }
): Axis[]
```

Decomposes a brain dump into 3–8 parallel axes.

**Example:**
```typescript
const axes = decomposeBrainDump(bd, { minAxes: 3, maxAxes: 6 });
console.log(axes.length); // 3–6
```

### generateAxisPrompt()

```typescript
function generateAxisPrompt(axis: Axis): AgentPrompt
```

Generates a full agent prompt from an axis configuration.

**Example:**
```typescript
const prompt = generateAxisPrompt(axes[0]);
console.log(prompt.system); // "You are the Security Architect agent..."
```

## Classes

### BrainDumpOrchestrator

```typescript
class BrainDumpOrchestrator {
  constructor(config: OrchestrationConfig);
  async runAll(): Promise<OrchestrationResult>;
  getStatus(axisId: string): StatusEntry | undefined;
  getAllStatuses(): StatusEntry[];
  getTracker(): DeliverableTracker;
}
```

**Example:**
```typescript
const orchestrator = new BrainDumpOrchestrator({
  batchId: 'batch-001',
  axes: [{ axisId: 'axis-a', adapter: 'claude-code', priority: 0, timeoutMs: 300000 }],
  maxConcurrency: 4,
  retryPolicy: { maxRetries: 2, backoffMs: 1000, retryableErrors: ['timeout'] },
  statusTracker: 'filesystem'
});

const result = await orchestrator.runAll();
```

### GateChecker

```typescript
class GateChecker {
  checkAll(axes: Axis[], result: OrchestrationResult): ConvergenceResult;
}
```

**Example:**
```typescript
const checker = new GateChecker();
const convergence = checker.checkAll(axes, result);
if (convergence.overall === 'PASS') {
  console.log('All axes converged!');
}
```

### ConvergenceReporter

```typescript
class ConvergenceReporter {
  formatReport(result: ConvergenceResult, batchId: string): string;
}
```

**Example:**
```typescript
const reporter = new ConvergenceReporter();
console.log(reporter.formatReport(convergence, 'batch-001'));
```

### MaturityScorer (Jitterbug Plugin)

```typescript
class MaturityScorer {
  scoreDeliverable(deliverable: { filePath: string; description: string }): JitterbugDimension[];
  scoreAxis(axis: Axis): JitterbugDimension[];
}
```

**Example:**
```typescript
const scorer = new MaturityScorer();
const dims = scorer.scoreAxis(axis);
// [{ dimension: 'CODE', score: 1.0, weight: 0.25 }, ...]
```

### SignalEmitter (Jitterbug Plugin)

```typescript
class SignalEmitter {
  emitFromAxis(axis: Axis): void;
  getSignals(): Record<string, { weight: number; artifacts: string[] }>;
  toJitterbugSignalsFormat(): Record<string, unknown>;
}
```

**Example:**
```typescript
const emitter = new SignalEmitter();
emitter.emitFromAxis(axis);
const signals = emitter.toJitterbugSignalsFormat();
// { _schema: 'PMM_JITTERBUG=1.0', axis_completed:axis-a: { weight: 0.8, artifacts: [...] } }
```

## Adapters

### AgentRunner Interface

```typescript
interface AgentRunner {
  run(agent: AxisAgent, prompt: AgentPrompt): Promise<AgentRunResult>;
  supports(runtime: string): boolean;
}
```

### StatusTracker Interface

```typescript
interface StatusTracker {
  write(batchId: string, entries: StatusEntry[]): Promise<void>;
  read(batchId: string): Promise<StatusEntry[]>;
  append(batchId: string, entry: StatusEntry): Promise<void>;
}
```

## Error Handling

All public methods throw standard `Error` objects with descriptive messages. The `AgentRunResult` and `ConvergenceResult` types include `error` fields for granular failure analysis.

```typescript
try {
  const result = await orchestrator.runAll();
} catch (error) {
  console.error('Orchestration failed:', error.message);
}
```
