# Contributing to P31 Labs

Thank you for your interest in contributing. This project builds assistive technology
for neurodivergent individuals — every contribution matters.

## Getting Started

1. Fork the repository
2. Clone and set up: `cd software && pnpm install`
3. Create a feature branch: `git checkout -b feat/your-feature`
4. Make your changes
5. Run tests: `pnpm test && pnpm run lint`
6. Submit a pull request

## Pre-commit Hooks

Git hooks are in `.githooks/`. Install:

```bash
git config core.hooksPath .githooks
```

The pre-commit hook runs ESLint and TypeScript checking on staged files.
Bypass with `git commit --no-verify` or `P31_SKIP_HOOKS=1`.

## Development Commands

```bash
pnpm run dev           # Start all dev servers
pnpm run test          # Run all tests
pnpm run typecheck     # TypeScript type checking
pnpm run lint          # ESLint
pnpm run build         # Build all packages
```

## Code Style

- **TypeScript:** ESLint with flat config (see `eslint.config.mjs`)
- **Commits:** Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`)

## Accessibility

This project serves neurodivergent users. When contributing UI changes:

- Respect the progressive disclosure layers (0-3)
- Use the canonical font stack (Atkinson Hyperlegible for UI)
- Maintain high contrast with the P31 color palette
- Avoid unnecessary animations or sensory friction
- Test with reduced-motion preferences enabled

## License

By contributing, you agree that your contributions will be licensed under AGPL-3.0.
