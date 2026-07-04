# Monitoring & Observability

## Overview

PHOS uses Cloudflare's native observability stack:

- **Workers Observability**: Logs, metrics, and queries in one place
- **D1 Analytics**: Query volume, latency, and storage metrics
- **Structured Logs**: JSON events indexed by key for fast querying
- **Real-time Logs**: `wrangler tail` for live debugging

## Workers Observability

Access: Cloudflare Dashboard → Workers & Pages → Observability

### Key Views
- **Overview Tab**: All logs in one place
- **Invocations View**: Grouped by trigger
- **Events View**: Chronological stream
- **Query Builder**: Structured queries and visualizations

### Sample Queries

**Find slow requests (p95 wall time > 500ms):**
```
SELECT path, p95(wallTimeMs) as p95_wall_time
WHERE wallTimeMs > 500
GROUP BY path
ORDER BY p95_wall_time DESC
```

**Identify 5XX errors by path:**
```
SELECT path, COUNT(*) as error_count
WHERE statusCode >= 500
GROUP BY path
ORDER BY error_count DESC
```

## D1 Metrics

Access: Cloudflare Dashboard → D1 → [Database] → Metrics

| Metric | Alert Threshold |
|--------|-----------------|
| Rows Read | > 100,000 per hour |
| Query Latency (p95) | > 100ms |
| Write Queries | > 1,000 per hour |
| Storage Growth | > 10% week-over-week |

## Real-time Logs

```bash
# Tail all logs
npx wrangler tail

# Filter by event type
npx wrangler tail --format json | jq 'select(.event == "vote_cast")'

# Sample 10% of traffic
npx wrangler tail --head-sampling-rate 0.1
```

## Structured Log Schema

All Workers emit JSON with this shape:

```json
{
  "event": "vote_cast",
  "service": "governance-engine",
  "level": "info",
  "timestamp": 1710000000000,
  "did": "did:key:...",
  "success": true,
  "durationMs": 42
}
```
