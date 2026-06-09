# P31 Bouncer Worker

Definitive narrative: **`SECURITY_SECRETS_MANIFEST.md`**.  
Machine index (bundled): **`src/secrets-index.json`**.

## Deploy

```bash
cd software/cloudflare-worker/bouncer
npm install
npx wrangler secret put BOUNCER_GATE_TOKEN
npm run deploy
```

### CI / automation

- **Bootstrap GitHub** from `.env.master`: `gh auth login`, then `pnpm run automate:bootstrap` (from `software`) — sets `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, optional `BOUNCER_GATE_TOKEN`, optional `COMMAND_CENTER_STATUS_TOKEN`.
- **GitHub Actions** (`.github/workflows/p31-automation.yml`): on push / manual dispatch, deploys this Worker. If repo secret **`BOUNCER_GATE_TOKEN`** is set, the workflow runs `wrangler secret put` before deploy so you never paste the token locally.
- Repo secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` (required); `BOUNCER_GATE_TOKEN` (recommended for full automation).
- **Local** (all edge Workers): `pnpm run automate:deploy:edge` from `software`.

## Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | — | Liveness |
| GET | `/` | — | Service metadata |
| GET | `/v1/secrets-index` | — | Full JSON index (no secret values) |
| GET | `/v1/gate` | `Authorization: Bearer <BOUNCER_GATE_TOKEN>` | Returns `{ ok: true }` if token matches |

## Update the inventory

Edit `src/secrets-index.json` and `SECURITY_SECRETS_MANIFEST.md`, then redeploy.
