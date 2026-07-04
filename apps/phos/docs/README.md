# PHOS — Sovereign Edge Architecture

A zero-telemetry, edge-native sovereign computing stack built on Cloudflare Workers and D1.

## 🏗️ Architecture

- **love-ledger**: LOVE token ledger with D1 persistence
- **contract-engine**: ROCCA smart contract lifecycle
- **governance-engine**: Constitutional DAO with liquid democracy

## 🚀 Live Endpoints

| Service | URL |
|---------|-----|
| love-ledger | https://love-ledger.trimtab-signal.workers.dev |
| contract-engine | https://contract-engine.trimtab-signal.workers.dev |
| governance-engine | https://governance-engine.trimtab-signal.workers.dev |

## 📊 Monitoring

- **Workers Logs**: Cloudflare Dashboard → Workers & Pages → [Worker] → Observability
- **D1 Metrics**: Cloudflare Dashboard → D1 → [Database] → Metrics
- **Real-time logs**: `npx wrangler tail`

## 🔐 All mutations are Ed25519-signed via `did:key`
