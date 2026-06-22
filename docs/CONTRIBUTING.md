# Contributing to Jitterbug

## Development Setup

```bash
git clone https://github.com/p31labs/andromeda.git
cd andromeda
pnpm install
```

## Code Style

- TypeScript strict mode — no `any` on public interfaces.
- Zod schemas for all runtime-validated data.
- ESLint + Prettier (root config).
- Commit messages: conventional commits (`feat:`, `fix:`, `docs:`, etc.).

## Testing

```bash
# Unit + integration
cd software/packages/brain-dump-orchestrator
pnpm test

# API tests (pending pool upgrade)
cd software/packages/jitterbug-api
pnpm test

# Load tests (k6)
cd software/packages/jitterbug-api/tests/load
k6 run submit-brain-dump.js
```

## Adding a New Adapter

1. Create a new file in `src/integrations/`
2. Implement `AgentRunner` interface
3. Register in `src/agents/runner.ts`
4. Add tests
5. Update `README.md` and `API.md`

## Adding a New Status Tracker

1. Create a new file in `src/orchestration/`
2. Implement `StatusTracker` interface
3. Register in `src/orchestration/status-tracker.ts`
4. Add tests

## Deployment

Use the automated script:

```bash
cd software
bash scripts/deploy-jitterbug.sh
```

## License

By contributing, you agree that your contributions will be licensed under MIT.
