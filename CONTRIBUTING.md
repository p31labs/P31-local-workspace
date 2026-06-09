# Contributing to P31 Andromeda

**Engineering standard:** **`docs/ENTERPRISE_QUALITY.md`** (this repo) defines merge-to-`main` quality. In the **multi-root P31 home** checkout, read **`docs/P31-ENGINEERING-STANDARD.md`** (separate git repo at the Soup root) for the full verify + constants + passport alignment checklist.

## Google Workspace hookups (OAuth, Calendar, Drive, Gmail, SSO)

Runbook: **[`docs/integrations/GOOGLE-WORKSPACE.md`](docs/integrations/GOOGLE-WORKSPACE.md)** — Cloud project, consent screen, redirect URIs, service-account **domain-wide delegation** when needed, Worker secret handling, and least-privilege scopes. Example env key names: [`docs/integrations/env.google.example`](docs/integrations/env.google.example) (gitignored in real use). **Automation:** `software/p31-google-bridge` — `npm run preflight` before deploy, `GET /setup` in-browser checklist, `pnpm run google-bridge:preflight` from `software/`.

## Office / corporate docs in-repo

The **P31 Open Doc Suite** (HTML print templates, watermarks, Markdown shells, P31 Forge bridge) lives under **[`docs/corporate/`](docs/corporate/)**. The technical hub surface is **[`p31ca.org/open-doc-suite`](https://p31ca.org/open-doc-suite.html)**. Keep canonical org numbers aligned with `docs/GOD_GROUND_TRUTH.md` and regenerate `docs/corporate/suite/brand-tokens.json` after editing `software/p31-forge/brand.js` (`npm run brand:tokens` in `p31-forge`).

## Where the software lives

Most applications, Workers, Pages projects, and shared packages live under **`software/`**, registered in the **root** `pnpm-workspace.yaml`. Use **one** install at the repository root:

```bash
pnpm install
pnpm run quality   # deploy-target guard (Pages project names)
pnpm run build
pnpm run test
```

Turbo scripts are defined in `software/package.json` (`build`, `test`, `dev`, etc.); the **repository root** `package.json` also defines **`npm run git:hooks`**, which sets `core.hooksPath` to **`.githooks/`** (MAP monetary **pre-commit**, opt-in **post-commit** auto-push; see **`npm run git:autopush:status`**). Run once per clone or after pulling hook changes.

**Production quality bar:** [`docs/ENTERPRISE_QUALITY.md`](docs/ENTERPRISE_QUALITY.md). PRs should keep **Monorepo verify** (GitHub Actions) green.

## Companion repo — bonding-soup (local command center · Chromebook · iPhone)

Operators usually clone **[p31labs/bonding-soup](https://github.com/p31labs/bonding-soup)** beside this repo (Soup is intentionally **not** embedded here — see Soup **`P31-ROOT-MAP.md`**). From the **Soup** root:

- **`npm run command-center`** → local dashboard on **`:3131`** (verify/deploy shortcuts, **`P31_CMD_CENTER_LAN=1`** so iPhone Safari / LAN Chrome OS can reach the host).
- **`npm run startup`** echoes the top of the **[P31 startup package](https://github.com/p31labs/bonding-soup/blob/main/docs/P31-STARTUP-PACKAGE.md)** (desktop loopback · Crostini · iPhone Wi‑Fi in one table).
- Deeper ops: [Device setup (Chromebook + mobile)](https://github.com/p31labs/bonding-soup/blob/main/docs/P31-DEVICE-SETUP-CHROMEBOOK-MOBILE.md), [Chromebook command readiness](https://github.com/p31labs/bonding-soup/blob/main/docs/P31-CHROMEBOOK-COMMAND-READINESS.md), [iPhone command readiness](https://github.com/p31labs/bonding-soup/blob/main/docs/P31-IPHONE-COMMAND-READINESS.md); [AGENTS.md](https://github.com/p31labs/bonding-soup/blob/main/AGENTS.md) in that repo describes the full home ship bar and CI gates.

Nothing in **`andromeda/software`** replaces those scripts — this monorepo ships Workers (e.g. **[command-center Worker](https://command-center.trimtab-signal.workers.dev)** KV dashboard) separately from that **localhost** tooling.

## Fleet map and edge deployables

- **Integration index (Starlight):** `software/docs/src/content/docs/getting-started/connect-the-stack.md` (published on the docs site).
- **Machine-readable Wrangler inventory:** `docs/WORKER_PAGES_MANIFEST.md` — regenerate after adding or renaming Workers/Pages:

  ```bash
  cd software
  pnpm run manifest:workers
  ```

- **Older manual worker narrative:** `docs/WORKER_INVENTORY.md` (snapshot; may lag the manifest).

## CI expectations

On **`main`**, **P31 Automation** (`.github/workflows/p31-automation.yml`) runs:

1. `software/packages/k4-mesh-core` unit tests  
2. Starlight docs build under `software/docs`  
3. `software/scripts/verify-stack-links.mjs` (URLs from connect-the-stack)

Other required checks may run from **P31 Labs CI/CD Pipeline** and related workflows. Open a PR to satisfy branch protection.

**Site updates — two lanes:** **`p31ca-hub.yml`** exercises the **p31ca.org** hub (`hub:ci` under `software/p31ca`). **`phosphorus31.org`** (e.g. `phosphorus31.org/planetary-planet` in this monorepo) has its **own** build and Pages project; treat it as a **parallel** track so changes do not get conflated with the technical hub unless you intend one coordinated release.

## Pages deploy safety

The Pages project name **`p31ca`** may attach **multiple custom domains** to one production artifact. Deploying a new `dist/` replaces that artifact for the chosen branch—confirm project, branch, and domain impact before `wrangler pages deploy`. See the footer of `docs/WORKER_PAGES_MANIFEST.md`.

## Secrets and environment

Never commit `.env.master`, `.dev.vars`, or API tokens. Use `wrangler secret put` and GitHub Actions secrets as documented in the bouncer secrets index and package READMEs.
