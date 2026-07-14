# Contributing to P31 Labs

Thanks for your interest in making assistive tech sovereign, neuroinclusive, and
post-quantum. This guide covers local setup, testing, and the PR process.

## 1. Local setup

```bash
git clone https://github.com/p31labs/P31-local-workspace
cd P31-local-workspace
pnpm install            # pnpm workspaces (apps/*, software/*)
pnpm -C apps/phos run build   # example: build PHOS
```

Workers live under `software/workers/*`. Each has its own `package.json`
with `typecheck` (`tsc --noEmit`) and `test` (Vitest).

## 2. Testing

```bash
pnpm -C software/workers/federation-bridge run typecheck
pnpm -C software/workers/federation-bridge test
# Whole-repo units:
pnpm run test:unit
# TRIPER cert runner (monorepo edition):
node tests/triper/triper-runner.mjs --cert
```

- **Vitest** unit tests live next to code (`*.test.ts`).
- **TRIPER** suites under `tests/mvp/**` and `tests/unit/triper/**`.
- Keep **0 typecheck errors** and **0 regressions** before opening a PR.

## 3. Code style

- **TypeScript** strict mode (no `any` unless justified + commented).
- **Prettier + ESLint** — `pnpm lint` if configured.
- **No comments** unless explicitly requested (repo convention).
- **Design system** (`DESIGN.md`): quantum-cyan `#00F0FF`, glass blur 12 / radius 24,
  `data-spoons` 0–5 motion scaling, CrisisMode. Follow it for any UI.

## 4. Pull-request process

1. Branch from `main`: `git checkout -b cwp-2026-0xx/short-name`.
2. Small, focused commits; message references the CWP/issue.
3. Ensure `typecheck` + tests pass locally.
4. Open the PR; CI runs lint + tests (continue-on-error where noted).
5. A **maintainer** reviews; merge on lazy consensus (see `docs/COMMUNITY-GUIDE.md`).

## 5. Reporting issues

- Bugs / feature requests → GitHub Issues (label `bug` / `enhancement`).
- Security issues → **private** disclosure to the maintainers, not public issues.

## 6. CWP workflow

Large work is scoped as **CWPs** (Crypto Work Packages) under
`cwp-2026-*/`. If you pick one up, keep the anchored summary in the
issue/PR in sync and correct false premises found during research.
