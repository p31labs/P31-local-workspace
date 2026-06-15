# Contributing to P31 Labs

**Version:** 1.0.0  
**Last Updated:** June 14, 2026

Thank you for your interest in contributing to P31 Labs. All contributions must align with our **sovereign, local‑first, zero‑telemetry** principles.

---

## 1. Code of Conduct

We are committed to providing a welcoming, harassment‑free experience for everyone. See [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) for details.

**Key points:**
- Be respectful and inclusive.
- No unsolicited private messages.
- Report issues to will@p31ca.org.

---

## 2. Getting Started

### 2.1 Prerequisites

- [ ] Git
- [ ] Docker & Docker Compose
- [ ] Go 1.24+
- [ ] Node.js 20+ & pnpm
- [ ] Rust (if contributing to PHOS)
- [ ] Python 3.11+ (for p31‑cortex)

### 2.2 Fork & Clone

```bash
git clone https://github.com/p31labs/andromeda.git
cd andromeda
pnpm install
```

### 2.3 Run Tests

```bash
# Full suite (unit, integration, E2E)
pnpm test:all

# Just Rust tests (PHOS backend)
pnpm test:rust

# Just CLI tests
cd ~/go/p31-cli && go test ./...
```

---

## 3. Code Style & Linting

| Language | Tool | Command |
|----------|------|---------|
| Go | `gofmt`, `go vet` | `go fmt ./... && go vet ./...` |
| TypeScript/TSX | ESLint | `pnpm lint` |
| Python | Black, isort | `black . && isort .` |
| Shell | ShellCheck | `shellcheck scripts/*.sh` |

**Pre‑commit hook:** The monorepo includes a pre-commit hook that runs `p31 verify` before allowing commits. Enable it:

```bash
cp .githooks/pre-commit .git/hooks/
chmod +x .git/hooks/pre-commit
```

---

## 4. Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`  
**Scope:** `cli`, `phos`, `cashpilot`, `cortex`, `mesh`, `docs`, `ci`

**Examples:**
- `feat(cli): add somatic rate limiting`
- `fix(cortex): correct Ollama healthcheck path`
- `docs(readme): update deployment instructions`

---

## 5. Pull Request Process

1. **Create a feature branch** from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```

2. **Make changes**, add tests, update documentation.

3. **Run all tests** locally:
   ```bash
   pnpm test:all
   ```

4. **Push your branch** and open a Pull Request against `main`.

5. **PR requirements:**
   - ✅ All CI checks pass (GitHub Actions)
   - ✅ At least one approving review
   - ✅ No merge conflicts
   - ✅ Update `CHANGELOG.md` (if user‑facing change)

6. **Merge** (squash or rebase – maintainer’s choice).

---

## 6. Testing Requirements

| Component | Minimum Test Coverage | Required Tests |
|-----------|----------------------|----------------|
| Go CLI (`p31`) | 70% | Unit tests (`go test ./...`) + integration (`p31 doctor`) |
| CashPilot (Python) | 80% | `pytest` – at least unit + one integration test |
| p31‑cortex (Python) | 60% | `pytest` – health endpoints and core logic |
| PHOS (Rust) | 70% | `cargo test` – db, audio, commands |
| PHOS frontend (TSX) | 60% | Vitest + Playwright E2E (smoke suite) |

**Run coverage:**
```bash
# Go CLI
cd ~/go/p31-cli && go test -cover ./...

# CashPilot
cd ~/cashpilot && pytest --cov=auto-solver
```

---

## 7. Documentation Standards

- Every new feature must include an update to the relevant `.md` file in `/docs`.
- CLI flags must be added to `CLI.md`.
- New environment variables must be added to `.env.example` and documented in `DEPLOYMENT.md`.
- Architecture changes must be reflected in `ARCHITECTURE.md`.

---

## 8. Security & Privacy

- **Never commit secrets** (API keys, tokens, passwords). Use `.env` files and `wrangler secret`.
- **No telemetry** – contributions must not add analytics, tracking, or third‑party data collection.
- **Zero‑trust by default** – new endpoints must require authentication unless explicitly justified.

---

## 9. Review Process

| Role | Responsibility |
|------|----------------|
| **Author** | Opens PR, responds to feedback, ensures tests pass. |
| **Reviewer** | Checks code quality, test coverage, docs, security. |
| **Maintainer** | Merges after approvals, updates `CHANGELOG`, tags release. |

**Review timeline:** Expect feedback within 48 hours (weekdays). Larger PRs may take longer.

---

## 10. Release Process

Releases are triggered by tags:

```bash
git tag v1.2.3
git push origin v1.2.3
```

GitHub Actions will:
- Build binaries (GoReleaser)
- Build PHOS `.deb` / `.AppImage`
- Build CashPilot Docker images
- Create a GitHub Release with artifacts

**Versioning:** [Semantic Versioning](https://semver.org/) – `MAJOR.MINOR.PATCH`

---

## 11. Getting Help

- **Discord:** #contributors channel
- **GitHub Issues:** Use the appropriate template
- **Email:** will@p31ca.org (for sensitive matters)

---

**Next:** [GLOSSARY.md](./GLOSSARY.md) – Terminology (K₄, Spoon, Larmor, Posner, etc.)
