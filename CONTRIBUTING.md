# Contributing to P31

Thank you for your interest in P31. This guide helps you get started.

## Getting Started

1. Fork the repository
2. Clone your fork
3. Install dependencies: `pnpm install`
4. Run tests: `pnpm run test:unit`
5. Create a branch: `git checkout -b feature/my-feature`
6. Make your changes
7. Run tests again
8. Submit a pull request

## Development Setup

- **Runtime:** Node.js 24+
- **Package manager:** pnpm
- **Framework:** Astro + React 19 + Tailwind
- **Testing:** Vitest (PHOS), Node test runner (ledger-bridge)
- **Deployment:** Cloudflare Workers + Pages

## Code Style

- TypeScript strict mode
- No comments unless requested
- Follow existing patterns in the codebase
- All UI must be spoon-aware (0-5 scale)
- WCAG 2.2 AAA compliance required

## Testing

```bash
# PHOS tests
cd apps/phos && npx vitest run

# Ledger-bridge tests
node --test software/workers/ledger-bridge/test/*.test.mjs

# Full test suite
pnpm run test:unit
```

## Pull Request Process

1. Ensure all tests pass
2. Update documentation if needed
3. Add yourself to CONTRIBUTORS.md (if it exists)
4. Request a review from @p31labs

## Code of Conduct

Be kind. Be inclusive. Be neurodivergent-affirming.
