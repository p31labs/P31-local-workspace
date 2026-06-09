# P31 Cloud Hub (full squeeze)

All-in-one Cloudflare account inventory inside the **Command Center** Worker. No third-party dashboard; your API token never reaches the browser.

| URL | Purpose |
|-----|---------|
| `/cloud` | Full UI (all sections below) |
| `GET /api/cf/summary` | Same JSON (use `Authorization: Bearer <STATUS_TOKEN>`) |

**Cache:** KV key `p31_cf_hub_cache_v3`, TTL **180s**. `?refresh=1` bypasses cache.

## What gets pulled (read API)

Parallel account calls:

- Account metadata  
- **Workers** — all script names (paginated, up to 20 × 100 rows)  
- **Pages** — projects  
- **KV** — namespaces  
- **R2** — buckets  
- **D1** — `d1/database`, fallback `d1/databases` if needed  
- **Queues**  
- **Hyperdrive** — configs  
- **Workers for Platforms** — dispatch namespaces  
- **Durable Objects** — namespaces  
- **workers.dev subdomain** settings  
- **Turnstile** — widgets  
- **Vectorize** — indexes  
- **Cloudflare Access** — applications  
- **Tunnels** — `cfd_tunnel`, fallback `tunnels`  
- **Zones** — all zones on the account  
- **Per-zone Worker routes** — `GET /zones/:id/workers/routes` (batched, 6 zones at a time)

Sections that your token lacks permission for will show a **red error card** with the API message (often 403).

## API token (recommended: custom read-only)

Create at **My Profile → API Tokens → Create Custom Token**:

| Resource | Permission |
|----------|------------|
| Account | Account Settings — **Read** |
| Account | Workers Scripts — **Read** |
| Account | Workers KV Storage — **Read** |
| Account | Cloudflare Pages — **Read** |
| Account | Workers R2 Storage — **Read** |
| Account | D1 — **Read** |
| Account | Queues — **Read** |
| Account | Workers Tail — *Read* (optional) |
| Account | Cloudflare Tunnel — **Read** (for tunnels) |
| Account | Zero Trust — **Read** (for Access apps) |
| Zone | Workers Routes — **Read** (for per-zone routes) |
| Zone | DNS — **Read** (zones list uses account filter; zone read helps) |

Start with **Account**-level permissions; add **Zone** permissions if zones or routes fail.

```bash
cd software/cloudflare-worker/command-center
npx wrangler secret put CF_API_TOKEN
```

## Operator auth

Same **`STATUS_TOKEN`** as `POST /api/status`. The `/cloud` UI stores it in `sessionStorage` as `p31_cloud_hub_tok`.

## Security

- Responses are `noindex`.  
- Prefer **Cloudflare Access** on `command-center.trimtab-signal.workers.dev` for zero-trust gating.  
- Rotate `CF_API_TOKEN` if leaked; it is only in Worker secrets.

## Limits

- Cloudflare **rate limits** apply; heavy accounts may need a longer cache TTL or fewer zones.  
- KV **value size** cap (~25 MB); if the JSON exceeds that, shorten pagination or exclude noisy fields (not implemented yet).
