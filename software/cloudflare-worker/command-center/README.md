# EPCP Command Center

**Production URL:** https://command-center.trimtab-signal.workers.dev  
**Status:** ✅ **OPERATIONAL**  
**Cost:** ~$0.02/month  

Enterprise Production Control Panel (EPCP) — a hardened, edge-native command center for monitoring and managing distributed worker fleets with Zero Trust IAM, immutable audit trails, and forensics storage.

## Features

- 🔐 **Zero Trust IAM** — Cloudflare Access JWT validation with MFA
- 📊 **Operational Dashboard** — Real-time fleet monitoring (26 nodes)
- 🗄️ **Immutable Audit** — D1 database with HMAC-signed events
- 💾 **Forensics Storage** — 4-tier R2 lifecycle (hot/cold/artifacts/exports)
- 🚨 **Emergency Controls** — Panic quarantine & rollback (<60s MTTR)
- ⚡ **High Performance** — 11 KiB bundle, <500ms load

## Quick Start

### Deploy
```bash
./deploy.sh   # Automated: migrations + deploy
```

### Manual Deploy
```bash
npx wrangler@4 deploy
```

### Local Development
```bash
npx wrangler@4 dev src/index.js --port 8787 --local
```

## Testing

```bash
# Integration tests
npm run test:integration

# Security tests
npm run test:security

# Performance tests
npm run test:perf

# Full test suite
npm run test:all
```

## Architecture

```
Cloudflare Access (SSO+MFA) → Workers (IAM) → KV / D1 / R2
                                                    ↓
                                              Dashboard (Vanilla JS)
```

### Data Layer

**D1 Database:** `epcp-audit`
- `events` — Append-only audit log (HMAC-signed)
- `budgets` — Budget tracking
- `fleet_status` — Current state cache
- `forensic_artifacts` — Document registry

**R2 Buckets:**
- `p31-epcp-forensics-hot` — Active diffs (90d)
- `p31-epcp-forensics-cold` — Legal hold (7y)
- `p31-epcp-artifacts` — Rollback bundles
- `p31-epcp-audit-exports` — Discovery exports

## API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/` | GET | None | Dashboard |
| `/api/health` | GET | None | Health check |
| `/api/status` | GET | None | Fleet status |
| `/api/status` | POST | Operator+ | Update status |
| `/api/whoami` | GET | None | Identity |
| `/api/cf/summary` | GET | Reader | CF account |

## Performance

| Metric | Target | Actual |
|--------|--------|--------|
| Auth | <5ms | ~3ms |
| KV Read | <10ms | ~5ms |
| D1 Write | <50ms | ~25ms |
| Dashboard | <500ms | ~200ms |

## Security

- **CSP:** Strict policy
- **X-Frame-Options:** DENY
- **IAM:** Cloudflare Access with MFA
- **RBAC:** reader → operator → admin → legal
- **Audit:** HMAC-signed D1 events

## Documentation

- [Complete Implementation](EPCP_COMPLETE.md) — Full technical report
- [Deployment](DEPLOYMENT_VERIFICATION.md) — Live verification
- [Status](STATUS.md) — Live system dashboard
- [Test Results](ECP_TEST_RESULTS.md) — Test coverage

## License

P31 Labs — Proprietary

---

**Status:** ✅ Production Ready  
**Last Updated:** 2026-04-23
