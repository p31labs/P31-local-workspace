# P31 Orchestrator — Love-Ledger + Orchestrator

Cloudflare Worker powering the P31 Labs love-ledger and orchestrator services.

## What This Does

- Orchestrates inter-service coordination across the P31 mesh
- Token ledger for the L.O.V.E. Protocol
- Health endpoint for monitoring
- KV-backed state management

## Architecture

```
┌─────────────────────────────────────────┐
│         p31-orchestrator (Worker)        │
│  ┌─────────────┐    ┌──────────────┐    │
│  │  love-ledger │    │  orchestrator │   │
│  │   module     │    │   module      │   │
│  └──────┬───────┘    └──────┬───────┘    │
│         │                   │            │
│  ┌──────┴───────────────────┴───────┐    │
│  │         KV Namespace              │    │
│  └──────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

## Modules

| Module | Description |
|--------|-------------|
| `src/version.ts` | VERSION constant (`getVersion()`) |
| `src/health.ts` | Health endpoint with structured response |

## Development

```bash
npm install
npm run dev
```

## Testing

```bash
npm test
```

Uses Vitest with v8 coverage. Integration tests live in `tests/integration/`.

## Deployment

See [DEPLOY.md](./DEPLOY.md) for deployment procedures.

## Health Check

```bash
curl <worker-endpoint>/health
```

Expected response:
```json
{
  "service": "p31-orchestrator",
  "status": "ok",
  "version": "1.0.0",
  "timestamp": "<ISO-8601>"
}
```

## Security

- All worker inputs validated through schema checks
- Crypto references in rate limiting and auth middleware
- Secrets managed via `wrangler secret put`
- Bearer token auth for protected endpoints

## License

MIT — P31 Labs
