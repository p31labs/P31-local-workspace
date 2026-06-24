# Contributing to @p31/brain-dump-orchestrator

## Development Setup

```bash
# Clone the repository
git clone https://github.com/p31labs/andromeda.git
cd andromeda

# Install dependencies (pnpm workspace)
pnpm install

# Navigate to the package
cd software/packages/brain-dump-orchestrator

# Build
pnpm build

# Run tests
pnpm test

# Type check
pnpm typecheck
```

## Code Style

- TypeScript strict mode — no `any` on public interfaces.
- Zod schemas for all runtime‑validated data.
- ESLint for linting (`pnpm lint`).
- Prettier for formatting (config in root).

## Testing

- Tests are in `tests/` with `*.test.ts` naming.
- Run `pnpm test` to execute all tests.
- Run `pnpm test:watch` for watch mode.

## Pull Request Process

1. Fork the repository and create a feature branch.
2. Write tests for any new functionality.
3. Ensure all tests pass (`pnpm test`).
4. Ensure type checking passes (`pnpm typecheck`).
5. Submit a pull request with a clear description of changes.

## Adding a New Adapter

1. Create a new file in `src/integrations/` (e.g., `my-adapter.ts`).
2. Implement the `AgentRunner` interface:
   ```typescript
   export class MyAdapter implements AgentRunner {
     supports(runtime: string): boolean { return runtime === 'my-adapter'; }
     async run(agent: AxisAgent, prompt: AgentPrompt): Promise<AgentRunResult> {
       // Implementation
     }
   }
   ```
3. Register the adapter in `src/agents/runner.ts` (add to `runners` array).
4. Add tests in `tests/integration.test.ts`.
5. Update `README.md` and `API.md` with the new adapter.

## Adding a New Status Tracker

1. Create a new file in `src/orchestration/` (e.g., `my-tracker.ts`).
2. Implement the `StatusTracker` interface:
   ```typescript
   export class MyTracker implements StatusTracker {
     async write(batchId: string, entries: StatusEntry[]): Promise<void> { ... }
     async read(batchId: string): Promise<StatusEntry[]> { ... }
     async append(batchId: string, entry: StatusEntry): Promise<void> { ... }
   }
   ```
3. Register the tracker in `src/orchestration/status-tracker.ts` (`createStatusTracker` function).
4. Add tests.

## Versioning

We follow [Semantic Versioning](https://semver.org/):
- **Major** — Breaking changes to public API.
- **Minor** — New features, backward‑compatible.
- **Patch** — Bug fixes, backward‑compatible.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
