# phos — Deployment

## One-Command Deploy

```bash
./deploy.sh
```

This runs the full pipeline: proxy deploy → build → Pages deploy.

## Manual Steps

### Build
```bash
npm run build
```
Output: `dist/`

### Deploy Proxy (CVE-2026-29779)
```bash
cd worker-ai-proxy
./deploy.sh
```
Sets secrets via `wrangler secret put`, deploys worker, verifies health.

### Deploy (Cloudflare Pages)
```bash
npx wrangler pages deploy dist --project-name phos --branch main
```

## Health
```bash
curl https://phos.p31ca.org/health
```

## Verify CVE Fix
```bash
./verify-cve.sh
```
Checks that no `PUBLIC_EDGE_AI_TOKEN` or `PUBLIC_JITTERBUG_PSK` appear in `.env`, source, or built bundle.
