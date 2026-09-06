# Andromeda Gateway

Mesh gateway worker for `andromeda.classicwilly.eth`. Serves the P31 Spatial Oasis landing page and routes traffic to sovereign infrastructure endpoints.

## Endpoints

| Path | Target |
|------|--------|
| `/` | Andromeda gateway landing page |
| `/health` | JSON health check |

## Outbound Links

- Jitterbug API: `https://jitterbug-api.trimtab-signal.workers.dev`
- K₄ Cage: `https://k4-cage.trimtab-signal.workers.dev`
- P31 CLI: `https://cli.p31ca.org`
- GitHub: `https://github.com/p31labs`

## Deployment

```bash
cd software/packages/andromeda-gateway
npx wrangler deploy
```

## ENS Binding

Point `andromeda.classicwilly.eth` to this worker via Cloudflare Worker routing or DNS.
